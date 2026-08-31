import { ArrowRight, ArrowUpRight, CheckCircle } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { LOGO_ALT, LOGO_PUBLIC_PATH } from "./brand.ts";
import { handleInternalClick } from "./navigate.ts";
import { ROUTES } from "./routes.ts";
import {
  MAINNET_EVIDENCE,
  MAINNET_EXECUTIONS,
  mainnetContractHref,
  mainnetTransactionHref,
  shortenHash,
  type MainnetExecutionEvidence,
} from "./protocol/mainnet-evidence.ts";

const TRACE_STEPS = [
  {
    id: "01",
    label: "STRK20",
    detail: "Private capability note",
    description: "The pool call carries the configured 1 STRK capability.",
  },
  {
    id: "02",
    label: "VOCAP Router",
    detail: "Policy #1",
    description: "The Router checks the token, amount, target, selector, caller, and RETURN mode.",
  },
  {
    id: "03",
    label: "premium_action()",
    detail: "Approved target",
    description: "The reviewed target runs with an empty calldata span.",
  },
  {
    id: "04",
    label: "RETURN",
    detail: "Fresh private note",
    description: "The same 1 STRK remains available for the next private note.",
  },
] as const;

const formatBlock = (blockNumber: number): string => blockNumber.toLocaleString("en-US");

function AddressRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="trace-address-row">
      <div>
        <p className="trace-label">{label}</p>
        <code>{value}</code>
      </div>
      <a href={mainnetContractHref(value)} target="_blank" rel="noreferrer">
        Starkscan <ArrowUpRight size={14} />
      </a>
    </div>
  );
}

function TraceCard({
  execution,
  index,
  selected,
  onSelect,
}: {
  execution: MainnetExecutionEvidence;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={`trace-card-shell trace-card-shell-${index + 1}${selected ? " is-selected" : ""}`}>
      <button
        type="button"
        className="trace-card"
        aria-pressed={selected}
        aria-controls="selected-trace"
        onClick={onSelect}
      >
        <span className="trace-card-topline">
          <span className="trace-card-index">{execution.id}</span>
          <span className="trace-status">
            <CheckCircle size={14} weight="fill" aria-hidden="true" />
            {execution.receiptStatus}
          </span>
        </span>
        <span className="trace-card-role">{execution.role} · lifecycle role</span>
        <span className="trace-card-title">{execution.title}</span>
        <span className="trace-card-description">{execution.description}</span>
        <span className="trace-card-data">
          <span>
            <span className="trace-label">Block</span>
            <strong>{formatBlock(execution.blockNumber)}</strong>
          </span>
          <span>
            <span className="trace-label">Actual fee</span>
            <strong>{execution.actualFeeStrk} STRK</strong>
          </span>
        </span>
        <span className="trace-card-action">
          {selected ? "Trace selected" : "Open transaction trace"}
          <ArrowRight size={16} aria-hidden="true" />
        </span>
      </button>
      <a className="trace-card-receipt" href={mainnetTransactionHref(execution.transactionHash)} target="_blank" rel="noreferrer">
        Starkscan receipt <ArrowUpRight size={14} />
      </a>
    </article>
  );
}

export function CapabilityTracePage() {
  const [selectedId, setSelectedId] = useState(MAINNET_EXECUTIONS[0]?.id ?? "01");
  const selected = useMemo(
    () => MAINNET_EXECUTIONS.find((execution) => execution.id === selectedId) ?? MAINNET_EXECUTIONS[0],
    [selectedId],
  );

  const selectExecution = (id: string) => {
    setSelectedId(id);
    window.requestAnimationFrame(() => {
      document.getElementById("selected-trace")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  if (!selected) return null;

  return (
    <main className="capability-trace-page min-h-[100dvh] bg-background text-foreground">
      <header className="trace-header">
        <a href={ROUTES.home} onClick={(event) => handleInternalClick(event, ROUTES.home)} aria-label="VOCAP home">
          <img className="size-16 object-contain mix-blend-multiply" src={LOGO_PUBLIC_PATH} alt={LOGO_ALT} width={64} height={64} />
        </a>
        <div className="trace-header-links">
          <span className="trace-header-state">SN_MAIN · read-only evidence</span>
          <a href={ROUTES.docs} onClick={(event) => handleInternalClick(event, ROUTES.docs)}>Docs</a>
          <Button variant="link" nativeButton={false} render={<a href={ROUTES.home} onClick={(event) => handleInternalClick(event, ROUTES.home)} />}>Back to VOCAP</Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-10">
        <section className="trace-intro" aria-labelledby="trace-title">
          <div className="max-w-3xl">
            <p className="trace-kicker">Capability Trace</p>
            <h1 id="trace-title">See one capability cross a public policy boundary.</h1>
            <p className="trace-lede">
              Three recorded Mainnet executions make the V1 lifecycle inspectable. The holder stays private while the STRK20 pool, Router policy, target call, and return requirement remain checkable onchain.
            </p>
          </div>
          <dl className="trace-facts">
            <div><dt>Network</dt><dd>{MAINNET_EVIDENCE.network}</dd></div>
            <div><dt>Policy</dt><dd>#{MAINNET_EVIDENCE.policyId} · {MAINNET_EVIDENCE.amount}</dd></div>
            <div><dt>Recorded</dt><dd>{MAINNET_EVIDENCE.recordedAt}</dd></div>
          </dl>
        </section>

        <section id="lifecycle" className="trace-lifecycle" aria-labelledby="lifecycle-title">
          <div className="trace-section-heading">
            <div>
              <p className="trace-kicker">Observable lifecycle</p>
              <h2 id="lifecycle-title">The public boundary has four exact steps.</h2>
            </div>
            <p>Private note ownership remains outside this record.</p>
          </div>
          <ol className="trace-step-line">
            {TRACE_STEPS.map((step, index) => (
              <li key={step.id}>
                <span className="trace-step-marker">{step.id}</span>
                <div>
                  <p>{step.label}</p>
                  <span>{step.detail}</span>
                </div>
                {index < TRACE_STEPS.length - 1 ? <ArrowRight className="trace-step-arrow" size={18} aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
          <div className="trace-boundary-note">
            <span className="trace-label">Privacy boundary</span>
            <p>The current holder and private note material are never inferred from these receipts.</p>
          </div>
        </section>

        <section id="executions" className="trace-executions" aria-labelledby="executions-title">
          <div className="trace-section-heading">
            <div>
              <p className="trace-kicker">Mainnet receipts</p>
              <h2 id="executions-title">Three executions, one policy.</h2>
            </div>
            <p>{MAINNET_EXECUTIONS.length} verified receipts · {MAINNET_EVIDENCE.chain}</p>
          </div>
          <div className="trace-card-grid">
            {MAINNET_EXECUTIONS.map((execution, index) => (
              <TraceCard
                key={execution.transactionHash}
                execution={execution}
                index={index}
                selected={execution.id === selected.id}
                onSelect={() => selectExecution(execution.id)}
              />
            ))}
          </div>
        </section>

        <section id="selected-trace" className="trace-detail" aria-labelledby="selected-trace-title" aria-live="polite">
          <div className="trace-detail-heading">
            <div>
              <p className="trace-kicker">Selected execution · {selected.role}</p>
              <h2 id="selected-trace-title">{selected.title}</h2>
              <p>{selected.description}</p>
            </div>
            <a className="trace-primary-link" href={mainnetTransactionHref(selected.transactionHash)} target="_blank" rel="noreferrer">
              Open full receipt <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="trace-receipt-grid">
            <div><span className="trace-label">Receipt status</span><strong>{selected.receiptStatus}</strong></div>
            <div><span className="trace-label">Finality</span><strong>{selected.finality}</strong></div>
            <div><span className="trace-label">Block</span><strong>{formatBlock(selected.blockNumber)}</strong></div>
            <div><span className="trace-label">Actual fee</span><strong>{selected.actualFeeStrk} STRK</strong></div>
          </div>

          <div className="trace-detail-body">
            <ol className="trace-detail-steps">
              {TRACE_STEPS.map((step, index) => (
                <li key={step.id}>
                  <span className="trace-detail-number">{step.id}</span>
                  <div>
                    <p>{step.label}</p>
                    <span>{step.description}</span>
                  </div>
                  {index < TRACE_STEPS.length - 1 ? <ArrowRight className="trace-detail-arrow" size={18} aria-hidden="true" /> : null}
                </li>
              ))}
            </ol>
            <aside className="trace-proof">
              <p className="trace-label">Starkscan evidence</p>
              <code>{shortenHash(selected.transactionHash)}</code>
              <a href={mainnetTransactionHref(selected.transactionHash)} target="_blank" rel="noreferrer">
                View transaction details <ArrowUpRight size={14} />
              </a>
              <p className="trace-proof-note">The receipt is authoritative for the public execution boundary.</p>
            </aside>
          </div>
        </section>

        <section id="boundary" className="trace-addresses" aria-labelledby="boundary-title">
          <div className="trace-section-heading">
            <div>
              <p className="trace-kicker">Deployment boundary</p>
              <h2 id="boundary-title">The trace points to real contracts.</h2>
            </div>
            <p>Policy #{MAINNET_EVIDENCE.policyId} · {MAINNET_EVIDENCE.action} · {MAINNET_EVIDENCE.mode}</p>
          </div>
          <div className="trace-address-list">
            <AddressRow label="STRK20 token" value={MAINNET_EVIDENCE.tokenAddress} />
            <AddressRow label="STRK20 pool" value={MAINNET_EVIDENCE.poolAddress} />
            <AddressRow label="VocapRouter" value={MAINNET_EVIDENCE.routerAddress} />
            <AddressRow label="Approved target" value={MAINNET_EVIDENCE.targetAddress} />
          </div>
          <p className="trace-footnote">Target calldata is {MAINNET_EVIDENCE.targetCalldata}. Alice and Bob are lifecycle labels from the recorded operator sequence, not wallet identities derived from the chain.</p>
        </section>
      </div>

      <footer className="trace-footer">
        <span>VOCAP · Mainnet evidence</span>
        <div>
          <a href={ROUTES.docs} onClick={(event) => handleInternalClick(event, ROUTES.docs)}>Docs</a>
          <a href={ROUTES.home} onClick={(event) => handleInternalClick(event, ROUTES.home)}>Back to VOCAP</a>
        </div>
      </footer>
    </main>
  );
}
