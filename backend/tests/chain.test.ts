import { describe, expect, it } from "vitest";
import { readBlockWithReceipts } from "../src/chain.js";

describe("chain receipt compatibility", () => {
  it("reads receipts nested in transaction entries returned by Sepolia RPC", () => {
    expect(
      readBlockWithReceipts(
        {
          block_number: 12,
          block_hash: "0xblock",
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
});
