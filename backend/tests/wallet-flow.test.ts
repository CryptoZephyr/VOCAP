import { describe, expect, it, vi } from "vitest";
import { prepareVocapWalletCall, submitVocapPrivateResult } from "../src/wallet-flow.js";

const result = {
  call: {
    contractAddress: "0x123",
    entrypoint: "apply_actions",
    calldata: ["0x1", "0x2"],
  },
  proof: {
    data: "base64-proof",
    proofFacts: ["0x10", "0x11"],
  },
} as const;

describe("wallet submission boundary", () => {
  it("prepares an apply_actions call and keeps proof details separate", () => {
    const prepared = prepareVocapWalletCall(result, { expectedPoolAddress: "0x123" });

    expect(prepared.call).toEqual({
      contractAddress: "0x123",
      entrypoint: "apply_actions",
      calldata: ["0x1", "0x2"],
    });
    expect(prepared.details).toEqual({
      proof: "base64-proof",
      proofFacts: ["0x10", "0x11"],
    });
  });

  it("forwards the proof to the connected wallet for approval and submission", async () => {
    const execute = vi.fn().mockResolvedValue({ transaction_hash: "0xabc" });
    const submission = await submitVocapPrivateResult(
      { execute },
      result,
      { expectedPoolAddress: "0x123", transactionDetails: { tip: 3n } },
    );

    expect(execute).toHaveBeenCalledWith(
      {
        contractAddress: "0x123",
        entrypoint: "apply_actions",
        calldata: ["0x1", "0x2"],
      },
      { tip: 3n, proofFacts: ["0x10", "0x11"], proof: "base64-proof" },
    );
    expect(submission.transactionHash).toBe("0xabc");
  });

  it("rejects a call aimed at another pool", () => {
    expect(() => prepareVocapWalletCall(result, { expectedPoolAddress: "0x999" })).toThrow(
      "VOCAP_PRIVATE_FLOW_POOL_MISMATCH",
    );
  });

  it("rejects non-privacy calls and incomplete proofs", () => {
    expect(() =>
      prepareVocapWalletCall({ ...result, call: { ...result.call, entrypoint: "transfer" } }),
    ).toThrow("VOCAP_PRIVATE_FLOW_EXPECTS_APPLY_ACTIONS");
    expect(() =>
      prepareVocapWalletCall({ ...result, proof: { data: "", proofFacts: ["0x1"] } }),
    ).toThrow("VOCAP_PRIVATE_FLOW_PROOF_REQUIRED");
    expect(() =>
      prepareVocapWalletCall({ ...result, proof: { data: "proof", proofFacts: [] } }),
    ).toThrow("VOCAP_PRIVATE_FLOW_PROOF_FACTS_REQUIRED");
  });
});
