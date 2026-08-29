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

Recorded 2026-08-29 from the final working tree:

- `scarb build` and `snforge test`: 26 passed.
- Backend typecheck and build: passed. The default Vitest run: 36 passed, 1 skipped because the PostgreSQL test is guarded when no test database URL is configured.
- `DATABASE_URL=<migration-role-url> corepack pnpm migrate`: completed successfully against the disposable PostgreSQL database and can be rerun idempotently.
- Explicit `corepack pnpm test:postgres`: 1 test passed against a disposable PostgreSQL database. The test covered migration, idempotent replay, router-scoped cursors, lifecycle observation, and reorganization rejection.
- Render deployment preparation: `render.yaml` defines a zero-dollar Sepolia web service with `/healthz`, free PostgreSQL, frozen-lockfile build, idempotent startup migration, secret RPC prompt, and disabled automatic deploys. The service uses the verified router address and its L1-finalized deployment block. Render CLI `v2.25.0` is installed locally, and the Sepolia Blueprint validates with it.
- User-wallet write boundary: `backend/src/wallet-flow.ts` validates the privacy SDK result and forwards the proof to a connected wallet for normal user approval. The backend still holds no signer or viewing key.
- Zero-dollar Mainnet backend preparation: `.github/workflows/vocap-mainnet-indexer.yml` keeps the PostgreSQL projection on Neon Free and runs bounded catch-up jobs through free standard GitHub-hosted runners for this public repository. Migration and runtime database credentials are separated. The workflow remains inactive until the verified Mainnet Router address and deployment block are configured. See [ZERO_COST_MAINNET_BACKEND.md](ZERO_COST_MAINNET_BACKEND.md).
- Operational smoke test: the compiled indexer connected to Sepolia and PostgreSQL, projected blocks `14143062` through `14143086`, received `SIGTERM`, closed cleanly, and exited with status `0`. The broader operational gate remains open until retry and ongoing cursor health are observed on the supervised Render service.
- Supervised Render deployment: the first Blueprint sync failed during `pnpm install` because Render's pnpm supply-chain policy blocked the unused `esbuild` install script. Commit `69865b89108a3ca86095c95b43158f793ccc6dd6` added `--ignore-scripts` to both deployment profiles. The replacement Sepolia deploy succeeded, completed the database migration, and is live at `https://vocap-sepolia-indexer.onrender.com`. The `/healthz` check returned `status: ok` with no sync error while the initial projection backfill continued.
- Render provider validation: the authenticated CLI reports `valid: true`. The free resources `vocap-sepolia-indexer` and `vocap-sepolia-postgres` are now created in Frankfurt, with automatic deploys disabled. The database remains available for the supervised Sepolia deployment.
- Live Sepolia RETURN, reuse, succession, stale-note rejection, and backend projection evidence is recorded in [SEPOLIA_RUNBOOK.md](SEPOLIA_RUNBOOK.md). The RETURN receipts reached L1 finality. The newer succession receipts were successful and accepted on L2 when recorded.
- No Mainnet funding, deployment, or private transaction was attempted.
- Official privacy SDK preflight: immutable tag `PRIVACY-0.14.3-RC.2` at commit `9bfeb8dd35565a2915a0617dff3f649bd5bb891a` was installed with the upstream npm lockfile and built successfully. The fast suite passed `252` tests across `26` files with coverage disabled. The deterministic pin is recorded in [PRIVACY_RC2_PIN.md](PRIVACY_RC2_PIN.md).
- Mainnet dependency refresh: at block `14,001,956`, the pool class hash remained `0x67dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d`, version `2.0`, fee `6 STRK`, and proof window `450` blocks. Prover and discovery health returned HTTP 200. See [STARKNET_MAINNET_DEPENDENCIES.md](STARKNET_MAINNET_DEPENDENCIES.md).
- Mainnet operator refresh: `scarb build` passed, all `26` contract tests passed, backend typecheck and build passed, the default backend run reported `39` passed and `1` guarded skip, and the forced PostgreSQL integration test passed `1` test against `vocap_test`.
- Mainnet wallet read-back: address `0x075f37debf547892cfcd1fa0e4d383a6cdec6b791dd8805078bf7ae65151f964`, class hash `0x3957f9f5a1cbfe918cedc2015c85200ca51a5f7506ecb6de98a5207b759bf8a`, deployed `true`, nonce `0x2`, and balance `126.443768493564389985 STRK`. The account class matches Braavos and the local wallet label is `braavos`.
- A non-broadcast proof-context rehearsal using the official RC2 SDK and the live Mainnet prover and discovery services returned `9` proof facts and an `apply_actions` call with `18` output words. The fresh viewing key was held in memory only.
- The exact frozen Sepolia Router and target completed the seven-call lifecycle on 2026-08-29 with three successful Router executions, private succession, and safe stale-note rejection. That operator run used the later local `2.1` checkout to validate the current pool behavior. The immutable RC2 tag separately rebuilt successfully, passed the local SDK suite, and produced the fresh non-broadcast Mainnet proof context above. The service release-family gate remains open until the deployed prover and discovery revisions are identified.
- The latest read-only Mainnet preflight at block `14,026,607` matched the independent provider head, confirmed `SN_MAIN`, the Braavos account class, nonce `0x2`, balance `126.443768493564389985 STRK`, pool version `2.0`, a `6 STRK` pool fee, and a `450`-block proof window. The pool allowance is `0`, both frozen classes remain undeclared, and both frozen addresses remain undeployed. Validation-on declaration estimates were `28.585986838656604272 STRK` for the Router and `4.847987086178896368 STRK` for the target. No Mainnet transaction was submitted.
- The latest active RC2 proof preflight at block `14,036,380` with proving block `14,036,370` received HTTP `200` from both health and both OHTTP-key endpoints, returned `9` proof facts, `18` `apply_actions` words, and `305284` proof bytes, and stopped before fee submission because the pool allowance is `0`. The same-day service refresh exposed no immutable revision or image digest.
- The newest read-only Mainnet estimate at block `14,026,733`, with the independent provider at `14,026,734`, kept the pool allowance at `0` and both frozen addresses undeployed. Validation-on declaration estimates were `28.540588518293788620 STRK` for the Router and `4.840287747208839180 STRK` for the target. An isolated estimate for the reviewed `43 STRK` allowance approval was `0.150653541579872337 STRK`. These moving quotes do not replace the required full sequential estimate, and no Mainnet transaction was submitted.
- The exact RC2 package-lock install was repeated in the active `.tools/starknet-privacy` checkout. `npm run build` passed, the fast suite passed `252` tests, and the full command passed `254` tests across `27` files. The five devnet tests remain environment-gated because the release checkout lacks the generated Cairo fixture `target/dev/privacy_Privacy.contract_class.json`; the official `starknet-devnet` `v0.8.0-rc.3` CLI was available through WSL. The live service image revision remains unverified.
- The fresh RC2 Mainnet public preflight at block `14,036,397`, with independent provider block `14,036,398`, matched `SN_MAIN`, the Braavos account class, nonce `0x2`, balance `126.443768493564389985 STRK`, pool version `2.0`, a `6 STRK` pool fee, and a `450`-block proof window. Both frozen classes and addresses remain undeclared and undeployed, and the pool allowance remains `0`.
- The same preflight returned validation-on declaration estimates of `29.025130977629019864 STRK` for the Router and `4.922464000767769944 STRK` for the target, a subtotal of `33.947594978396789808 STRK`. The reviewed `43 STRK` approval estimate was `0.153212885559880554 STRK`. These are partial moving quotes, not the exact full-sequence wallet requirement.
- The current read-only block was `14,018,608`. The pool still reported `6 STRK` protocol fee and a `450`-block proof-validity window. Frozen salts derived Router `0x6048ed36607367ea5ae050c745d47006214ecf66fdbf173d01eba96ec5d780a` and target `0x74637f577350898c64835c88216df3030050828c723c6987a3d97d6d4eb986b` addresses through the unique UDC path.

The production sequence is: provision the migration role as the database or schema owner, run the migration job once, grant the runtime role `USAGE` plus application DML on the `vocap_*` tables, then start the indexer with only the runtime URL.

## External gates

- [x] Complete the real Sepolia STRK20 RETURN and succession sequence with receipt, pool note, stale-note rejection, and backend indexing evidence. See [SEPOLIA_RUNBOOK.md](SEPOLIA_RUNBOOK.md) for the transaction record and the remaining L1 settlement-status follow-up for the newer succession receipts.
- [x] Complete the Mainnet privacy-pool proof-context gate. The live pool address, class hash, version, fee, proof window, upstream action ordering, and a non-broadcast RC2 proof-context rehearsal are recorded.
- [x] Confirm the frozen V1 target uses the intended empty target-calldata shape. The target ABI has no inputs, the V1 builder emits a zero-length span by default, and the existing security review accepts the configured privacy pool as the calldata trust boundary. Arbitrary target calldata remains outside the reviewed V1 path.
- [ ] Verify the proving and discovery service revisions or image digests against the selected SDK release.
- [x] Select a fresh Mainnet wallet and record only its public address and wallet type. Keep signing material outside the repository. The read-back account is a deployed Braavos account.
- [ ] Refresh exact fee estimates for account setup, declarations, deployments, policy configuration, funding, and proof-backed private actions.
- [ ] Declare and deploy the frozen classes, then read back class hashes and constructor state from Mainnet.
- [ ] Create policy `1` and read it back from the live Router.
- [ ] Rehearse the deployment and recovery procedure with the final addresses and an approved retry buffer.

## Release rule

Do not fund or broadcast a Mainnet transaction while a repository or external gate above is open. After deployment, verify every transaction by final receipt, expected events, and read-back state before treating the step as complete.
