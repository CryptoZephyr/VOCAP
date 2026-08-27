import { describe, expect, it } from "vitest";
import {
  buildVocapPrivacyInvokeCalldata,
  createVocapInvokeCallBuilder,
} from "../src/private-flow.js";

describe("VOCAP private invocation boundary", () => {
  it("serializes the router span as length followed by raw target calldata", () => {
    expect(
      buildVocapPrivacyInvokeCalldata({
        routerAddress: "0x123",
        policyId: 1n,
        tokenAddress: "0x456",
        amount: 7n,
        noteId: "0x789",
        targetAddress: "0xabc",
        selector: "0xdef",
        targetCalldata: [11n, 12n],
      }).map((value) => BigInt(value)),
    ).toEqual([1n, 0x456n, 7n, 0x789n, 0xabcn, 0xdefn, 2n, 11n, 12n]);
  });

  it("builds only when the SDK context matches the configured capability", () => {
    const build = createVocapInvokeCallBuilder({
      routerAddress: "0x123",
      policyId: 1n,
      tokenAddress: "0x456",
      amount: 7n,
      targetAddress: "0xabc",
      selector: "0xdef",
    });

    expect(
      build({
        withdrawals: [{ recipient: "0x123", token: "0x456", amount: 7n }],
        openNotes: [{ noteId: "0x789", token: "0x456" }],
      }),
    ).toEqual({
      contractAddress: "0x123",
      calldata: ["1", "1110", "7", "1929", "2748", "3567", "0"],
    });
  });

  it("accepts SDK numeric strings for the withdrawal amount", () => {
    const build = createVocapInvokeCallBuilder({
      routerAddress: "0x123",
      policyId: 1n,
      tokenAddress: "0x456",
      amount: 7n,
      targetAddress: "0xabc",
      selector: "0xdef",
    });

    expect(
      build({
        withdrawals: [{ recipient: "0x123", token: "0x456", amount: "7" }],
        openNotes: [{ noteId: "0x789", token: "0x456" }],
      }),
    ).toEqual({
      contractAddress: "0x123",
      calldata: ["1", "1110", "7", "1929", "2748", "3567", "0"],
    });
  });

  it("rejects an SDK context that would return the wrong token", () => {
    const build = createVocapInvokeCallBuilder({
      routerAddress: "0x123",
      policyId: 1n,
      tokenAddress: "0x456",
      amount: 7n,
      targetAddress: "0xabc",
      selector: "0xdef",
    });

    expect(() =>
      build({
        withdrawals: [{ recipient: "0x123", token: "0x456", amount: 7n }],
        openNotes: [{ noteId: "0x789", token: "0x999" }],
      }),
    ).toThrow("VOCAP_OPEN_NOTE_TOKEN_MISMATCH");
  });

  it("rejects a withdrawal sent to another recipient", () => {
    const build = createVocapInvokeCallBuilder({
      routerAddress: "0x123",
      policyId: 1n,
      tokenAddress: "0x456",
      amount: 7n,
      targetAddress: "0xabc",
      selector: "0xdef",
    });

    expect(() =>
      build({
        withdrawals: [{ recipient: "0x999", token: "0x456", amount: 7n }],
        openNotes: [{ noteId: "0x789", token: "0x456" }],
      }),
    ).toThrow("VOCAP_WITHDRAWAL_RECIPIENT_MISMATCH");
  });

  it("rejects a withdrawal with the wrong amount", () => {
    const build = createVocapInvokeCallBuilder({
      routerAddress: "0x123",
      policyId: 1n,
      tokenAddress: "0x456",
      amount: 7n,
      targetAddress: "0xabc",
      selector: "0xdef",
    });

    expect(() =>
      build({
        withdrawals: [{ recipient: "0x123", token: "0x456", amount: "8" }],
        openNotes: [{ noteId: "0x789", token: "0x456" }],
      }),
    ).toThrow("VOCAP_WITHDRAWAL_AMOUNT_MISMATCH");
  });

  it("rejects an SDK context with a zero open-note id", () => {
    const build = createVocapInvokeCallBuilder({
      routerAddress: "0x123",
      policyId: 1n,
      tokenAddress: "0x456",
      amount: 7n,
      targetAddress: "0xabc",
      selector: "0xdef",
    });

    expect(() =>
      build({
        withdrawals: [{ recipient: "0x123", token: "0x456", amount: 7n }],
        openNotes: [{ noteId: 0n, token: "0x456" }],
      }),
    ).toThrow("VOCAP_OPEN_NOTE_ID_MISMATCH");
  });

  it("rejects malformed capability input before building calldata", () => {
    expect(() =>
      buildVocapPrivacyInvokeCalldata({
        routerAddress: 0,
        policyId: 1n,
        tokenAddress: "0x456",
        amount: 7n,
        noteId: "0x789",
        targetAddress: "0xabc",
        selector: "0xdef",
      }),
    ).toThrow("VOCAP_ROUTER_ADDRESS_REQUIRED");

    expect(() =>
      createVocapInvokeCallBuilder({
        routerAddress: "0x123",
        policyId: 1n,
        tokenAddress: "0x456",
        amount: 0n,
        targetAddress: "0xabc",
        selector: "0xdef",
      }),
    ).toThrow("VOCAP_AMOUNT_REQUIRED");
  });
});
