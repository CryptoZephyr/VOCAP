# VOCAP

VOCAP is a private programmable-capability protocol for Starknet.

V1 requires a real STRK20 asset before a protected target action can execute. After a successful action, the same asset returns to a fresh private note for reuse.

```text
private STRK20 capability
-> pool-gated VocapRouter
-> configured target action
-> same capability returned to a fresh private note
```

## Current status

VOCAP is being developed for the STRK20 Private Sprint. The Cairo router and backend pass their local verification suites, and the router, approved target, and first STRK policy are deployed on Sepolia. The complete STRK20 RETURN and Alice-to-Bob succession flow has now passed on Sepolia with the backend projection evidence recorded in [docs/SEPOLIA_RUNBOOK.md](docs/SEPOLIA_RUNBOOK.md). Mainnet remains on hold until the remaining artifact review, operational, privacy-service, wallet, and fee gates pass.

V1 is `RETURN` only. The frontend is intentionally out of scope while the contracts, backend, indexing, and smoke flows are being stabilized.

## Repository layout

- `contracts/` contains the RETURN-only pool-gated router and its security tests.
- `backend/` contains typed policy and execution projection, PostgreSQL persistence, transaction lifecycle handling, and the STRK20 invoke-calldata boundary.
- `docs/` contains the Sepolia runbook, toolchain notes, privacy boundaries, and hackathon release rules.

## Verified local commands

Run the Cairo checks inside WSL 2 Ubuntu:

```text
scarb build
snforge test
```

Run the backend checks from `backend/`:

```text
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

The Cairo auditor deterministic preflight reports zero findings for the production contracts. The Sepolia STRK20 integration gate is recorded as complete. Mainnet deployment and funding remain intentionally out of scope until the tracked readiness checklist is closed.

## Privacy boundaries

STRK20 notes carry token and value. VOCAP gives that asset meaning through a public policy and a bound target function. Deposits and target execution boundaries remain public. The current holder and private note transfer can remain private through the STRK20 flow.

No private keys, viewing keys, wallet recovery secrets, RPC credentials, or deployer secrets belong in this repository.

The exact Sepolia gate and the two supported service deployment paths are documented in [docs/SEPOLIA_RUNBOOK.md](docs/SEPOLIA_RUNBOOK.md).
The Starknet MCP setup and external signer boundary are documented in [docs/MCP_SETUP.md](docs/MCP_SETUP.md).
The tracked Mainnet repository and external gates are documented in [docs/MAINNET_READINESS.md](docs/MAINNET_READINESS.md).

## License

MIT
