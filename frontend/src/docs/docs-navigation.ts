export const DOCS_SLUGS = ["start", "concepts", "build", "integrate", "reference", "production", "security", "help"] as const;
export type DocsSlug = (typeof DOCS_SLUGS)[number];
export type DocsNavItem = {slug: DocsSlug; label: string; description: string};
export const DOCS_ITEMS: DocsNavItem[] = [
  {slug: "start", label: "Introduction and quickstart", description: "Understand VOCAP and read a real policy."},
  {slug: "concepts", label: "Core concepts", description: "Capability, policy, lifecycle, and privacy."},
  {slug: "build", label: "Build the private flow", description: "The complete browser-to-chain workflow."},
  {slug: "integrate", label: "Integrate VOCAP", description: "Client, target, policy, and ownership boundaries."},
  {slug: "reference", label: "Technical reference", description: "Client API, contracts, events, errors, and backend."},
  {slug: "production", label: "Mainnet proof", description: "Deployment and verified execution evidence."},
  {slug: "security", label: "Security model", description: "Trust, privacy, and failure behavior."},
  {slug: "help", label: "Troubleshooting and FAQ", description: "Real failure paths and direct answers."},
];
export const docsHref = (slug: DocsSlug) => `/docs/${slug}`;
export const docsSlugFromPath = (pathname: string): DocsSlug => {
  const slug = pathname.replace(/^\/docs\/?/, "").split("/")[0];
  return DOCS_SLUGS.includes(slug as DocsSlug) ? slug as DocsSlug : "start";
};
