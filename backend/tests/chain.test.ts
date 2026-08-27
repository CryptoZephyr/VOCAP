import { describe, expect, it } from "vitest";
import { assertChainIdentity, readBlockWithReceipts } from "../src/chain.js";

describe("chain receipt compatibility", () => {
  it("accepts only the configured Starknet chain identity", () => {
    expect(() => assertChainIdentity("mainnet", "SN_MAIN")).not.toThrow();
    expect(() => assertChainIdentity("mainnet", "0x534e5f4d41494e")).not.toThrow();
    expect(() => assertChainIdentity("mainnet", "SN_SEPOLIA")).toThrow(
      "RPC chain identity mismatch",
    );
  });

  it("reads receipts nested in transaction entries returned by Sepolia RPC", () => {
    expect(
      readBlockWithReceipts(
        {
          block_number: 12,
          block_hash: "0xblock",
          parent_hash: "0xparent",
          transactions: [
            {
              transaction: { type: "INVOKE" },
              receipt: {
                transaction_hash: "0xtx",
                execution_status: "SUCCEEDED",
                finality_status: "ACCEPTED_ON_L2",
                events: [
                  {
                    from_address: "0xrouter",
                    keys: ["0xevent"],
                    data: [],
                  },
                ],
              },
            },
          ],
        },
        0,
      ),
    ).toEqual({
      blockNumber: 12,
      blockHash: "0xblock",
      parentHash: "0xparent",
      receipts: [
        {
          transactionHash: "0xtx",
          executionStatus: "SUCCEEDED",
          finalityStatus: "ACCEPTED_ON_L2",
          events: [
            {
              from_address: "0xrouter",
              keys: ["0xevent"],
              data: [],
            },
          ],
        },
      ],
    });
  });

  it("keeps support for a top-level receipts array", () => {
    expect(
      readBlockWithReceipts(
        {
          block_number: 13,
          block_hash: "0xblock-2",
          receipts: [
            {
              transaction_hash: "0xtx-2",
              events: [],
            },
          ],
        },
        0,
      ).receipts,
    ).toEqual([{ transactionHash: "0xtx-2", events: [] }]);
  });

  it("rejects a block response without its returned block number", () => {
    expect(() =>
      readBlockWithReceipts(
        {
          block_hash: "0xblock",
          receipts: [],
        },
        13,
      ),
    ).toThrow("invalid block_number response");
  });
});
