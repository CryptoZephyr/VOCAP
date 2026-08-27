import { RpcProvider } from "starknet";
import type { RawRouterEvent } from "./events.js";
import type { Network } from "./types.js";

export interface ChainReceipt {
  transactionHash: string;
  executionStatus?: string;
  finalityStatus?: string;
  events: RawRouterEvent[];
}

export interface ChainBlock {
  blockNumber: number;
  blockHash: string;
  parentHash?: string;
  receipts: ChainReceipt[];
}

export interface ChainReader {
  getLatestBlockNumber(): Promise<number>;
  getBlockWithReceipts(blockNumber: number): Promise<ChainBlock>;
}

export class StarknetChainReader implements ChainReader {
  private readonly provider: RpcProvider;
  private readonly retries: number;
  private readonly retryDelayMs: number;

  public constructor(rpcUrl: string, options: { retries?: number; retryDelayMs?: number } = {}) {
    this.provider = new RpcProvider({ nodeUrl: rpcUrl, batch: 0 });
    this.retries = options.retries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 250;
  }

  public getLatestBlockNumber(): Promise<number> {
    return this.withRetry(() => this.provider.getBlockNumber());
  }

  public async verifyNetwork(network: Network): Promise<void> {
    const chainId = await this.withRetry(() =>
      (this.provider as unknown as { getChainId: () => Promise<string> }).getChainId(),
    );
    assertChainIdentity(network, chainId);
  }

  public async getBlockWithReceipts(blockNumber: number): Promise<ChainBlock> {
    const raw = (await this.withRetry(() => this.provider.getBlockWithReceipts(blockNumber))) as unknown as Record<
      string,
      unknown
    >;

    return readBlockWithReceipts(raw, blockNumber);
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === this.retries) break;
        await delay(this.retryDelayMs * 2 ** attempt);
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}

const expectedChainIds: Record<Network, readonly string[]> = {
  mainnet: ["SN_MAIN", "0X534E5F4D41494E"],
  sepolia: ["SN_SEPOLIA", "0X534E5F5345504F4C4941"],
  devnet: ["SN_DEVNET", "0X534E5F4445564E4554", "SN_GOERLI", "0X534E5F474F45524C49"],
};

export function assertChainIdentity(network: Network, chainId: string): void {
  const expected = expectedChainIds[network];
  if (!expected.includes(chainId.toUpperCase())) {
    throw new Error(`RPC chain identity mismatch: configured ${network}, received ${chainId}`);
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function readBlockWithReceipts(value: unknown, fallbackBlockNumber: number): ChainBlock {
  const raw = readRecord(value, "block");
  if (raw.block_number === undefined) {
    throw new Error("invalid block_number response");
  }
  const hasTopLevelReceipts = Array.isArray(raw.receipts);
  const rawEntries = readArray(
    hasTopLevelReceipts ? raw.receipts : raw.transactions,
    hasTopLevelReceipts ? "receipts" : "transactions",
  );

  return {
    blockNumber: readNumber(raw.block_number, fallbackBlockNumber),
    blockHash: readString(raw.block_hash, "block_hash"),
    ...(typeof raw.parent_hash === "string" ? { parentHash: raw.parent_hash } : {}),
    receipts: rawEntries.map(readReceiptEntry),
  };
}

function readReceiptEntry(value: unknown): ChainReceipt {
  const raw = readRecord(value, "receipt entry");
  return readReceipt(raw.receipt === undefined ? raw : raw.receipt);
}

function readReceipt(value: unknown): ChainReceipt {
  const raw = readRecord(value, "receipt");
  const rawEvents = readArray(raw.events, "events");
  const executionStatus = readOptionalString(raw.execution_status);
  const finalityStatus = readOptionalString(raw.finality_status);
  return {
    transactionHash: readString(raw.transaction_hash, "transaction_hash"),
    events: rawEvents.map(readEvent),
    ...(executionStatus === undefined ? {} : { executionStatus }),
    ...(finalityStatus === undefined ? {} : { finalityStatus }),
  };
}

function readEvent(value: unknown): RawRouterEvent {
  const raw = readRecord(value, "event");
  return {
    from_address: readString(raw.from_address, "from_address"),
    keys: readStringArray(raw.keys, "keys"),
    data: readStringArray(raw.data, "data"),
  };
}

function readRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`invalid ${label} response`);
  }
  return value as Record<string, unknown>;
}

function readArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`invalid ${label} response`);
  }
  return value;
}

function readString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`invalid ${label} response`);
  }
  return value;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown, fallback: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("invalid block_number response");
  }
  return value;
}

function readStringArray(value: unknown, label: string): string[] {
  const values = readArray(value, label);
  return values.map((item) => readString(item, label));
}
