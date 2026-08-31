import type { ReactNode } from "react";
import { Button } from "@/components/ui/button.tsx";
import { LOGO_ALT, LOGO_PUBLIC_PATH } from "./brand.ts";
import { handleInternalClick } from "./navigate.ts";
import { ROUTES } from "./routes.ts";
import { SiteFooter } from "./SiteFooter.tsx";

type LegalKind = "terms" | "privacy";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="border-t border-border pt-7"><h2 className="m-0 text-xl font-semibold">{title}</h2><div className="mt-3 grid gap-3 text-sm leading-relaxed text-muted-foreground">{children}</div></section>;
}

export function LegalPage({ kind }: { kind: LegalKind }) {
  const isTerms = kind === "terms";

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b border-border px-4 md:px-10">
        <a href={ROUTES.home} onClick={(event) => handleInternalClick(event, ROUTES.home)} aria-label="VOCAP home"><img className="size-16 object-contain mix-blend-multiply" src={LOGO_PUBLIC_PATH} alt={LOGO_ALT} width={64} height={64} /></a>
        <Button variant="link" nativeButton={false} render={<a href={ROUTES.home} onClick={(event) => handleInternalClick(event, ROUTES.home)} />}>Back to VOCAP</Button>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-12 md:px-10 md:py-20">
        <p className="m-0 font-mono text-xs uppercase tracking-[0.18em] text-primary">Effective August 31, 2026</p>
        <h1 className="m-0 mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{isTerms ? "Terms of use" : "Privacy notice"}</h1>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          {isTerms
            ? "These terms cover the VOCAP website, documentation, and browser interface. The software is experimental and interacts with public blockchain infrastructure."
            : "This notice explains what the current VOCAP browser interface handles when you read deployment data or use the Sepolia capability flow."}
        </p>

        <div className="mt-12 grid gap-8">
          {isTerms ? <>
            <Section title="Use of the interface"><p>You may use the interface and documentation to inspect VOCAP deployments and prepare supported transactions. You are responsible for confirming the selected network, contract addresses, wallet account, fees, and transaction details before approval.</p></Section>
            <Section title="Wallet control and blockchain transactions"><p>VOCAP does not custody assets or sign transactions for you. Your connected wallet controls approval and submission. Blockchain transactions may be irreversible, public at the protocol boundary, and subject to network or third-party service failures.</p></Section>
            <Section title="Experimental software"><p>The interface and protocol are provided as available, without a promise of uninterrupted operation, fitness for a particular purpose, or protection from every smart-contract, wallet, RPC, proving-service, discovery-service, or network risk. Use only funds and accounts appropriate for experimental software.</p></Section>
            <Section title="Mainnet boundary"><p>The Playground keeps Mainnet evidence-only. A historical successful execution does not guarantee that a future write is safe, funded, compatible, or available.</p></Section>
            <Section title="Open-source license"><p>The repository software is distributed under its included MIT License. These website terms do not replace the license for source code covered by it.</p></Section>
          </> : <>
            <Section title="Data kept in your browser"><p>Your viewing key, private note registry, witnesses, and proof material stay in the browser-side privacy client. VOCAP does not intentionally send those values to its backend.</p></Section>
            <Section title="Public and submitted data"><p>The interface reads public deployment and transaction data from configured Starknet RPC services. After you submit a supported transaction, it may send the network, Router address, transaction hash, and transaction kind to the configured VOCAP indexer. Those values are public blockchain identifiers.</p></Section>
            <Section title="Third-party services"><p>Wallet providers, Starknet RPC endpoints, the STRK20 proving and discovery services, blockchain explorers, and hosting providers process requests under their own policies. Opening an explorer or external evidence link takes you to that third party.</p></Section>
            <Section title="Cookies and analytics"><p>The current VOCAP frontend does not add analytics, advertising trackers, or application cookies. A hosting provider may still process ordinary request data such as an IP address, timestamp, and user agent to deliver and secure the site.</p></Section>
            <Section title="Data choices"><p>You can use the public evidence pages without connecting a wallet. Disconnecting the wallet and closing the browser session clears the interface state held only in memory. Public blockchain records cannot be deleted by VOCAP.</p></Section>
          </>}
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
