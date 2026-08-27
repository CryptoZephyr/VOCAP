import { z } from "zod";
import type { Network } from "./types.js";

const address = z
  .string()
  .regex(/^0x[0-9a-fA-F]+$/, "expected a hexadecimal Starknet address")
  .refine(
    (value) => {
      try {
        const numeric = BigInt(value);
        return numeric > 0n && numeric < (1n << 251n);
      } catch {
        return false;
      }
    },
    "expected a non-zero 251-bit Starknet address",
  );

const configSchema = z
  .object({
    STARKNET_RPC_URL: z.string().url(),
    STARKNET_NETWORK: z.enum(["sepolia", "mainnet", "devnet"]),
    VOCAP_ROUTER_ADDRESS: address,
    DATABASE_URL: z.string().min(1),
    VOCAP_START_BLOCK: z.coerce.number().int().min(0).default(0),
    VOCAP_SYNC_CHUNK_SIZE: z.coerce.number().int().positive().max(500).default(25),
    VOCAP_POLL_MS: z.coerce.number().int().positive().default(15_000),
  })
  .superRefine((value, context) => {
    if (
      value.STARKNET_NETWORK !== "devnet" &&
      new URL(value.STARKNET_RPC_URL).protocol !== "https:"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["STARKNET_RPC_URL"],
        message: "HTTPS is required for Sepolia and Mainnet RPC URLs",
      });
    }
  });

export interface BackendConfig {
  rpcUrl: string;
  network: Network;
  routerAddress: string;
  databaseUrl: string;
  startBlock: number;
  syncChunkSize: number;
  pollMs: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BackendConfig {
  const parsed = configSchema.parse({
    STARKNET_RPC_URL: env.STARKNET_RPC_URL,
    STARKNET_NETWORK: env.STARKNET_NETWORK,
    VOCAP_ROUTER_ADDRESS: env.VOCAP_ROUTER_ADDRESS,
    DATABASE_URL: env.DATABASE_URL,
    VOCAP_START_BLOCK: env.VOCAP_START_BLOCK,
    VOCAP_SYNC_CHUNK_SIZE: env.VOCAP_SYNC_CHUNK_SIZE,
    VOCAP_POLL_MS: env.VOCAP_POLL_MS,
  });

  return {
    rpcUrl: parsed.STARKNET_RPC_URL,
    network: parsed.STARKNET_NETWORK,
    routerAddress: normalizeAddress(parsed.VOCAP_ROUTER_ADDRESS),
    databaseUrl: parsed.DATABASE_URL,
    startBlock: parsed.VOCAP_START_BLOCK,
    syncChunkSize: parsed.VOCAP_SYNC_CHUNK_SIZE,
    pollMs: parsed.VOCAP_POLL_MS,
  };
}

export function normalizeAddress(value: string): string {
  return `0x${BigInt(value).toString(16)}`;
}
