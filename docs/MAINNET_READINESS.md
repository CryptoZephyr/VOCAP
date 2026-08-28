# Mainnet readiness

This document is the tracked release checklist for the VOCAP Mainnet path. It records repository gates only. A passing local build or test does not prove a Mainnet deployment, a private transaction, or the availability of an external privacy service.

## Repository gates

- [x] Review the final contract source and generated Sierra and CASM artifacts from one commit.
- [x] Run `scarb build` and `snforge test` with the pinned toolchain.
- [x] Run `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build` from `backend/`.
- [x] Run the PostgreSQL integration suite against the current migration schema in a disposable PostgreSQL database.
- [x] Confirm the backend is configured with an explicit network and that the RPC reports the matching Starknet chain ID.
- [x] Confirm the indexer accepts only successful, finalized receipts.
- [x] Confirm the sync cursor is scoped to the router and fails closed on block continuity or reorganization errors.
- [x] Confirm transaction lifecycle updates are connected to receipt observation and remain atomic under concurrent writers.
- [ ] Confirm retry, shutdown, and health behavior through an operational test or supervised deployment.
- [x] Provide `corepack pnpm migrate` as a separately privileged deployment step; normal indexer startup performs a read-only schema check and does not execute DDL.
- [x] Keep the user-wallet write boundary separate from the backend and validate proven `apply_actions` calls before wallet submission.
- [ ] Execute the migration step with the production migration role and verify the runtime role has its required application privileges.
- [x] Confirm no private keys, viewing keys, RPC credentials, or wallet recovery secrets are present in the repository or release bundle.

## Verification snapshot

Recorded 2026-08-28 from the final working tree:

- `scarb build` and `snforge test`: 26 passed.
- Backend typecheck and build: passed. The default Vitest run: 31 passed, 1 skipped because the PostgreSQL test is guarded when no test database URL is configured.
- `DATABASE_URL=<migration-role-url> corepack pnpm migrate`: completed successfully against the disposable PostgreSQL database and can be rerun idempotently.
- Explicit `corepack pnpm test:postgres`: 1 test passed against a disposable PostgreSQL database. The test covered migration, idempotent replay, router-scoped cursors, lifecycle observation, and reorganization rejection.
- Render deployment preparation: `render.yaml` defines a zero-dollar Sepolia web service with `/healthz`, free PostgreSQL, frozen-lockfile build, idempotent startup migration, secret RPC prompt, and disabled automatic deploys. The service uses the verified router address and its L1-finalized deployment block. Render CLI `v2.25.0` is installed locally, and both Blueprint files validate with it.
- User-wallet write boundary: `backend/src/wallet-flow.ts` validates the privacy SDK result and forwards the proof to a connected wallet for normal user approval. The backend still holds no signer or viewing key.
- Zero-dollar Mainnet observer preparation: `render.mainnet.yaml` defines a separate free, read-only Mainnet profile with required manual RPC, router, and start-block inputs, a 60-second polling interval, `/healthz`, and disabled automatic deploys. It remains unusable until the Mainnet addresses and deployment block are verified.
- Operational smoke test: the compiled indexer connected to Sepolia and PostgreSQL, projected blocks `14143062` through `14143086`, received `SIGTERM`, closed cleanly, and exited with status `0`. The broader operational gate remains open until retry and ongoing cursor health are observed on the supervised Render service.
- Render provider validation: the authenticated CLI reports `valid: true` and two planned free resources, `vocap-sepolia-indexer` and `vocap-sepolia-postgres`. No Render resource has been created.
- Live Sepolia RETURN, reuse, succession, stale-note rejection, and backend projection evidence is recorded in [SEPOLIA_RUNBOOK.md](SEPOLIA_RUNBOOK.md). The RETURN receipts reached L1 finality. The newer succession receipts were successful and accepted on L2 when recorded.
- No Mainnet funding, deployment, or private transaction was attempted.

The production sequence is: provision the migration role as the database or schema owner, run the migration job once, grant the runtime role `USAGE` plus application DML on the `vocap_*` tables, then start the indexer with only the runtime URL.

## External gates

- [x] Complete the real Sepolia STRK20 RETURN and succession sequence with receipt, pool note, stale-note rejection, and backend indexing evidence. See [SEPOLIA_RUNBOOK.md](SEPOLIA_RUNBOOK.md) for the transaction record and the remaining L1 settlement-status follow-up for the newer succession receipts.
- [ ] Verify the exact Mainnet privacy-pool address, class hash, version, fee, and action ordering against the selected SDK release, including pool-side enforcement of the withdrawal boundary.
- [ ] Confirm the frozen V1 target accepts only the intended no-argument call shape, or add and redeploy an explicit target-calldata restriction before expanding the target surface.
- [ ] Verify the proving and discovery service revisions or image digests against the selected SDK release.
- [ ] Select a fresh Mainnet wallet and record only its public address and wallet type. Keep signing material outside the repository.
- [ ] Refresh exact fee estimates for account setup, declarations, deployments, policy configuration, funding, and proof-backed private actions.
- [ ] Declare and deploy the frozen classes, then read back class hashes and constructor state from Mainnet.
- [ ] Create policy `1` and read it back from the live Router.
- [ ] Rehearse the deployment and recovery procedure with the final addresses and an approved retry buffer.

## Release rule

Do not fund or broadcast a Mainnet transaction while a repository or external gate above is open. After deployment, verify every transaction by final receipt, expected events, and read-back state before treating the step as complete.
