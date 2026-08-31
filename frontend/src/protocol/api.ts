import type { DeploymentConfig } from "./config.ts";

export async function registerTransaction(config: DeploymentConfig, transactionHash: string): Promise<void> {
  if (!config.backendUrl) return;
  const response = await fetch(`${config.backendUrl}/api/v1/transactions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      network: config.id,
      routerAddress: config.routerAddress,
      txHash: transactionHash,
      kind: "router_execution",
    }),
  });
  if (!response.ok) {
    throw new Error(`Backend registration failed with HTTP ${response.status}.`);
  }
}
