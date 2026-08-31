import { lazy, Suspense, useEffect, useState } from "react";
import { DocsPage } from "./DocsPage.tsx";
import { Hero } from "./Hero.tsx";
import { LandingSections } from "./LandingSections.tsx";
import { LegalPage } from "./LegalPage.tsx";
import { SponsorIntegrations } from "./SponsorIntegrations.tsx";
import { pathFromLocation, ROUTES } from "./routes.ts";

const PlaygroundPage = lazy(async () => {
  const module = await import("./PlaygroundPage.tsx");
  return { default: module.PlaygroundPage };
});

export function App() {
  const [path, setPath] = useState(() =>
    typeof window === "undefined" ? ROUTES.home : pathFromLocation(window.location.pathname),
  );

  useEffect(() => {
    const onPop = () => setPath(pathFromLocation(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (path === ROUTES.docs) return <DocsPage />;
  if (path === ROUTES.playground) return <Suspense fallback={<main className="min-h-[100dvh] bg-background p-10">Loading playground…</main>}><PlaygroundPage /></Suspense>;
  if (path === ROUTES.terms) return <LegalPage kind="terms" />;
  if (path === ROUTES.privacy) return <LegalPage kind="privacy" />;
  return <><Hero /><LandingSections /><SponsorIntegrations /></>;
}
