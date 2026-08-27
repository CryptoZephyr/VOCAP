import { describe, expect, it } from "vitest";
import { MemoryStore } from "../src/memory-store.js";
import { ROUTER_EVENT_SELECTORS, parseRouterEvent } from "../src/events.js";
import { RouterIndexer } from "../src/indexer.js";
import type { ChainBlock, ChainReader } from "../src/chain.js";
import type { Network } from "../src/types.js";

const network: Network = "sepolia";
const router = "0x123";

function event(selector: string, keys: string[], data: string[], from = router) {
  return { from_address: from, keys: [selector, ...keys], data };
}

describe("router event parser", () => {
  it("decodes policy creation with canonical decimal values", () => {
    const parsed = parseRouterEvent(
      router,
      event(
        ROUTER_EVENT_SELECTORS.policyCreated,
        ["0x1"],
        ["0xabc", "0x2a", "0xdef", "0x1234"],
      ),
    );

    expect(parsed).toEqual({
      kind: "policy_created",
      policyId: "1",
      tokenAddress: "0xabc",
      amount: "42",
      targetAddress: "0xdef",
      selector: "0x1234",
    });
  });

  it("ignores events emitted by another contract", () => {
    expect(
      parseRouterEvent(
        router,
        event(ROUTER_EVENT_SELECTORS.policyExecuted, ["0x1"], ["0x1", "0x2", "0x3", "0x4", "0x5"], "0x999"),
      ),
    ).toBeNull();
  });

  it("matches equivalent router addresses with different leading-zero widths", () => {
    expect(
      parseRouterEvent(
        "0x0123",
        event(
          ROUTER_EVENT_SELECTORS.policyCreated,
          ["0x1"],
          ["0xabc", "0x2a", "0xdef", "0x1234"],
          "0x123",
        ),
      ),
    ).toMatchObject({ kind: "policy_created", policyId: "1" });
  });
});

describe("router indexer", () => {
  it("projects blocks, applies enabled updates, and replays idempotently", async () => {
    const blocks: ChainBlock[] = [
      {
        blockNumber: 10,
        blockHash: "0x10",
        receipts: [
          {
            transactionHash: "0xcreate",
            executionStatus: "SUCCEEDED",
            finalityStatus: "ACCEPTED_ON_L2",
            events: [
              event(
                ROUTER_EVENT_SELECTORS.policyCreated,
                ["0x1"],
                ["0xabc", "0x2a", "0xdef", "0x1234"],
              ),
            ],
          },
          {
            transactionHash: "0xexecute",
            executionStatus: "SUCCEEDED",
            finalityStatus: "ACCEPTED_ON_L2",
            events: [
              event(
                ROUTER_EVENT_SELECTORS.policyExecuted,
                ["0x1"],
                ["0xdef", "0x1234", "0xabc", "0x2a", "0xbeef"],
              ),
              event(ROUTER_EVENT_SELECTORS.policyEnabled, ["0x1"], ["0x0"]),
            ],
          },
        ],
      },
      { blockNumber: 11, blockHash: "0x11", parentHash: "0x10", receipts: [] },
    ];
    const reader: ChainReader = {
      getLatestBlockNumber: async () => 11,
      getBlockWithReceipts: async (blockNumber) => {
        const block = blocks.find((candidate) => candidate.blockNumber === blockNumber);
        if (!block) throw new Error(`missing fixture block ${blockNumber}`);
        return block;
      },
    };
    const store = new MemoryStore();
    const indexer = new RouterIndexer(reader, store, {
      network,
      routerAddress: router,
      startBlock: 10,
      chunkSize: 2,
    });

    await expect(indexer.syncOnce()).resolves.toMatchObject({
      fromBlock: 10,
      toBlock: 11,
      blocks: 2,
      executions: 1,
    });
    expect(store.policies.get("sepolia:0x123:1")?.enabled).toBe(false);
    expect(store.executions.size).toBe(1);

    await expect(indexer.syncOnce()).resolves.toMatchObject({
      fromBlock: 12,
      toBlock: null,
      blocks: 0,
      executions: 0,
    });
    expect(store.executions.size).toBe(1);
  });

  it("projects only successful finalized receipts", async () => {
    const successfulEvent = event(
      ROUTER_EVENT_SELECTORS.policyExecuted,
      ["0x1"],
      ["0xdef", "0x1234", "0xabc", "0x2a", "0xbeef"],
    );
    const blocks: ChainBlock[] = [
      {
        blockNumber: 20,
        blockHash: "0x20",
        receipts: [
          { transactionHash: "0xpending", events: [successfulEvent] },
          {
            transactionHash: "0xreverted",
            executionStatus: "REVERTED",
            finalityStatus: "ACCEPTED_ON_L2",
            events: [successfulEvent],
          },
          {
            transactionHash: "0xaccepted",
            executionStatus: "SUCCEEDED",
            finalityStatus: "ACCEPTED_ON_L2",
            events: [successfulEvent],
          },
        ],
      },
    ];
    const reader: ChainReader = {
      getLatestBlockNumber: async () => 20,
      getBlockWithReceipts: async () => blocks[0]!,
    };
    const store = new MemoryStore();
    const indexer = new RouterIndexer(reader, store, {
      network,
      routerAddress: router,
      startBlock: 20,
      chunkSize: 1,
    });

    await expect(indexer.syncOnce()).resolves.toMatchObject({ executions: 1 });
    expect([...store.executions.values()][0]?.txHash).toBe("0xaccepted");
  });

  it("fails closed when the next block does not extend the recorded hash", async () => {
    const firstReader: ChainReader = {
      getLatestBlockNumber: async () => 30,
      getBlockWithReceipts: async () => ({
        blockNumber: 30,
        blockHash: "0x30",
        receipts: [],
      }),
    };
    const store = new MemoryStore();
    const options = { network, routerAddress: router, startBlock: 30, chunkSize: 1 };
    await new RouterIndexer(firstReader, store, options).syncOnce();

    const reorgReader: ChainReader = {
      getLatestBlockNumber: async () => 31,
      getBlockWithReceipts: async () => ({
        blockNumber: 31,
        blockHash: "0x31-reorg",
        parentHash: "0xwrong",
        receipts: [],
      }),
    };
    await expect(new RouterIndexer(reorgReader, store, options).syncOnce()).rejects.toThrow(
      "chain reorganization detected",
    );
  });

  it("updates a registered transaction only after its finalized receipt is observed", async () => {
    const executionEvent = event(
      ROUTER_EVENT_SELECTORS.policyExecuted,
      ["0x1"],
      ["0xdef", "0x1234", "0xabc", "0x2a", "0xbeef"],
    );
    const store = new MemoryStore();
    await store.registerTransaction("sepolia", "0xaccepted", "router_execution");
    const reader: ChainReader = {
      getLatestBlockNumber: async () => 40,
      getBlockWithReceipts: async () => ({
        blockNumber: 40,
        blockHash: "0x40",
        receipts: [
          {
            transactionHash: "0xaccepted",
            executionStatus: "SUCCEEDED",
            finalityStatus: "ACCEPTED_ON_L2",
            events: [executionEvent],
          },
        ],
      }),
    };

    await new RouterIndexer(reader, store, {
      network: "sepolia",
      routerAddress: router,
      startBlock: 40,
      chunkSize: 1,
    }).syncOnce();

    expect(store.transactions.get("sepolia:0xaccepted")?.status).toBe("accepted");
  });
});
