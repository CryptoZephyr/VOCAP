import { describe, expect, it } from "vitest";
import { assertTransactionTransition, receiptStatus } from "../src/transaction-state.js";
import { MemoryStore } from "../src/memory-store.js";

describe("transaction lifecycle", () => {
  it("accepts pending to confirmed states", () => {
    expect(() => assertTransactionTransition("pending", "accepted")).not.toThrow();
    expect(() => assertTransactionTransition("pending", "reverted")).not.toThrow();
  });

  it("rejects a confirmed transaction changing state", () => {
    expect(() => assertTransactionTransition("accepted", "reverted")).toThrow(
      "invalid transaction status transition",
    );
  });

  it("maps receipt execution status before finality", () => {
    expect(receiptStatus({ execution_status: "REVERTED", finality_status: "ACCEPTED_ON_L2" })).toBe(
      "reverted",
    );
    expect(receiptStatus({ finality_status: "REJECTED" })).toBe("rejected");
    expect(receiptStatus({ execution_status: "SUCCEEDED", finality_status: "ACCEPTED_ON_L2" })).toBe(
      "accepted",
    );
  });

  it("persists only registered transaction lifecycle changes", async () => {
    const store = new MemoryStore();
    await store.registerTransaction("sepolia", "0x1", "router_execution");
    await store.updateTransactionStatus("sepolia", "0x1", "accepted");
    expect(store.transactions.get("sepolia:0x1")?.status).toBe("accepted");
    await expect(store.updateTransactionStatus("sepolia", "0x1", "reverted")).rejects.toThrow(
      "invalid transaction status transition",
    );
    await expect(store.updateTransactionStatus("sepolia", "0x2", "accepted")).rejects.toThrow(
      "was not registered",
    );
  });
});
