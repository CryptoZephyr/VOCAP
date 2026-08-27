export type Network = "sepolia" | "mainnet" | "devnet";

export type LifecycleMode = "RETURN";

export type TransactionStatus = "pending" | "accepted" | "rejected" | "reverted";

export type TransactionKind =
  | "policy_create"
  | "policy_enable"
  | "router_execution"
  | "capability_transfer"
  | "unknown";

export interface PolicyProjection {
  network: Network;
  routerAddress: string;
  policyId: string;
  tokenAddress: string;
  amount: string;
  targetAddress: string;
  selector: string;
  enabled: boolean;
  mode: LifecycleMode;
  blockNumber: number;
  txHash: string;
}

export interface PolicyEnabledProjection {
  network: Network;
  routerAddress: string;
  policyId: string;
  enabled: boolean;
  blockNumber: number;
  txHash: string;
}

export interface ExecutionProjection {
  eventKey: string;
  network: Network;
  routerAddress: string;
  txHash: string;
  eventIndex: number;
  blockNumber: number;
  blockHash: string;
  policyId: string;
  targetAddress: string;
  selector: string;
  tokenAddress: string;
  amount: string;
  noteId: string;
  status: "accepted";
}

export interface BlockProjection {
  network: Network;
  routerAddress: string;
  blockNumber: number;
  blockHash: string;
  parentHash?: string;
  policies: PolicyProjection[];
  policyEnabled: PolicyEnabledProjection[];
  executions: ExecutionProjection[];
}

export interface SyncCursor {
  nextBlock: number;
  blockHash: string | null;
}

export interface VocapStore {
  migrate(): Promise<void>;
  getCursor(network: Network, routerAddress: string, startBlock: number): Promise<number>;
  getCursorState(network: Network, routerAddress: string, startBlock: number): Promise<SyncCursor>;
  applyBlock(projection: BlockProjection): Promise<void>;
  registerTransaction(network: Network, txHash: string, kind: TransactionKind): Promise<void>;
  updateTransactionStatus(
    network: Network,
    txHash: string,
    status: TransactionStatus,
  ): Promise<void>;
  observeReceipt(network: Network, txHash: string, status: TransactionStatus): Promise<void>;
  close(): Promise<void>;
}
