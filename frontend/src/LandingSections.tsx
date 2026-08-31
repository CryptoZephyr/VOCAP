import { ArrowUpRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.tsx";
import { handleInternalClick } from "./navigate.ts";
import { ROUTES } from "./routes.ts";
import { MechanismScrollytelling } from "./MechanismScrollytelling.tsx";

const MAINNET_ROUTER =
  "0x6048ed36607367ea5ae050c745d47006214ecf66fdbf173d01eba96ec5d780a";
const MAINNET_TARGET =
  "0x74637f577350898c64835c88216df3030050828c723c6987a3d97d6d4eb986b";
const MAINNET_POOL =
  "0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a";
const REPOSITORY_URL = "https://github.com/CryptoZephyr/VOCAP";

const PROOF_ROWS = [
  {
    label: "Alice · first Router execution",
    hash: "0x3e1acf0c893cb5697d48295d629e86fdddd1f8ff1fd1d307c7f2ecab8c7616f",
    href: "https://starkscan.co/tx/0x3e1acf0c893cb5697d48295d629e86fdddd1f8ff1fd1d307c7f2ecab8c7616f",
  },
  {
    label: "Alice · returned capability",
    hash: "0x290d3683e674714a79676be0fc13819fc410e0b7e3abb2551529e28a52f83e0",
    href: "https://starkscan.co/tx/0x290d3683e674714a79676be0fc13819fc410e0b7e3abb2551529e28a52f83e0",
  },
  {
    label: "Bob · after private succession",
    hash: "0xd4be56bfd8b0402e150ced5ee7f8b9c912722f9e4e940d1cc1eda7ee2098d3",
    href: "https://starkscan.co/tx/0xd4be56bfd8b0402e150ced5ee7f8b9c912722f9e4e940d1cc1eda7ee2098d3",
  },
] as const;

const ROLE_ROWS = [
  ["Private STRK20 note", "Carries the capability and holder state", "Client-side"],
  ["User-controlled client", "Builds the proof and apply_actions call", "Client-side"],
  ["Privacy pool", "Owns note lifecycle and calls the Router", "On-chain"],
  ["VocapRouter", "Enforces one configured action and return", "On-chain"],
  ["Approved target", "Runs premium_action() with no arguments", "On-chain"],
  ["Backend indexer", "Indexes finalized public receipts and events", "Read-only"],
] as const;

const FAQ_ITEMS = [
  ["What does the capability authorize?", "One configured target and selector under policy 1. The reviewed Mainnet target is premium_action() with empty calldata."],
  ["What stays private?", "The current holder, viewing key, note witnesses, private registry, and holder-to-holder succession can stay private through STRK20. Pool calls, timing, policy checks, and the target action remain public."],
  ["Who approves and pays for a write?", "The connected user wallet approves the pool call and pays the current network and protocol fees. VOCAP has no server signer and never receives the wallet private key."],
  ["Can the capability be used again?", "Yes. A successful RETURN execution preserves the configured amount for a fresh private note. The browser must rediscover that note before the next use."],
  ["What does the backend know?", "It indexes finalized public receipts, Router events, policy rows, execution rows, and transaction lifecycle status. It does not receive viewing keys or infer private note ownership."],
  ["Is Mainnet ready for another write?", "The recorded Mainnet lifecycle is complete evidence. A future write still requires fresh checks for the wallet, allowance, pool fee, compatible services, proof state, and chain state."],
  ["Where can I try VOCAP?", "Use the local Capability Playground for the current integration surface. A public demo URL and video are not available yet, and the interface must not imply that the remaining wallet-funded Sepolia proof is complete."],
] as const;

function CodeLine({ children, wrap = false }: { children: string; wrap?: boolean }) {
  return <code className={wrap ? "block break-all text-[0.78rem] leading-relaxed text-muted-foreground" : "block overflow-x-auto whitespace-pre text-[0.78rem] leading-relaxed text-muted-foreground"}>{children}</code>;
}

export function LandingSections() {
  return (
    <div className="border-t border-border bg-background text-foreground">
      <nav className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:px-10" aria-label="VOCAP sections">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em]">
          <a className="text-foreground hover:text-primary" href="#mechanism-detail">Mechanism</a>
          <a className="text-muted-foreground hover:text-foreground" href="#strk20">STRK20</a>
          <a className="text-muted-foreground hover:text-foreground" href="#privacy">Privacy</a>
          <a className="text-muted-foreground hover:text-foreground" href="#mainnet">Mainnet</a>
          <a className="text-muted-foreground hover:text-foreground" href="#sponsors">Integrations</a>
          <a className="text-muted-foreground hover:text-foreground" href={ROUTES.docs} onClick={(event) => handleInternalClick(event, ROUTES.docs)}>Docs</a>
          <a className="text-muted-foreground hover:text-foreground" href="#faq">FAQ</a>
          <Button className="ml-auto h-8 px-3 text-xs" nativeButton={false} render={<a href={ROUTES.playground} onClick={(event) => handleInternalClick(event, ROUTES.playground)} />}>Try a Capability</Button>
        </div>
      </nav>

      <MechanismScrollytelling />

      <section id="strk20" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-10 md:py-28">
          <div className="mb-10 max-w-2xl"><p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">Built through STRK20</p><h2 className="m-0 text-3xl font-semibold tracking-tight md:text-5xl">The private lifecycle has a clear boundary.</h2><p className="mt-5 text-base leading-relaxed text-muted-foreground">STRK20 owns the private note lifecycle. VOCAP adds the narrow, public policy boundary around the action that note can authorize.</p></div>
          <div className="overflow-x-auto border-y border-border"><table className="w-full min-w-[42rem] border-collapse text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-foreground"><th className="py-4 pr-6 font-medium">Role</th><th className="py-4 pr-6 font-medium">Responsibility</th><th className="py-4 font-medium">Boundary</th></tr></thead><tbody>{ROLE_ROWS.map(([role, responsibility, boundary]) => <tr key={role} className="border-b border-border last:border-0"><th className="py-4 pr-6 font-medium">{role}</th><td className="py-4 pr-6 text-muted-foreground">{responsibility}</td><td className="py-4 font-mono text-xs text-primary">{boundary}</td></tr>)}</tbody></table></div>
        </div>
      </section>

      <section id="privacy" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:px-10 md:py-28">
          <div><p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">Privacy boundary</p><h2 className="m-0 text-3xl font-semibold tracking-tight md:text-5xl">Private holder state. Public policy checks.</h2><p className="mt-5 max-w-[48ch] text-base leading-relaxed text-muted-foreground">The wallet process keeps the viewing key, witnesses, and private registry. The chain still exposes the pool boundary and the configured action. VOCAP doesn’t claim hidden execution, hidden timing, or identity proof.</p></div>
          <div className="grid gap-0 border-t border-border"><div className="border-b border-border py-6"><p className="m-0 font-mono text-xs uppercase tracking-[0.14em] text-primary">Stays with the wallet</p><p className="m-0 mt-3 text-lg">Viewing key, note witnesses, private registry, and proof-signing material.</p></div><div className="border-b border-border py-6"><p className="m-0 font-mono text-xs uppercase tracking-[0.14em] text-primary">Visible at the boundary</p><p className="m-0 mt-3 text-lg">Pool calls, public transaction status, Router policy checks, target action, and finalized event data.</p></div><div className="py-6"><p className="m-0 font-mono text-xs uppercase tracking-[0.14em] text-primary">Backend role</p><p className="m-0 mt-3 text-lg">A delayed, read-only projection of finalized public receipts. No signer or viewing key.</p></div></div>
        </div>
      </section>

      <section id="succession" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-10 md:py-28"><div className="mb-10 max-w-2xl"><p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">Private succession</p><h2 className="m-0 text-3xl font-semibold tracking-tight md:text-5xl">The permission can move without becoming public.</h2><p className="mt-5 text-base leading-relaxed text-muted-foreground">Alice can use the returned capability again, then privately pass the fresh note to Bob. The backend observes the public execution event, not private note ownership.</p></div><ol className="m-0 grid list-none gap-0 border-y border-border p-0 md:grid-cols-4">{[["01", "Alice holds", "A private note represents the configured capability."], ["02", "Alice executes", "The Router runs premium_action() and enforces return."], ["03", "Fresh note", "The same amount is returned to a new private note."], ["04", "Bob receives", "Private succession moves the capability before Bob executes."]].map(([id, title, body]) => <li key={id} className="border-b border-border py-6 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0"><span className="font-mono text-xs text-primary">{id}</span><h3 className="m-0 mt-3 text-lg font-semibold">{title}</h3><p className="m-0 mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p></li>)}</ol></div>
      </section>

      <section id="mainnet" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-10 md:py-28"><div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div className="max-w-2xl"><p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">Mainnet evidence</p><h2 className="m-0 text-3xl font-semibold tracking-tight md:text-5xl">Three qualifying Router executions.</h2><p className="mt-5 text-base leading-relaxed text-muted-foreground">Recorded proof from the completed Mainnet lifecycle. Each receipt is SUCCEEDED and ACCEPTED_ON_L2. The rows are evidence records, not a live indexer feed.</p></div><span className="font-mono text-xs text-muted-foreground">SN_MAIN · policy 1 · 1 STRK</span></div><div className="mb-10 grid min-w-0 gap-4 md:grid-cols-3"><div className="min-w-0 border border-border p-5"><p className="m-0 text-xs uppercase tracking-[0.12em] text-muted-foreground">Router</p><CodeLine wrap>{MAINNET_ROUTER}</CodeLine></div><div className="min-w-0 border border-border p-5"><p className="m-0 text-xs uppercase tracking-[0.12em] text-muted-foreground">Approved target</p><CodeLine wrap>{MAINNET_TARGET}</CodeLine></div><div className="min-w-0 border border-border p-5"><p className="m-0 text-xs uppercase tracking-[0.12em] text-muted-foreground">STRK20 pool</p><CodeLine wrap>{MAINNET_POOL}</CodeLine></div></div><div className="min-w-0 border-y border-border">{PROOF_ROWS.map((row) => <div key={row.hash} className="grid min-w-0 gap-3 border-b border-border py-5 last:border-0 md:grid-cols-[1.2fr_2fr_auto] md:items-center md:gap-6"><p className="m-0 text-sm font-semibold">{row.label}</p><CodeLine wrap>{row.hash}</CodeLine><a className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline" href={row.href} target="_blank" rel="noreferrer">View receipt <ArrowUpRight size={14} /></a></div>)}</div></div>
      </section>

      <section id="integrate" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-10 md:py-28"><div className="max-w-3xl"><p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">Developer integration</p><h2 className="m-0 text-3xl font-semibold tracking-tight md:text-5xl">Integrate through the published client.</h2><p className="mt-5 max-w-[62ch] text-base leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">VOCAP client v0.1.0</span> validates the Router call, hands wallet approval to the user, and provides typed access to VOCAP’s public projection API. Private discovery and proof building stay in the pinned RC2 privacy SDK.</p><p className="mt-5 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">The package accepts no private key, viewing key, note witness, or proof-signing secret. V1 target calldata remains empty, and the chain receipt remains authoritative.</p><p className="mt-4 text-sm text-muted-foreground">VOCAP is open source under the MIT License. <a className="inline-flex items-center gap-1 font-semibold text-primary hover:underline" href={REPOSITORY_URL} target="_blank" rel="noreferrer">View the repository <ArrowUpRight size={13} /></a></p><Button className="mt-7" variant="secondary" nativeButton={false} render={<a href={ROUTES.docs} onClick={(event) => handleInternalClick(event, ROUTES.docs)} />}>Read the integration docs</Button></div></div>
      </section>

      <section id="faq" className="scroll-mt-16">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)] md:px-10 md:py-28">
          <div className="max-w-xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">FAQ</p>
            <h2 className="m-0 text-3xl font-semibold tracking-tight md:text-5xl">Know the boundary before you connect.</h2>
            <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted-foreground">Short answers about privacy, wallet control, reuse, fees, and the remaining release gate.</p>
          </div>
          <div className="border-t border-border">
            {FAQ_ITEMS.map(([question, answer], index) => (
              <details key={question} className="faq-item group border-b border-border">
                <summary className="grid cursor-pointer list-none grid-cols-[2rem_1fr_auto] items-center gap-3 py-5 marker:hidden">
                  <span className="font-mono text-xs tabular-nums text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-base font-semibold md:text-lg">{question}</span>
                  <span className="faq-toggle grid size-7 place-items-center border border-border font-mono text-muted-foreground" aria-hidden="true" />
                </summary>
                <p className="m-0 max-w-[62ch] pb-6 pl-11 pr-10 text-sm leading-relaxed text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
