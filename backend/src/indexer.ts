import type { ChainBlock, ChainReader, ChainReceipt } from "./chain.js";
import { parseRouterEvent } from "./events.js";
import { normalizeAddress } from "./config.js";
import { isConfirmedSuccessfulReceipt, receiptStatusOrPending } from "./transaction-state.js";
import type {
  BlockProjection,
  ExecutionProjection,
  Network,
  PolicyEnabledProjection,
  PolicyProjection,
  VocapStore,
} from "./types.js";

export interface IndexerOptions {
  network: Network;
  routerAddress: string;
  startBlock: number;
  chunkSize: number;
}

export interface SyncResult {
  fromBlock: number;
  toBlock: number | null;
  blocks: number;
  executions: number;
}

export class RouterIndexer {
  private readonly options: IndexerOptions;

  public constructor(
    private readonly reader: ChainReader,
    private readonly store: VocapStore,
    options: IndexerOptions,
  ) {
    this.options = {
      ...options,
      routerAddress: normalizeAddress(options.routerAddress),
    };
  }

  public async syncOnce(): Promise<SyncResult> {
    const cursorState = await this.store.getCursorState(
      this.options.network,
      this.options.routerAddress,
      this.options.startBlock,
    );
    const cursor = cursorState.nextBlock;
    const latest = await this.reader.getLatestBlockNumber();
    if (cursor > latest) {
      return { fromBlock: cursor, toBlock: null, blocks: 0, executions: 0 };
    }

    const end = Math.min(cursor + this.options.chunkSize - 1, latest);
    let executionCount = 0;
    for (let blockNumber = cursor; blockNumber <= end; blockNumber += 1) {
      const block = await this.reader.getBlockWithReceipts(blockNumber);
      if (block.blockNumber !== blockNumber) {
        throw new Error(
          `RPC returned block ${block.blockNumber} while requesting ${blockNumber}`,
        );
      }
      const projection = projectBlock(this.options.network, this.options.routerAddress, block);
      executionCount += projection.executions.length;
      await this.store.applyBlock(projection);
      for (const receipt of block.receipts) {
        const status = receiptStatusOrPending(receipt);
        if (status !== "pending") {
          await this.store.observeReceipt(this.options.network, receipt.transactionHash, status);
        }
      }
    }

    return {
      fromBlock: cursor,
      toBlock: end,
      blocks: end - cursor + 1,
      executions: executionCount,
    };
  }
}

export function projectBlock(
  network: Network,
  routerAddress: string,
  block: ChainBlock,
): BlockProjection {
  const policies: PolicyProjection[] = [];
  const policyEnabled: PolicyEnabledProjection[] = [];
  const executions: ExecutionProjection[] = [];

  block.receipts.forEach((receipt, receiptIndex) => {
    projectReceipt(
      network,
      routerAddress,
      block,
      receipt,
      receiptIndex,
      policies,
      policyEnabled,
      executions,
    );
  });

  return {
    network,
    routerAddress,
    blockNumber: block.blockNumber,
    blockHash: block.blockHash,
    ...(block.parentHash === undefined ? {} : { parentHash: block.parentHash }),
    policies,
    policyEnabled,
    executions,
  };
}

function projectReceipt(
  network: Network,
  routerAddress: string,
  block: ChainBlock,
  receipt: ChainReceipt,
  _receiptIndex: number,
  policies: PolicyProjection[],
  policyEnabled: PolicyEnabledProjection[],
  executions: ExecutionProjection[],
): void {
  if (!isConfirmedSuccessfulReceipt(receipt)) return;

  receipt.events.forEach((event, eventIndex) => {
    const parsed = parseRouterEvent(routerAddress, event);
    if (!parsed) return;

    if (parsed.kind === "policy_created") {
      policies.push({
        network,
        routerAddress,
        policyId: parsed.policyId,
        tokenAddress: parsed.tokenAddress,
        amount: parsed.amount,
        targetAddress: parsed.targetAddress,
        selector: parsed.selector,
        enabled: true,
        mode: "RETURN",
        blockNumber: block.blockNumber,
        txHash: receipt.transactionHash,
      });
      return;
    }

    if (parsed.kind === "policy_enabled") {
      policyEnabled.push({
        network,
        routerAddress,
        policyId: parsed.policyId,
        enabled: parsed.enabled,
        blockNumber: block.blockNumber,
        txHash: receipt.transactionHash,
      });
      return;
    }

    executions.push({
      eventKey: `${network}:${routerAddress}:${receipt.transactionHash}:${eventIndex}`,
      network,
      routerAddress,
      txHash: receipt.transactionHash,
      eventIndex,
      blockNumber: block.blockNumber,
      blockHash: block.blockHash,
      policyId: parsed.policyId,
      targetAddress: parsed.targetAddress,
      selector: parsed.selector,
      tokenAddress: parsed.tokenAddress,
      amount: parsed.amount,
      noteId: parsed.noteId,
      status: "accepted",
    });
  });
}
