export const ROUTES = {
  home: "/",
  docs: "/docs",
  playground: "/playground",
  terms: "/terms",
  privacy: "/privacy",
  mechanism: "#mechanism",
} as const;

export const MAINNET_PROOF_HREF =
  "https://starkscan.co/tx/0x3e1acf0c893cb5697d48295d629e86fdddd1f8ff1fd1d307c7f2ecab8c7616f";

export const VOCAP_ROUTER_ADDRESS =
  "0x6048ed36607367ea5ae050c745d47006214ecf66fdbf173d01eba96ec5d780a";

export function playgroundHref(): string {
  return ROUTES.playground;
}

export function isInternalPath(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

export function pathFromLocation(pathname: string): string {
  if (pathname.startsWith(ROUTES.docs)) return ROUTES.docs;
  if (pathname.startsWith(ROUTES.playground)) return ROUTES.playground;
  if (pathname.startsWith(ROUTES.terms)) return ROUTES.terms;
  if (pathname.startsWith(ROUTES.privacy)) return ROUTES.privacy;
  return ROUTES.home;
}
