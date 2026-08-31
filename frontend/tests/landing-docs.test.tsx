import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DocsPage } from "../src/DocsPage.tsx";
import { LandingSections } from "../src/LandingSections.tsx";
import { LegalPage } from "../src/LegalPage.tsx";
import { SponsorIntegrations } from "../src/SponsorIntegrations.tsx";

describe("landing sections", () => {
  it("renders the complete evidence-led landing content without invented product claims", () => {
    const html = renderToStaticMarkup(<LandingSections />);

    for (const phrase of [
      "The mechanism",
      "scroll to follow",
      "One capability. Four exact states.",
      "Select the private capability.",
      "Commit one exact amount.",
      "Permit one public action.",
      "Keep the capability alive.",
      "Built through STRK20",
      "Privacy boundary",
      "Private succession",
      "Mainnet evidence",
      "Developer integration",
      "Integrate through the published client.",
      "VOCAP client v0.1.0",
      "VOCAP is open source under the MIT License.",
      "FAQ",
      "Know the boundary before you connect.",
      "What stays private?",
      "Can the capability be used again?",
      "Who approves and pays for a write?",
      "0x3e1acf0c893cb5697d48295d629e86fdddd1f8ff1fd1d307c7f2ecab8c7616f",
      "0x290d3683e674714a79676be0fc13819fc410e0b7e3abb2551529e28a52f83e0",
      "0xd4be56bfd8b0402e150ced5ee7f8b9c912722f9e4e940d1cc1eda7ee2098d3",
      "SUCCEEDED and ACCEPTED_ON_L1",
    ]) {
      expect(html).toContain(phrase);
    }

    expect(html).toContain("The rows are evidence records, not a live indexer feed.");
    expect(html).not.toContain("Documented sequence");
    expect(html).not.toContain("createPrivateTransfers({ account");
    expect(html).not.toContain("npmjs.com");
    expect(html).not.toContain("@cryptozephyr");
    expect(html).toContain('href="https://github.com/CryptoZephyr/VOCAP"');
    expect(html).not.toContain("Launch App");
    expect(html).not.toContain("Open App");
  });
});

describe("sponsor integrations", () => {
  it("shows only repository-backed integrations and their boundaries", () => {
    const html = renderToStaticMarkup(<SponsorIntegrations />);

    for (const phrase of [
      "Ecosystem integrations",
      "Starknet",
      "STRK20",
      "PRIVACY-0.14.3-RC.2",
      "don’t imply endorsement",
    ]) {
      expect(html).toContain(phrase);
    }
    expect(html).not.toContain("Neon");
    expect(html).not.toContain("Render");
    expect(html).not.toContain("Sponsored by");
  });
});

describe("developer documentation", () => {
  it("documents the current RC2 wallet flow and backend boundary", () => {
    const html = renderToStaticMarkup(<DocsPage />);

    for (const phrase of [
      "Official VOCAP documentation",
      "PRIVACY-0.14.3-RC.2",
      "vocap-client@0.1.0",
      "createVocapClient",
      "submitPrivateResult",
      "Add VOCAP to your app",
      "What the client handles",
      "The VOCAP client never asks for them.",
      "PolicyExecuted",
      "The backend indexes finalized public receipts",
      "V1 target calldata stays empty",
      "VOCAP is open source under the MIT License.",
    ]) {
      expect(html).toContain(phrase);
    }

    expect(html).not.toContain("The full documentation set is not in this slice");
    expect(html).not.toContain("CapabilityPolicy");
    expect(html).not.toContain("npmjs.com");
    expect(html).not.toContain("@cryptozephyr");
    expect(html).toContain('href="https://github.com/CryptoZephyr/VOCAP"');
    expect(html).toContain('href="#quickstart"');
    expect(html).toContain("POST /api/v1/transactions");
  });
});

describe("public legal routes", () => {
  it("renders real terms and privacy content with working cross-links", () => {
    const terms = renderToStaticMarkup(<LegalPage kind="terms" />);
    const privacy = renderToStaticMarkup(<LegalPage kind="privacy" />);

    expect(terms).toContain("Terms of use");
    expect(terms).toContain("Wallet control and blockchain transactions");
    expect(terms).toContain('href="/privacy"');
    expect(privacy).toContain("Privacy notice");
    expect(privacy).toContain("Data kept in your browser");
    expect(privacy).toContain("does not add analytics");
    expect(privacy).toContain('href="/terms"');
  });
});
