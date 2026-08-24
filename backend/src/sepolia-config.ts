import { z } from "zod";
import { normalizeAddress } from "./config.js";

const address = z
  .string()
  .regex(/^0x[0-9a-fA-F]+$/, "expected a hexadecimal Starknet address")
  .refine((value) => BigInt(value) !== 0n, "address must be non-zero");

const sepoliaConfigSchema = z.object({
  STARKNET_RPC_URL: z.string().url(),
  STARKNET_NETWORK: z.literal("sepolia"),
  STRK20_POOL_ADDRESS: address,
  VOCAP_ROUTER_ADDRESS: address,
  CAPABILITY_TOKEN_ADDRESS: address,
  VOCAP_TARGET_ADDRESS: address,
  PROVING_SERVICE_URL: z.string().url(),
  DISCOVERY_SERVICE_URL: z.string().url(),
  STARKNET_ACCOUNT_ADDRESS: address.optional(),
});

export interface SepoliaPrivateFlowConfig {
  rpcUrl: string;
  network: "sepolia";
  poolAddress: string;
  routerAddress: string;
  capabilityTokenAddress: string;
  targetAddress: string;
  provingServiceUrl: string;
  discoveryServiceUrl: string;
  accountAddress?: string;
}

/**
 * Validate the non-secret boundary needed before a real Sepolia private flow.
 * Signers and viewing keys are deliberately absent. They stay in the wallet
 * process that calls the official privacy SDK.
 */
export function loadSepoliaPrivateFlowConfig(
  env: NodeJS.ProcessEnv = process.env,
): SepoliaPrivateFlowConfig {
  const parsed = sepoliaConfigSchema.parse({
    STARKNET_RPC_URL: env.STARKNET_RPC_URL,
    STARKNET_NETWORK: env.STARKNET_NETWORK ?? "sepolia",
    STRK20_POOL_ADDRESS: env.STRK20_POOL_ADDRESS,
    VOCAP_ROUTER_ADDRESS: env.VOCAP_ROUTER_ADDRESS,
    CAPABILITY_TOKEN_ADDRESS: env.CAPABILITY_TOKEN_ADDRESS,
    VOCAP_TARGET_ADDRESS: env.VOCAP_TARGET_ADDRESS,
    PROVING_SERVICE_URL: env.PROVING_SERVICE_URL,
    DISCOVERY_SERVICE_URL: env.DISCOVERY_SERVICE_URL,
    STARKNET_ACCOUNT_ADDRESS: env.STARKNET_ACCOUNT_ADDRESS,
  });

  return {
    rpcUrl: parsed.STARKNET_RPC_URL,
    network: "sepolia",
    poolAddress: normalizeAddress(parsed.STRK20_POOL_ADDRESS),
    routerAddress: normalizeAddress(parsed.VOCAP_ROUTER_ADDRESS),
    capabilityTokenAddress: normalizeAddress(parsed.CAPABILITY_TOKEN_ADDRESS),
    targetAddress: normalizeAddress(parsed.VOCAP_TARGET_ADDRESS),
    provingServiceUrl: parsed.PROVING_SERVICE_URL,
    discoveryServiceUrl: parsed.DISCOVERY_SERVICE_URL,
    ...(parsed.STARKNET_ACCOUNT_ADDRESS === undefined
      ? {}
      : { accountAddress: normalizeAddress(parsed.STARKNET_ACCOUNT_ADDRESS) }),
  };
}
