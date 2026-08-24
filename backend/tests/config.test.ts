import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("backend configuration", () => {
  it("requires the router and database boundary", () => {
    expect(() =>
      loadConfig({
        STARKNET_RPC_URL: "https://rpc.example.test",
        STARKNET_NETWORK: "sepolia",
        VOCAP_ROUTER_ADDRESS: "0xABC",
        DATABASE_URL: "postgresql://localhost/vocap",
      }),
    ).not.toThrow();
  });

  it("does not accept a private key setting as backend configuration", () => {
    const config = loadConfig({
      STARKNET_RPC_URL: "https://rpc.example.test",
      VOCAP_ROUTER_ADDRESS: "0xABC",
      DATABASE_URL: "postgresql://localhost/vocap",
      STARKNET_PRIVATE_KEY: "0xsecret",
    });
    expect(config).not.toHaveProperty("privateKey");
  });
});
