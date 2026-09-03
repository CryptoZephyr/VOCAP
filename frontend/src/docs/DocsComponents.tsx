import {Check, Copy, Info, Warning} from "@phosphor-icons/react";
import {useState, type ReactNode} from "react";

export type TocItem = {id: string; label: string};

export function DocPage({eyebrow, title, description, toc, children}: {eyebrow: string; title: string; description: string; toc: TocItem[]; children: ReactNode}) {
  return <><header className="docs-page-lead"><p>{eyebrow}</p><h1>{title}</h1><p>{description}</p></header><div className="docs-mobile-toc"><details><summary>On this page</summary><nav>{toc.map((item) => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}</nav></details></div>{children}</>;
}
export function Section({id, title, children}: {id: string; title: string; children: ReactNode}) {
  return <section id={id} className="docs-section"><h2>{title}</h2>{children}</section>;
}
export function CodeBlock({children, label}: {children: string; label?: string}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(children); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <div className="docs-code"><div><span>{label ?? "Example"}</span><button type="button" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button></div><pre><code>{children}</code></pre></div>;
}
export function Callout({kind = "note", title, children}: {kind?: "note" | "warning"; title: string; children: ReactNode}) {
  return <aside className={`docs-callout docs-callout-${kind}`}>{kind === "warning" ? <Warning size={19} /> : <Info size={19} />}<div><strong>{title}</strong><div>{children}</div></div></aside>;
}
export function Flow({steps}: {steps: {label: string; detail: string}[]}) {
  return <ol className="docs-flow">{steps.map((step, index) => <li key={step.label}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.label}</strong><p>{step.detail}</p></div></li>)}</ol>;
}
export function DefinitionGrid({items}: {items: {term: string; definition: string}[]}) {
  return <dl className="docs-definitions">{items.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.definition}</dd></div>)}</dl>;
}
