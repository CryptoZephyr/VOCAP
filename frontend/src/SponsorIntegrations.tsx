import { ArrowUpRight } from "@phosphor-icons/react";
import { VOCAP_ROUTER_ADDRESS } from "./routes.ts";
import { SiteFooter } from "./SiteFooter.tsx";

const integrations = [
  {
    name: "Starknet",
    role: "Execution layer",
    detail: "Cairo contracts enforce the policy boundary. Three accepted Mainnet Router executions provide the public proof record.",
    href: `https://starkscan.co/contract/${VOCAP_ROUTER_ADDRESS}`,
    evidence: "SN_MAIN · verified Router",
  },
  {
    name: "STRK20",
    role: "Private capability layer",
    detail: "The official PRIVACY-0.14.3-RC.2 client owns discovery, proof construction, private transfer, and fresh-note return.",
    href: "https://github.com/starkware-libs/starknet-privacy/releases/tag/PRIVACY-0.14.3-RC.2",
    evidence: "RC2 · pool v2.0",
  },
] as const;

export function SponsorIntegrations() {
  return (
    <><section id="sponsors" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-10 md:py-28">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">Ecosystem integrations</p>
            <h2 className="m-0 text-3xl font-semibold tracking-tight md:text-5xl">Every integration has one boundary.</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">VOCAP uses Starknet for public policy enforcement and STRK20 for the private capability lifecycle.</p>
          </div>
          <p className="m-0 font-mono text-xs text-muted-foreground">Public policy · private capability</p>
        </div>

        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          {integrations.map((integration) => (
            <article className="min-w-0 bg-background p-5 md:p-7" key={integration.name}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="m-0 font-mono text-xs uppercase tracking-[0.14em] text-primary">{integration.role}</p>
                  <h3 className="m-0 mt-2 text-2xl font-semibold">{integration.name}</h3>
                </div>
                <a className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold hover:text-primary" href={integration.href} target="_blank" rel="noreferrer" aria-label={`Open ${integration.name} evidence`}>
                  Evidence <ArrowUpRight size={14} />
                </a>
              </div>
              <p className="mt-5 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">{integration.detail}</p>
              <p className="mb-0 mt-6 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">{integration.evidence}</p>
            </article>
          ))}
        </div>
        <p className="mb-0 mt-5 text-xs leading-relaxed text-muted-foreground">Integration names describe technology used by VOCAP. They don’t imply endorsement beyond the STRK20 sprint record.</p>
      </div>
    </section><SiteFooter /></>
  );
}
