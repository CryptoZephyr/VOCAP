import { RpcProvider } from "starknet";
import type { RawRouterEvent } from "./events.js";

export interface ChainReceipt {
  transactionHash: string;
  executionStatus?: string;
  finalityStatus?: string;
  events: RawRouterEvent[];
}

export interface ChainBlock {
  blockNumber: number;
  blockHash: string;
  receipts: ChainReceipt[];
}

export interface ChainReader {
  getLatestBlockNumber(): Promise<number>;
  getBlockWithReceipts(blockNumber: number): Promise<ChainBlock>;
}

export class StarknetChainReader implements ChainReader {
  private readonly provider: RpcProvider;

  public constructor(rpcUrl: string) {
    this.provider = new RpcProvider({ nodeUrl: rpcUrl, batch: 0 });
  }

  public getLatestBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  public async getBlockWithReceipts(blockNumber: number): Promise<ChainBlock> {
    const raw = (await this.provider.getBlockWithReceipts(blockNumber)) as unknown as Record<
      string,
      unknown
    >;

    return readBlockWithReceipts(raw, blockNumber);
  }
}

export function readBlockWithReceipts(value: unknown, fallbackBlockNumber: number): ChainBlock {
  const raw = readRecord(value, "block");
  const hasTopLevelReceipts = Array.isArray(raw.receipts);
  const rawEntries = readArray(
    hasTopLevelReceipts ? raw.receipts : raw.transactions,
    hasTopLevelReceipts ? "receipts" : "transactions",
  );

  return {
    blockNumber: readNumber(raw.block_number, fallbackBlockNumber),
    blockHash: readString(raw.block_hash, "block_hash"),
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
  return typeof value === "number" ? value : fallback;
}

function readStringArray(value: unknown, label: string): string[] {
  const values = readArray(value, label);
  return values.map((item) => readString(item, label));
}
