# VOCAP frontend

Public VOCAP frontend for private programmable capability infrastructure on Starknet. It includes the landing page, official Docs, Capability Trace, Terms, and Privacy routes.

This package owns the light-first VOCAP design tokens. From the ui-toolbox it uses shadcn/ui as owned components, Base UI for behavior, 21st.dev as a composition reference, and one adapted React Bits motion piece (ClickSpark). Radix Themes is a reference only and is not installed. The approved `vocap-logo.png` is a byte-identical copy of the user-supplied VOCAP mark.

The production deployment is [vocap-protocol.vercel.app](https://vocap-protocol.vercel.app). Direct route loads use the SPA fallback in [`vercel.json`](vercel.json).

## Commands

From WSL or Windows, use Node 24 and Corepack pnpm:

```bash
cd frontend
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm typecheck
corepack pnpm dev
```

Do not open `index.html` as a `file:` URL. Serve it with `corepack pnpm dev` or `corepack pnpm preview`.
