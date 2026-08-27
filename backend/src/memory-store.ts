import type {
  BlockProjection,
  ExecutionProjection,
  Network,
  PolicyProjection,
  TransactionKind,
  TransactionStatus,
  SyncCursor,
  VocapStore,
} from "./types.js";
import { assertTransactionTransition } from "./transaction-state.js";

/** Test fixture only. Production authority is PostgreSQL plus confirmed chain state. */
export class MemoryStore implements VocapStore {
  public readonly policies = new Map<string, PolicyProjection>();
  public readonly executions = new Map<string, ExecutionProjection>();
  public readonly transactions = new Map<string, { kind: TransactionKind; status: TransactionStatus }>();
  private readonly cursors = new Map<string, SyncCursor>();
  private readonly indexedBlocks = new Map<string, string>();

  public async migrate(): Promise<void> {}

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
    const key = `${network}:${routerAddress}`;
    const current = this.cursors.get(key);
    if (current !== undefined) return current;
    const initial = { nextBlock: startBlock, blockHash: null };
    this.cursors.set(key, initial);
    return initial;
  }

  public async applyBlock(projection: BlockProjection): Promise<void> {
    const cursorKey = `${projection.network}:${projection.routerAddress}`;
    const cursor = this.cursors.get(cursorKey) ?? {
      nextBlock: projection.blockNumber,
      blockHash: null,
    };
    const blockKey = `${cursorKey}:${projection.blockNumber}`;
    const previousHash = this.indexedBlocks.get(blockKey);
    if (cursor.nextBlock > projection.blockNumber) {
      if (previousHash?.toLowerCase() === projection.blockHash.toLowerCase()) return;
      throw new Error(`chain reorganization detected at ${blockKey}`);
    }
    if (cursor.nextBlock !== projection.blockNumber) {
      throw new Error(`unexpected block ${projection.blockNumber}, expected ${cursor.nextBlock}`);
    }
    if (cursor.blockHash !== null && projection.parentHash === undefined) {
      throw new Error(`missing parent hash before ${blockKey}`);
    }
    if (
      cursor.blockHash !== null &&
      cursor.blockHash.toLowerCase() !== projection.parentHash!.toLowerCase()
    ) {
      throw new Error(`chain reorganization detected before ${blockKey}`);
    }
    for (const policy of projection.policies) {
      this.policies.set(policyKey(policy), policy);
    }
    for (const policy of projection.policyEnabled) {
      const key = `${policy.network}:${policy.routerAddress}:${policy.policyId}`;
      const current = this.policies.get(key);
      if (!current) {
        throw new Error(`policy ${policy.policyId} was enabled before it was created`);
      }
      this.policies.set(key, {
        ...current,
        enabled: policy.enabled,
        blockNumber: policy.blockNumber,
        txHash: policy.txHash,
      });
    }
    for (const execution of projection.executions) {
      this.executions.set(execution.eventKey, execution);
    }
    this.indexedBlocks.set(blockKey, projection.blockHash);
    this.cursors.set(cursorKey, {
      nextBlock: projection.blockNumber + 1,
      blockHash: projection.blockHash,
    });
  }

  public async registerTransaction(
    network: Network,
    txHash: string,
    kind: TransactionKind,
  ): Promise<void> {
    const key = `${network}:${txHash}`;
    if (!this.transactions.has(key)) {
      this.transactions.set(key, { kind, status: "pending" });
    }
  }

  public async updateTransactionStatus(
    network: Network,
    txHash: string,
    status: TransactionStatus,
  ): Promise<void> {
    const key = `${network}:${txHash}`;
    const current = this.transactions.get(key);
    if (!current) throw new Error(`transaction ${txHash} was not registered`);
    assertTransactionTransition(current.status, status);
    this.transactions.set(key, { ...current, status });
  }

  public async observeReceipt(
    network: Network,
    txHash: string,
    status: TransactionStatus,
  ): Promise<void> {
    const key = `${network}:${txHash}`;
    const current = this.transactions.get(key);
    if (!current) return;
    assertTransactionTransition(current.status, status);
    this.transactions.set(key, { ...current, status });
  }

  public async close(): Promise<void> {}
}

function policyKey(policy: PolicyProjection): string {
  return `${policy.network}:${policy.routerAddress}:${policy.policyId}`;
}
