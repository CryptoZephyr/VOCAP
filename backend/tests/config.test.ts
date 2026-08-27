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
      STARKNET_NETWORK: "sepolia",
      VOCAP_ROUTER_ADDRESS: "0xABC",
      DATABASE_URL: "postgresql://localhost/vocap",
      STARKNET_PRIVATE_KEY: "0xsecret",
    });
    expect(config).not.toHaveProperty("privateKey");
  });

  it("requires an explicit network selection", () => {
    expect(() =>
      loadConfig({
        STARKNET_RPC_URL: "https://rpc.example.test",
        VOCAP_ROUTER_ADDRESS: "0xABC",
        DATABASE_URL: "postgresql://localhost/vocap",
      }),
    ).toThrow();
  });

  it("rejects zero and out-of-range router addresses", () => {
    const base = {
      STARKNET_RPC_URL: "https://rpc.example.test",
      STARKNET_NETWORK: "mainnet",
      DATABASE_URL: "postgresql://localhost/vocap",
    };

    expect(() => loadConfig({ ...base, VOCAP_ROUTER_ADDRESS: "0x0" })).toThrow();
    expect(() =>
      loadConfig({
        ...base,
        VOCAP_ROUTER_ADDRESS: `0x${(1n << 251n).toString(16)}`,
      }),
    ).toThrow();
  });

  it("requires HTTPS outside local devnet", () => {
    const base = {
      VOCAP_ROUTER_ADDRESS: "0xABC",
      DATABASE_URL: "postgresql://localhost/vocap",
    };

    expect(() =>
      loadConfig({ ...base, STARKNET_RPC_URL: "http://rpc.example.test", STARKNET_NETWORK: "mainnet" }),
    ).toThrow("HTTPS");
    expect(() =>
      loadConfig({ ...base, STARKNET_RPC_URL: "http://127.0.0.1:5050", STARKNET_NETWORK: "devnet" }),
    ).not.toThrow();
  });
});
