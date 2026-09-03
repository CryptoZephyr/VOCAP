import {List, MagnifyingGlass, X} from "@phosphor-icons/react";
import {useEffect, useMemo, useState, type MouseEvent} from "react";
import {LOGO_ALT, LOGO_PUBLIC_PATH} from "../brand.ts";
import {handleInternalClick} from "../navigate.ts";
import {ROUTES} from "../routes.ts";
import {DOCS_PAGES} from "./DocsContent.tsx";
import {DOCS_ITEMS, docsHref, docsSlugFromPath, type DocsSlug} from "./docs-navigation.ts";

const GROUPS = ["Start", "Concepts", "Build", "Integrate", "Reference", "Production", "Security", "Help"];
const PAGE_TOC: Record<DocsSlug, [string, string][]> = {
  start: [["introduction", "What VOCAP is"], ["quickstart", "Five-minute quickstart"], ["how", "How it works"], ["next", "Where to go next"]],
  concepts: [["primitives", "Core primitives"], ["policy", "Policy model"], ["lifecycle", "RETURN lifecycle"], ["succession", "Private succession"], ["privacy", "Privacy model"]],
  build: [["prerequisites", "Prerequisites"], ["configure", "Configure"], ["workflow", "Workflow"], ["confirm", "Confirm success"], ["refresh", "Refresh state"]],
  integrate: [["ownership", "Responsibility map"], ["client", "Official client"], ["target", "Target integration"], ["policies", "Policies"], ["advanced", "Advanced flow"]],
  reference: [["client", "Client API"], ["contracts", "Contracts"], ["events", "Events"], ["backend", "Backend API"], ["errors", "Errors"], ["deployments", "Deployments"]],
  production: [["deployment", "Current deployment"], ["executions", "Verified executions"], ["boundary", "Evidence boundary"], ["trace", "Capability Trace"]],
  security: [["trust", "Trust model"], ["data", "Data boundary"], ["failure", "Failure behavior"], ["limits", "Limits"]],
  help: [["troubleshooting", "Troubleshooting"], ["faq", "FAQ"], ["source", "Source and evidence"]],
};

export function DocsSite() {
  const [slug, setSlug] = useState(() => docsSlugFromPath(globalThis.window?.location.pathname ?? "/docs"));
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const sync = () => { setSlug(docsSlugFromPath(window.location.pathname)); setMobileOpen(false); window.scrollTo({top: 0}); };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => { document.title = `${DOCS_ITEMS.find((item) => item.slug === slug)?.label ?? "Docs"} · VOCAP`; }, [slug]);
  const filtered = useMemo(() => query.trim() ? DOCS_ITEMS.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase())) : [], [query]);
  const Page = DOCS_PAGES[slug] ?? DOCS_PAGES.start;
  const index = DOCS_ITEMS.findIndex((item) => item.slug === slug);
  const previous = index > 0 ? DOCS_ITEMS[index - 1] : null;
  const next = index < DOCS_ITEMS.length - 1 ? DOCS_ITEMS[index + 1] : null;
  const go = (event: MouseEvent<HTMLAnchorElement>, href: string) => handleInternalClick(event, href);

  return <main className="docs-site min-h-[100dvh] bg-background text-foreground">
    <a className="docs-skip" href="#docs-content">Skip to documentation</a>
    <header className="docs-header">
      <a className="docs-brand" href={ROUTES.home} onClick={(event) => go(event, ROUTES.home)}><img src={LOGO_PUBLIC_PATH} alt={LOGO_ALT} /><span><strong>VOCAP</strong><small>Developer docs</small></span></a>
      <div className="docs-search"><MagnifyingGlass size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documentation" aria-label="Search documentation" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button> : null}{query ? <div className="docs-search-results">{filtered.length ? filtered.map((item) => <a key={item.slug} href={docsHref(item.slug)} onClick={(event) => {go(event, docsHref(item.slug)); setQuery("");}}><strong>{item.label}</strong><span>{item.description}</span></a>) : <p>No matching page</p>}</div> : null}</div>
      <nav className="docs-header-links"><a href="https://github.com/CryptoZephyr/VOCAP" target="_blank" rel="noreferrer">GitHub</a><a href={ROUTES.playground} onClick={(event) => go(event, ROUTES.playground)}>Capability Trace</a></nav>
      <button className="docs-menu-button" type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-label="Toggle documentation navigation"><List size={22} /></button>
    </header>
    <div className={`docs-shell ${mobileOpen ? "is-menu-open" : ""}`}>
      <aside className="docs-sidebar"><nav aria-label="Documentation pages">{DOCS_ITEMS.map((item, itemIndex) => <div key={item.slug}><p><span>{String(itemIndex + 1).padStart(2, "0")}</span>{GROUPS[itemIndex]}</p><a className={item.slug === slug ? "is-active" : ""} href={docsHref(item.slug)} onClick={(event) => go(event, docsHref(item.slug))}>{item.label}</a></div>)}</nav><div className="docs-sidebar-note"><span>V1 boundary</span><p>RETURN only · user-controlled wallet · Mainnet evidence is read-only</p></div></aside>
      <article id="docs-content" className="docs-content"><Page /><nav className="docs-pagination" aria-label="Previous and next pages">{previous ? <a href={docsHref(previous.slug)} onClick={(event) => go(event, docsHref(previous.slug))}><span>Previous</span><strong>{previous.label}</strong></a> : <span />}{next ? <a href={docsHref(next.slug)} onClick={(event) => go(event, docsHref(next.slug))}><span>Next</span><strong>{next.label}</strong></a> : <span />}</nav></article>
      <aside className="docs-on-page"><p>On this page</p><nav>{(PAGE_TOC[slug] ?? []).map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav></aside>
    </div>
  </main>;
}
