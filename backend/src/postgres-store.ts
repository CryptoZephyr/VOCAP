import { Pool, type PoolClient } from "pg";
import { loadMigrationSql } from "./schema.js";
import type {
  BlockProjection,
  ExecutionProjection,
  Network,
  PolicyEnabledProjection,
  PolicyProjection,
  TransactionKind,
  TransactionStatus,
  SyncCursor,
  VocapStore,
} from "./types.js";
import { assertTransactionTransition } from "./transaction-state.js";

export class PostgresStore implements VocapStore {
  public constructor(private readonly pool: Pool) {}

  public async migrate(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(await loadMigrationSql());
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  public async assertSchemaReady(): Promise<void> {
    try {
      await this.pool.query("SELECT 1 FROM vocap_sync_cursors LIMIT 0");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `VOCAP database schema check failed. Run corepack pnpm migrate with the migration role and grant the runtime role application access: ${message}`,
      );
    }
  }

  public async getCursor(network: Network, routerAddress: string, startBlock: number): Promise<number>;
  public async getCursor(network: Network, startBlock: number): Promise<number>;
  public async getCursor(
    network: Network,
    routerAddressOrStartBlock: string | number,
    maybeStartBlock?: number,
  ): Promise<number> {
    const routerAddress = typeof routerAddressOrStartBlock === "string" ? routerAddressOrStartBlock : "__legacy__";
    const startBlock = typeof routerAddressOrStartBlock === "number" ? routerAddressOrStartBlock : maybeStartBlock;
    if (startBlock === undefined) throw new Error("start block is required");
    return (await this.getCursorState(network, routerAddress, startBlock)).nextBlock;
  }

  public async getCursorState(
    network: Network,
    routerAddress: string,
    startBlock: number,
  ): Promise<SyncCursor> {
    const result = await this.pool.query<{ next_block: string; block_hash: string | null }>(
      `
        INSERT INTO vocap_sync_cursors (network, router_address, next_block)
        VALUES ($1, $2, $3)
        ON CONFLICT (network, router_address) DO NOTHING
        RETURNING next_block, block_hash
      `,
      [network, routerAddress, startBlock],
    );

    if (result.rows[0]) {
      return {
        nextBlock: Number(result.rows[0].next_block),
        blockHash: result.rows[0].block_hash,
      };
    }

    const existing = await this.pool.query<{ next_block: string; block_hash: string | null }>(
      "SELECT next_block, block_hash FROM vocap_sync_cursors WHERE network = $1 AND router_address = $2",
      [network, routerAddress],
    );
    const cursor = existing.rows[0];
    if (cursor === undefined) {
      throw new Error(`sync cursor disappeared for ${network}:${routerAddress}`);
    }
    return {
      nextBlock: Number(cursor.next_block),
      blockHash: cursor.block_hash,
    };
  }

  public async applyBlock(projection: BlockProjection): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `
          INSERT INTO vocap_sync_cursors (network, router_address, next_block)
          VALUES ($1, $2, $3)
          ON CONFLICT (network, router_address) DO NOTHING
        `,
        [projection.network, projection.routerAddress, projection.blockNumber],
      );
      const cursorResult = await client.query<{ next_block: string; block_hash: string | null }>(
        `
          SELECT next_block, block_hash
          FROM vocap_sync_cursors
          WHERE network = $1 AND router_address = $2
          FOR UPDATE
        `,
        [projection.network, projection.routerAddress],
      );
      const cursor = cursorResult.rows[0];
      if (!cursor) throw new Error("sync cursor disappeared during block application");

      if (Number(cursor.next_block) > projection.blockNumber) {
        const indexed = await client.query<{ block_hash: string }>(
          `
            SELECT block_hash FROM vocap_indexed_blocks
            WHERE network = $1 AND router_address = $2 AND block_number = $3
          `,
          [projection.network, projection.routerAddress, projection.blockNumber],
        );
        if (indexed.rows[0]?.block_hash?.toLowerCase() === projection.blockHash.toLowerCase()) {
          await client.query("COMMIT");
          return;
        }
        throw new Error(
          `chain reorganization detected at ${projection.network}:${projection.routerAddress}:${projection.blockNumber}`,
        );
      }
      if (Number(cursor.next_block) !== projection.blockNumber) {
        throw new Error(
          `unexpected block ${projection.blockNumber}, expected ${cursor.next_block}`,
        );
      }
      if (cursor.block_hash !== null && projection.parentHash === undefined) {
        throw new Error(
          `missing parent hash before ${projection.network}:${projection.routerAddress}:${projection.blockNumber}`,
        );
      }
      if (
        cursor.block_hash !== null &&
        cursor.block_hash.toLowerCase() !== projection.parentHash!.toLowerCase()
      ) {
        throw new Error(
          `chain reorganization detected before ${projection.network}:${projection.routerAddress}:${projection.blockNumber}`,
        );
      }
      for (const policy of projection.policies) {
        await upsertPolicy(client, policy);
      }
      for (const policy of projection.policyEnabled) {
        await updatePolicyEnabled(client, policy);
      }
      for (const execution of projection.executions) {
        await insertExecution(client, execution);
      }
      await client.query(
        `
          INSERT INTO vocap_indexed_blocks (
            network, router_address, block_number, block_hash, parent_hash
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          projection.network,
          projection.routerAddress,
          projection.blockNumber,
          projection.blockHash,
          projection.parentHash ?? null,
        ],
      );
      await client.query(
        `
          UPDATE vocap_sync_cursors
          SET next_block = $3, block_hash = $4, updated_at = now()
          WHERE network = $1 AND router_address = $2
        `,
        [
          projection.network,
          projection.routerAddress,
          projection.blockNumber + 1,
          projection.blockHash,
        ],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  public async registerTransaction(
    network: Network,
    txHash: string,
    kind: TransactionKind,
  ): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO vocap_transactions (network, tx_hash, kind, status)
        VALUES ($1, $2, $3, 'pending')
        ON CONFLICT (network, tx_hash) DO NOTHING
      `,
      [network, txHash, kind],
    );
  }

  public async updateTransactionStatus(
    network: Network,
    txHash: string,
    status: TransactionStatus,
  ): Promise<void> {
    const updated = await this.pool.query(
      `
        UPDATE vocap_transactions
        SET status = $3,
            confirmed_at = CASE WHEN $3 = 'pending' THEN confirmed_at ELSE COALESCE(confirmed_at, now()) END
        WHERE network = $1 AND tx_hash = $2
          AND (status = $3 OR (status = 'pending' AND $3 IN ('accepted', 'rejected', 'reverted')))
      `,
      [network, txHash, status],
    );
    if (updated.rowCount === 1) return;

    const existing = await this.pool.query<{ status: TransactionStatus }>(
      "SELECT status FROM vocap_transactions WHERE network = $1 AND tx_hash = $2",
      [network, txHash],
    );
    const current = existing.rows[0]?.status;
    if (!current) throw new Error(`transaction ${txHash} was not registered`);
    assertTransactionTransition(current, status);
    throw new Error(`transaction ${txHash} status update raced with another writer`);
  }

  public async observeReceipt(
    network: Network,
    txHash: string,
    status: TransactionStatus,
  ): Promise<void> {
    await this.pool.query(
      `
        UPDATE vocap_transactions
        SET status = $3,
            confirmed_at = CASE WHEN $3 = 'pending' THEN confirmed_at ELSE COALESCE(confirmed_at, now()) END
        WHERE network = $1 AND tx_hash = $2
          AND (status = $3 OR (status = 'pending' AND $3 IN ('accepted', 'rejected', 'reverted')))
      `,
      [network, txHash, status],
    );
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

async function upsertPolicy(client: PoolClient, policy: PolicyProjection): Promise<void> {
  await client.query(
    `
      INSERT INTO vocap_policies (
        network, router_address, policy_id, token_address, amount,
        target_address, selector, enabled, mode, last_seen_block,
        last_seen_tx_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (network, router_address, policy_id) DO UPDATE SET
        token_address = EXCLUDED.token_address,
        amount = EXCLUDED.amount,
        target_address = EXCLUDED.target_address,
        selector = EXCLUDED.selector,
        enabled = EXCLUDED.enabled,
        mode = EXCLUDED.mode,
        last_seen_block = EXCLUDED.last_seen_block,
        last_seen_tx_hash = EXCLUDED.last_seen_tx_hash,
        updated_at = now()
    `,
    [
      policy.network,
      policy.routerAddress,
      policy.policyId,
      policy.tokenAddress,
      policy.amount,
      policy.targetAddress,
      policy.selector,
      policy.enabled,
      policy.mode,
      policy.blockNumber,
      policy.txHash,
    ],
  );
}

async function insertExecution(client: PoolClient, execution: ExecutionProjection): Promise<void> {
  await client.query(
    `
      INSERT INTO vocap_executions (
        event_key, network, router_address, tx_hash, event_index,
        block_number, block_hash, policy_id, target_address, selector,
        token_address, amount, note_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (event_key) DO NOTHING
    `,
    [
      execution.eventKey,
      execution.network,
      execution.routerAddress,
      execution.txHash,
      execution.eventIndex,
      execution.blockNumber,
      execution.blockHash,
      execution.policyId,
      execution.targetAddress,
      execution.selector,
      execution.tokenAddress,
      execution.amount,
      execution.noteId,
      execution.status,
    ],
  );
}

async function updatePolicyEnabled(
  client: PoolClient,
  policy: PolicyEnabledProjection,
): Promise<void> {
  const result = await client.query(
    `
      UPDATE vocap_policies
      SET enabled = $4,
          last_seen_block = $5,
          last_seen_tx_hash = $6,
          updated_at = now()
      WHERE network = $1 AND router_address = $2 AND policy_id = $3
    `,
    [
      policy.network,
      policy.routerAddress,
      policy.policyId,
      policy.enabled,
      policy.blockNumber,
      policy.txHash,
    ],
  );
  if (result.rowCount !== 1) {
    throw new Error(`policy ${policy.policyId} was enabled before it was created`);
  }
}
