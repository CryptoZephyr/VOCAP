# Security Policy

VOCAP combines Cairo contracts, a user-controlled Starknet Privacy client, and a read-only indexer. Please report security issues privately so they can be reviewed before public discussion.

## Supported versions

| Version | Support |
| --- | --- |
| `main` | Current development branch |
| Older commits | Not actively supported |

## Reporting a vulnerability

Do not open a public issue or publish exploit details before the maintainers have reviewed the report.

Use GitHub's private vulnerability reporting flow for this repository when it is available. If it is not enabled, contact the maintainers through a private GitHub channel and ask for a security-reporting path.

Include:

- the affected commit, file, or deployed contract;
- a short description of the security impact;
- minimal steps to reproduce the issue;
- a safe proof of concept that does not access other users' assets or data;
- any suggested mitigation.

Never include private keys, seed or recovery phrases, wallet exports, viewing keys, private note witnesses, proof-signing material, database passwords, authenticated RPC URLs, or full environment files. Redact these values from logs and screenshots before sending a report.

## Scope

Reports are in scope when they affect:

- `VocapRouter` or `VocapApprovedTarget` behavior;
- policy binding, pool-only entry, reentrancy protection, capability return, or asset conservation;
- wallet-boundary validation in `backend/src/private-flow.ts` or `backend/src/wallet-flow.ts`;
- receipt finality, cursor continuity, replay handling, or database privilege checks in the backend;
- the protected Mainnet indexer workflow exposing credentials or gaining write authority.

The Starknet Privacy SDK, privacy pool, prover, discovery service, RPC provider, Render, Neon, and GitHub are external dependencies. Report defects in those systems to their maintainers too, and tell VOCAP if the issue affects this integration.

Local operator notes, ignored `docs/` files, test-only fixtures, and ordinary availability problems without a security impact are not part of this policy. They must still never contain real secrets.

## Security boundaries

- The connected user wallet is the write boundary. It approves, signs, and broadcasts private transactions.
- The VOCAP backend and scheduled indexer must not hold a wallet signer, viewing key, or capability spend authority.
- Mainnet receipts, policy fields, target calls, and transaction timing are public chain data. Holder state and private note transfers belong to the Starknet Privacy flow.
- The deployed V1 policy is `RETURN` only, with a configured token, amount, target, selector, and empty target calldata for the reviewed target.

## Disclosure

Keep a report and any follow-up discussion private until a fix or mitigation is available. The maintainers will coordinate the disclosure timing with the reporter, credit reporters who want attribution, and avoid publishing sensitive details that could put users or funds at risk.

This policy does not replace an independent security audit. The repository's tests and deployment evidence describe the reviewed behavior, while external services and future changes require their own review.
