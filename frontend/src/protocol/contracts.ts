import { RpcProvider, hash } from "starknet";
import type { DeploymentConfig } from "./config.ts";
import { normalizeAddress, sameFelt } from "./config.ts";

export type VerifiedPolicy = {
  tokenAddress: string;
  amount: bigint;
  targetAddress: string;
  selector: string;
  enabled: boolean;
  mode: "RETURN";
  poolAddress: string;
  targetRouterAddress: string;
  actionCount: bigint;
  verifiedAt: string;
};

export type ConfigurationCheck =
  | { ok: true; policy: VerifiedPolicy }
  | { ok: false; error: string };

export function providerFor(config: DeploymentConfig): RpcProvider {
  return new RpcProvider({ nodeUrl: config.rpcUrl });
}

export async function verifyDeployment(config: DeploymentConfig): Promise<ConfigurationCheck> {
  try {
    const provider = providerFor(config);
    const chainId = await provider.getChainId();
    if (chainId !== config.chainId) {
      return { ok: false, error: `RPC returned ${chainId}; expected ${config.chainId}.` };
    }

    const [policyResult, poolResult, targetRouterResult, actionCountResult] = await Promise.all([
      provider.callContract({
        contractAddress: config.routerAddress,
        entrypoint: "get_policy",
        calldata: [config.policyId],
      }),
      provider.callContract({ contractAddress: config.routerAddress, entrypoint: "get_pool", calldata: [] }),
      provider.callContract({ contractAddress: config.targetAddress, entrypoint: "get_router", calldata: [] }),
      provider.callContract({ contractAddress: config.targetAddress, entrypoint: "get_action_count", calldata: [] }),
    ]);

    if (policyResult.length < 6) return { ok: false, error: "Router returned an incomplete policy." };
    const policy: VerifiedPolicy = {
      tokenAddress: normalizeAddress(policyResult[0]!),
      amount: BigInt(policyResult[1]!),
      targetAddress: normalizeAddress(policyResult[2]!),
      selector: normalizeAddress(policyResult[3]!),
      enabled: BigInt(policyResult[4]!) === 1n,
      mode: "RETURN",
      poolAddress: normalizeAddress(poolResult[0]!),
      targetRouterAddress: normalizeAddress(targetRouterResult[0]!),
      actionCount: BigInt(actionCountResult[0]!),
      verifiedAt: new Date().toISOString(),
    };

    const mismatches = [
      !sameFelt(policy.tokenAddress, config.capabilityTokenAddress) && "capability token",
      policy.amount !== config.amount && "amount",
      !sameFelt(policy.targetAddress, config.targetAddress) && "target",
      !sameFelt(policy.selector, config.selector) && "selector",
      !policy.enabled && "policy enabled state",
      !sameFelt(policy.poolAddress, config.poolAddress) && "privacy pool",
      !sameFelt(policy.targetRouterAddress, config.routerAddress) && "target Router",
    ].filter(Boolean);
    if (mismatches.length > 0) {
      return { ok: false, error: `Deployment mismatch: ${mismatches.join(", ")}.` };
    }
    return { ok: true, policy };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Deployment verification failed." };
  }
}

export type ReceiptVerification =
  | { status: "pending" }
  | { status: "rejected" | "reverted"; reason: string }
  | { status: "accepted"; blockNumber: number | null };

export async function verifyExecutionReceipt(
  config: DeploymentConfig,
  transactionHash: string,
): Promise<ReceiptVerification> {
  try {
    const receipt = await providerFor(config).getTransactionReceipt(transactionHash);
    const value = receipt.value as unknown as {
      execution_status?: string;
      finality_status?: string;
      block_number?: number;
      revert_reason?: string;
      events?: Array<{ from_address: string; keys: string[]; data: string[] }>;
    };
    if (value.execution_status === "REVERTED") {
      return { status: "reverted", reason: value.revert_reason || "Transaction reverted." };
    }
    if (!value.finality_status?.startsWith("ACCEPTED")) return { status: "pending" };
    const eventSelector = hash.getSelectorFromName("PolicyExecuted");
    const event = value.events?.find(
      (candidate) =>
        sameFelt(candidate.from_address, config.routerAddress) &&
        candidate.keys.length >= 2 &&
        sameFelt(candidate.keys[0]!, eventSelector) &&
        BigInt(candidate.keys[1]!) === BigInt(config.policyId),
    );
    if (!event || event.data.length < 5) {
      return { status: "rejected", reason: "Receipt lacks the expected PolicyExecuted event." };
    }
    if (
      !sameFelt(event.data[0]!, config.targetAddress) ||
      !sameFelt(event.data[1]!, config.selector) ||
      !sameFelt(event.data[2]!, config.capabilityTokenAddress) ||
      BigInt(event.data[3]!) !== config.amount
    ) {
      return { status: "rejected", reason: "PolicyExecuted fields do not match the selected policy." };
    }
    return { status: "accepted", blockNumber: value.block_number ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not found|transaction hash/i.test(message)) return { status: "pending" };
    return { status: "rejected", reason: message };
  }
}
