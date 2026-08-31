import { MAINNET_PROOF_HREF, ROUTES } from "./routes.ts";

export const PRODUCT_IDENTITY =
  "Private programmable capability infrastructure for Starknet.";

export const HEADLINE = "Your asset is your permission.";

export const SUPPORTING =
  "Use privately held STRK20 assets to authorize Starknet actions without revealing who currently holds the right.";

export const FILE_PROTOCOL_GUIDE =
  "VOCAP must be served over HTTP. From the frontend directory run: corepack pnpm dev";

export const FORBIDDEN_PRIMARY_CTAS = [
  "Launch App",
  "Open App",
  "Enter dApp",
  "Start Now",
  "Get Started",
] as const;

export type HeroCta = {
  id: "see-how" | "mainnet-proof" | "docs" | "capability-trace";
  label: string;
  href: string;
  external: boolean;
};

export function getHeroCtas(): readonly HeroCta[] {
  return [
    {
      id: "see-how",
      label: "See how it works",
      href: ROUTES.mechanism,
      external: false,
    },
    {
      id: "mainnet-proof",
      label: "View Mainnet proof",
      href: MAINNET_PROOF_HREF,
      external: true,
    },
    {
      id: "docs",
      label: "Integrating VOCAP? Read the docs",
      href: ROUTES.docs,
      external: false,
    },
    {
      id: "capability-trace",
      label: "Capability Trace",
      href: ROUTES.playground,
      external: false,
    },
  ];
}

export const PROTOCOL_STEPS = [
  {
    id: "01",
    name: "CAPABILITY",
    body: "A real STRK20 asset represents the permission.",
  },
  {
    id: "02",
    name: "SUPPLY",
    body: "The holder supplies it privately through STRK20.",
  },
  {
    id: "03",
    name: "EXECUTE",
    body: "VOCAP permits only the configured target action.",
  },
  {
    id: "04",
    name: "RETURN",
    body: "The same asset returns to a fresh private note.",
  },
] as const;

export const SCENE_NAV = [
  { id: "mechanism", label: "Mechanism", href: "#mechanism-detail" },
  { id: "privacy", label: "Privacy", href: "#privacy" },
  { id: "mainnet", label: "Mainnet", href: "#mainnet" },
  { id: "integrate", label: "Integrate", href: "#integrate" },
] as const;
