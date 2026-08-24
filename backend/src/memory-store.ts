import type {
  BlockProjection,
  ExecutionProjection,
  Network,
  PolicyProjection,
  TransactionKind,
  TransactionStatus,
  VocapStore,
} from "./types.js";
import { assertTransactionTransition } from "./transaction-state.js";

/** Test fixture only. Production authority is PostgreSQL plus confirmed chain state. */
export class MemoryStore implements VocapStore {
  public readonly policies = new Map<string, PolicyProjection>();
  public readonly executions = new Map<string, ExecutionProjection>();
  public readonly transactions = new Map<string, { kind: TransactionKind; status: TransactionStatus }>();
  private readonly cursors = new Map<Network, number>();

  public async migrate(): Promise<void> {}

  public async getCursor(network: Network, startBlock: number): Promise<number> {
    const current = this.cursors.get(network);
    if (current !== undefined) return current;
    this.cursors.set(network, startBlock);
    return startBlock;
  }

  public async applyBlock(projection: BlockProjection): Promise<void> {
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
    this.cursors.set(projection.network, projection.blockNumber + 1);
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

  public async close(): Promise<void> {}
}

function policyKey(policy: PolicyProjection): string {
  return `${policy.network}:${policy.routerAddress}:${policy.policyId}`;
}
