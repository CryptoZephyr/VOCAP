import { describe, expect, it } from "vitest";
import { DEPLOYMENTS, MAINNET_EXECUTION_HASHES } from "../src/protocol/config.ts";
import { buildVocapInvokeCalldata } from "../src/protocol/private-flow.ts";

describe("browser protocol boundary", () => {
  it("serializes the exact V1 Router input with empty target calldata", () => {
    const config = DEPLOYMENTS.sepolia;
    const noteId = "0x123";
    expect(buildVocapInvokeCalldata({ config, noteId })).toEqual([
      config.policyId,
      BigInt(config.capabilityTokenAddress).toString(),
      config.amount.toString(),
      BigInt(noteId).toString(),
      BigInt(config.targetAddress).toString(),
      BigInt(config.selector).toString(),
      "0",
    ]);
  });

  it("keeps Mainnet evidence read-only and separate from Sepolia writes", () => {
    expect(DEPLOYMENTS.sepolia.writesEnabled).toBe(true);
    expect(DEPLOYMENTS.mainnet.writesEnabled).toBe(false);
    expect(DEPLOYMENTS.mainnet.routerAddress).not.toBe(DEPLOYMENTS.sepolia.routerAddress);
    expect(MAINNET_EXECUTION_HASHES).toHaveLength(3);
  });
});
