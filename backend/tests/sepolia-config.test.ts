import { describe, expect, it } from "vitest";
import { loadSepoliaPrivateFlowConfig } from "../src/sepolia-config.js";

const validEnv = {
  STARKNET_RPC_URL: "https://rpc.example.test",
  STARKNET_NETWORK: "sepolia",
  STRK20_POOL_ADDRESS: "0x100",
  VOCAP_ROUTER_ADDRESS: "0x200",
  CAPABILITY_TOKEN_ADDRESS: "0x300",
  VOCAP_TARGET_ADDRESS: "0x400",
  PROVING_SERVICE_URL: "https://prover.example.test",
  DISCOVERY_SERVICE_URL: "https://indexer.example.test",
  STARKNET_ACCOUNT_ADDRESS: "0x500",
};

describe("Sepolia private flow configuration", () => {
  it("accepts the complete non-secret integration boundary", () => {
    expect(loadSepoliaPrivateFlowConfig(validEnv)).toEqual({
      rpcUrl: "https://rpc.example.test",
      network: "sepolia",
      poolAddress: "0x100",
      routerAddress: "0x200",
      capabilityTokenAddress: "0x300",
      targetAddress: "0x400",
      provingServiceUrl: "https://prover.example.test",
      discoveryServiceUrl: "https://indexer.example.test",
      accountAddress: "0x500",
    });
  });

  it("fails before a flow can run when the privacy services are missing", () => {
    const missingServices = { ...validEnv };
    delete missingServices.PROVING_SERVICE_URL;
    delete missingServices.DISCOVERY_SERVICE_URL;

    expect(() => loadSepoliaPrivateFlowConfig(missingServices)).toThrow();
  });

  it("does not accept mainnet for the Sepolia gate", () => {
    expect(() =>
      loadSepoliaPrivateFlowConfig({ ...validEnv, STARKNET_NETWORK: "mainnet" }),
    ).toThrow();
  });
});
