import { DEPLOYMENTS } from "./config.ts";

export const MAINNET_EVIDENCE = {
  network: "Starknet Mainnet",
  chain: "SN_MAIN",
  recordedAt: "2026-08-29",
  policyId: DEPLOYMENTS.mainnet.policyId,
  amount: "1 STRK",
  action: "premium_action()",
  targetCalldata: "empty",
  mode: "RETURN",
  routerAddress: DEPLOYMENTS.mainnet.routerAddress,
  targetAddress: DEPLOYMENTS.mainnet.targetAddress,
  poolAddress: DEPLOYMENTS.mainnet.poolAddress,
  tokenAddress: DEPLOYMENTS.mainnet.capabilityTokenAddress,
} as const;

export type MainnetExecutionEvidence = {
  id: string;
  role: string;
  title: string;
  description: string;
  transactionHash: string;
  blockNumber: number;
  actualFeeStrk: string;
  receiptStatus: "SUCCEEDED";
  finality: "ACCEPTED_ON_L1";
};

export const MAINNET_EXECUTIONS: readonly MainnetExecutionEvidence[] = [
  {
    id: "01",
    role: "Alice",
    title: "First Router execution",
    description: "The recorded lifecycle crosses the policy boundary for the first time.",
    transactionHash:
      "0x3e1acf0c893cb5697d48295d629e86fdddd1f8ff1fd1d307c7f2ecab8c7616f",
    blockNumber: 14042664,
    actualFeeStrk: "3.065679423144683030",
    receiptStatus: "SUCCEEDED",
    finality: "ACCEPTED_ON_L1",
  },
  {
    id: "02",
    role: "Alice",
    title: "Returned capability",
    description: "The same configured amount is used again after a successful RETURN.",
    transactionHash:
      "0x290d3683e674714a79676be0fc13819fc410e0b7e3abb2551529e28a52f83e0",
    blockNumber: 14042688,
    actualFeeStrk: "3.051142593634894806",
    receiptStatus: "SUCCEEDED",
    finality: "ACCEPTED_ON_L1",
  },
  {
    id: "03",
    role: "Bob",
    title: "After private succession",
    description: "A fresh private note reaches the next recorded lifecycle role before execution.",
    transactionHash:
      "0xd4be56bfd8b0402e150ced5ee7f8b9c912722f9e4e940d1cc1eda7ee2098d3",
    blockNumber: 14042733,
    actualFeeStrk: "3.241962961529051090",
    receiptStatus: "SUCCEEDED",
    finality: "ACCEPTED_ON_L1",
  },
] as const;

export const mainnetTransactionHref = (transactionHash: string): string =>
  `${DEPLOYMENTS.mainnet.explorerUrl}/tx/${transactionHash}`;

export const mainnetContractHref = (address: string): string =>
  `${DEPLOYMENTS.mainnet.explorerUrl}/contract/${address}`;

export function shortenHash(value: string): string {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}
