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
      { blockNumber: 11, blockHash: "0x11", receipts: [] },
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
});
