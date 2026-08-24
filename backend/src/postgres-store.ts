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
  VocapStore,
} from "./types.js";
import { assertTransactionTransition } from "./transaction-state.js";

export class PostgresStore implements VocapStore {
  public constructor(private readonly pool: Pool) {}

  public async migrate(): Promise<void> {
    await this.pool.query(await loadMigrationSql());
  }

  public async getCursor(network: Network, startBlock: number): Promise<number> {
    const result = await this.pool.query<{ next_block: string }>(
      `
        INSERT INTO vocap_sync_cursors (network, next_block)
        VALUES ($1, $2)
        ON CONFLICT (network) DO NOTHING
        RETURNING next_block
      `,
      [network, startBlock],
    );

    if (result.rows[0]) {
      return Number(result.rows[0].next_block);
    }

    const existing = await this.pool.query<{ next_block: string }>(
      "SELECT next_block FROM vocap_sync_cursors WHERE network = $1",
      [network],
    );
    const cursor = existing.rows[0]?.next_block;
    if (cursor === undefined) {
      throw new Error(`sync cursor disappeared for network ${network}`);
    }
    return Number(cursor);
  }

  public async applyBlock(projection: BlockProjection): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
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
          INSERT INTO vocap_sync_cursors (network, next_block)
          VALUES ($1, $2)
          ON CONFLICT (network) DO UPDATE
          SET next_block = GREATEST(vocap_sync_cursors.next_block, EXCLUDED.next_block),
              updated_at = now()
        `,
        [projection.network, projection.blockNumber + 1],
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
    const current = await this.pool.query<{ status: TransactionStatus }>(
      "SELECT status FROM vocap_transactions WHERE network = $1 AND tx_hash = $2",
      [network, txHash],
    );
    const existing = current.rows[0]?.status;
    if (!existing) {
      throw new Error(`transaction ${txHash} was not registered`);
    }
    assertTransactionTransition(existing, status);
    await this.pool.query(
      `
        UPDATE vocap_transactions
        SET status = $3,
            confirmed_at = CASE WHEN $3 = 'pending' THEN confirmed_at ELSE COALESCE(confirmed_at, now()) END
        WHERE network = $1 AND tx_hash = $2
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
