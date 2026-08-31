import { hash } from "starknet";

export type VocapNetwork = "sepolia" | "mainnet";

export type DeploymentConfig = {
  id: VocapNetwork;
  label: string;
  chainId: "0x534e5f5345504f4c4941" | "0x534e5f4d41494e";
  rpcUrl: string;
  explorerUrl: string;
  backendUrl: string | null;
  routerAddress: string;
  targetAddress: string;
  poolAddress: string;
  capabilityTokenAddress: string;
  policyId: string;
  amount: bigint;
  selector: string;
  actionName: "premium_action";
  targetCalldata: readonly string[];
  poolFeeStrk: number;
  provingServiceUrl: string;
  discoveryServiceUrl: string;
  writesEnabled: boolean;
  evidenceUpdatedAt: string;
};

const STRK = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const PREMIUM_ACTION_SELECTOR = hash.getSelectorFromName("premium_action");

export const DEPLOYMENTS: Record<VocapNetwork, DeploymentConfig> = {
  sepolia: {
    id: "sepolia",
    label: "Sepolia Playground",
    chainId: "0x534e5f5345504f4c4941",
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia",
    explorerUrl: "https://sepolia.starkscan.co",
    backendUrl: import.meta.env.VITE_SEPOLIA_BACKEND_URL || "https://vocap-sepolia-indexer.onrender.com",
    routerAddress: "0x0356db61e1d7eaa0417312307c128017e6cc1a85a5a8a649d5c23fee17312b2b",
    targetAddress: "0x0499995a27c1e1ad2d53ecf81649e99f8421e50383f144816809058496034c66",
    poolAddress: "0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91",
    capabilityTokenAddress: STRK,
    policyId: "1",
    amount: 1_000_000_000_000_000_000n,
    selector: PREMIUM_ACTION_SELECTOR,
    actionName: "premium_action",
    targetCalldata: [],
    poolFeeStrk: 2,
    provingServiceUrl:
      import.meta.env.VITE_SEPOLIA_PROVING_SERVICE_URL || "https://transaction-prover.alpha-sepolia.sw-dev.io",
    discoveryServiceUrl:
      import.meta.env.VITE_SEPOLIA_DISCOVERY_SERVICE_URL || "https://discovery-service.alpha-sepolia.sw-dev.io",
    writesEnabled: true,
    evidenceUpdatedAt: "2026-08-29",
  },
  mainnet: {
    id: "mainnet",
    label: "Mainnet evidence",
    chainId: "0x534e5f4d41494e",
    rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL || "https://api.cartridge.gg/x/starknet/mainnet",
    explorerUrl: "https://starkscan.co",
    backendUrl: import.meta.env.VITE_MAINNET_BACKEND_URL || null,
    routerAddress: "0x6048ed36607367ea5ae050c745d47006214ecf66fdbf173d01eba96ec5d780a",
    targetAddress: "0x74637f577350898c64835c88216df3030050828c723c6987a3d97d6d4eb986b",
    poolAddress: "0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a",
    capabilityTokenAddress: STRK,
    policyId: "1",
    amount: 1_000_000_000_000_000_000n,
    selector: PREMIUM_ACTION_SELECTOR,
    actionName: "premium_action",
    targetCalldata: [],
    poolFeeStrk: 6,
    provingServiceUrl:
      import.meta.env.VITE_MAINNET_PROVING_SERVICE_URL || "https://transaction-prover.alpha-mainnet.sw-dev.io",
    discoveryServiceUrl:
      import.meta.env.VITE_MAINNET_DISCOVERY_SERVICE_URL || "https://discovery-service.alpha-mainnet.sw-dev.io",
    writesEnabled: false,
    evidenceUpdatedAt: "2026-08-29",
  },
};

export const MAINNET_EXECUTION_HASHES = [
  "0x3e1acf0c893cb5697d48295d629e86fdddd1f8ff1fd1d307c7f2ecab8c7616f",
  "0x290d3683e674714a79676be0fc13819fc410e0b7e3abb2551529e28a52f83e0",
  "0xd4be56bfd8b0402e150ced5ee7f8b9c912722f9e4e940d1cc1eda7ee2098d3",
] as const;

export function normalizeAddress(value: string): string {
  return `0x${BigInt(value).toString(16)}`;
}

export function sameFelt(left: string, right: string): boolean {
  return BigInt(left) === BigInt(right);
}
