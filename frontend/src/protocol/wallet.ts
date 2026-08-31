import { connect, disconnect, type StarknetWindowObject } from "@starknet-io/get-starknet";
import { WalletAccount } from "starknet";
import type { DeploymentConfig } from "./config.ts";

export type ConnectedWallet = {
  provider: StarknetWindowObject;
  account: WalletAccount;
  address: string;
  chainId: string;
};

export async function connectWallet(config: DeploymentConfig): Promise<ConnectedWallet> {
  const walletProvider = await connect({ modalMode: "alwaysAsk", modalTheme: "light" });
  if (!walletProvider) throw new Error("No Starknet wallet was selected.");
  const account = await WalletAccount.connect(
    { nodeUrl: config.rpcUrl },
    walletProvider as unknown as Parameters<typeof WalletAccount.connect>[1],
  );
  const chainId = await walletProvider.request({ type: "wallet_requestChainId" });
  return { provider: walletProvider, account, address: account.address, chainId };
}

export async function disconnectWallet(): Promise<void> {
  await disconnect({ clearLastWallet: true });
}
