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
- [x] Confirm retry, shutdown, and health behavior through the Sepolia supervised smoke test and two successful Mainnet GitHub Actions catch-up runs (`33249047016`, `33249526648`).
- [x] Provide `corepack pnpm migrate` as a separately privileged deployment step; normal indexer startup performs a read-only schema check and does not execute DDL.
- [x] Keep the user-wallet write boundary separate from the backend and validate proven `apply_actions` calls before wallet submission.
- [x] Execute the migration step with the protected migration role and verify the runtime role has its required application privileges. Runs `33249047016` and `33249526648` passed the five-table privilege check.
- [x] Confirm no private keys, viewing keys, RPC credentials, or wallet recovery secrets are present in the repository or release bundle.

## Verification snapshot

Recorded 2026-08-29 from the final working tree:

- `scarb build` and `snforge test`: 26 passed.
- Backend typecheck and build: passed. The default Vitest run: 36 passed, 1 skipped because the PostgreSQL test is guarded when no test database URL is configured.
- `DATABASE_URL=<migration-role-url> corepack pnpm migrate`: completed successfully against the disposable PostgreSQL database and can be rerun idempotently.
- Explicit `corepack pnpm test:postgres`: 1 test passed against a disposable PostgreSQL database. The test covered migration, idempotent replay, router-scoped cursors, lifecycle observation, and reorganization rejection.
- Render deployment preparation: `render.yaml` defines a zero-dollar Sepolia web service with `/healthz`, free PostgreSQL, frozen-lockfile build, idempotent startup migration, secret RPC prompt, and disabled automatic deploys. The service uses the verified router address and its L1-finalized deployment block. Render CLI `v2.25.0` is installed locally, and the Sepolia Blueprint validates with it.
- User-wallet write boundary: `backend/src/wallet-flow.ts` validates the privacy SDK result and forwards the proof to a connected wallet for normal user approval. The backend still holds no signer or viewing key.
- Zero-dollar Mainnet backend: `.github/workflows/vocap-mainnet-indexer.yml` keeps the PostgreSQL projection on Neon Free and runs bounded catch-up jobs through free standard GitHub-hosted runners for this public repository. Migration and runtime database credentials are separated. The protected environment is configured with the verified Mainnet Router address and deployment block. See [ZERO_COST_MAINNET_BACKEND.md](ZERO_COST_MAINNET_BACKEND.md).
- Operational Mainnet runs: the compiled indexer passed the preflight and migration checks, verified the restricted runtime role, and completed two successful bounded catch-up runs. Run `33249047016` processed the first 12 chunks from block `14042348`; follow-up run `33249526648` processed the next 12 chunks through block `14043547`, with no execution failures. The scheduled job continues from the persisted cursor.
- Supervised Render deployment: the first Blueprint sync failed during `pnpm install` because Render's pnpm supply-chain policy blocked the unused `esbuild` install script. Commit `69865b89108a3ca86095c95b43158f793ccc6dd6` added `--ignore-scripts` to both deployment profiles. The replacement Sepolia deploy succeeded, completed the database migration, and is live at `https://vocap-sepolia-indexer.onrender.com`. The `/healthz` check returned `status: ok` with no sync error while the initial projection backfill continued.
- Render provider validation: the authenticated CLI reports `valid: true`. The free resources `vocap-sepolia-indexer` and `vocap-sepolia-postgres` are now created in Frankfurt, with automatic deploys disabled. The database remains available for the supervised Sepolia deployment.
- Live Sepolia RETURN, reuse, succession, stale-note rejection, and backend projection evidence is recorded in [SEPOLIA_RUNBOOK.md](SEPOLIA_RUNBOOK.md). The RETURN receipts reached L1 finality. The newer succession receipts were successful and accepted on L2 when recorded.
- Mainnet funding, deployment, policy setup, and the seven-call private lifecycle were completed and are recorded in the [Mainnet deployment record](#mainnet-deployment-record) below.
- Official privacy SDK preflight: immutable tag `PRIVACY-0.14.3-RC.2` at commit `9bfeb8dd35565a2915a0617dff3f649bd5bb891a` was installed with the upstream npm lockfile and built successfully. The fast suite passed `252` tests across `26` files, and the complete WSL suite passed `259` tests across `28` files with the pinned RC2-compatible `starknet-devnet 0.8.0-rc.3` launcher. The deterministic pin is recorded in [PRIVACY_RC2_PIN.md](PRIVACY_RC2_PIN.md).
- Mainnet dependency refresh: the pool class hash remains `0x67dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d`, version `2.0`, fee `6 STRK`, and proof window `450` blocks. Prover and discovery health returned HTTP 200, and the active RC2 proof lifecycle passed. See [STARKNET_MAINNET_DEPENDENCIES.md](STARKNET_MAINNET_DEPENDENCIES.md).
- Mainnet operator refresh: `scarb build` passed, all `26` contract tests passed, backend typecheck and build passed, the default backend run reported `39` passed and `1` guarded skip, and the forced PostgreSQL integration test passed `1` test against `vocap_test`.
- Mainnet wallet final read-back: address `0x075f37debf547892cfcd1fa0e4d383a6cdec6b791dd8805078bf7ae65151f964`, class hash `0x3957f9f5a1cbfe918cedc2015c85200ca51a5f7506ecb6de98a5207b759bf8a`, deployed `true`, nonce `0x10`, and balance `45.919283977923319621 STRK`. The account class matches Braavos and the pool allowance is `0` after the approved seven-call sequence.
- A non-broadcast proof-context rehearsal using the official RC2 SDK and the live Mainnet prover and discovery services returned `9` proof facts and an `apply_actions` call with `18` output words. The fresh viewing key was held in memory only. The subsequent approved lifecycle submitted the same RC2 proof path successfully.

The remaining pre-write observations below are retained as historical snapshots. They document the state before the approved Mainnet writes and do not describe the current deployed state.

### Historical pre-write snapshots

- The exact frozen Sepolia Router and target completed the seven-call lifecycle on 2026-08-29 with three successful Router executions, private succession, and safe stale-note rejection. That operator run used the later local `2.1` checkout to validate the current pool behavior. The immutable RC2 tag separately rebuilt successfully, passed the local SDK suite, and produced the fresh non-broadcast Mainnet proof context above. The service release-family gate remains open until the deployed prover and discovery revisions are identified.
- The latest read-only Mainnet preflight at block `14,026,607` matched the independent provider head, confirmed `SN_MAIN`, the Braavos account class, nonce `0x2`, balance `126.443768493564389985 STRK`, pool version `2.0`, a `6 STRK` pool fee, and a `450`-block proof window. The pool allowance is `0`, both frozen classes remain undeclared, and both frozen addresses remain undeployed. Validation-on declaration estimates were `28.585986838656604272 STRK` for the Router and `4.847987086178896368 STRK` for the target. No Mainnet transaction was submitted.
- The latest active RC2 proof preflight at block `14,040,550` with proving block `14,040,540` received HTTP `200` from both health and both OHTTP-key endpoints, returned prover spec `0.10.3-rc.2`, `9` proof facts, `18` `apply_actions` words, and `316432` proof bytes, and stopped before fee submission because the pool allowance is `0`. The same-day service refresh exposed no immutable revision or image digest.
- The newest read-only Mainnet estimate at block `14,026,733`, with the independent provider at `14,026,734`, kept the pool allowance at `0` and both frozen addresses undeployed. Validation-on declaration estimates were `28.540588518293788620 STRK` for the Router and `4.840287747208839180 STRK` for the target. An isolated estimate for the reviewed `43 STRK` allowance approval was `0.150653541579872337 STRK`. These moving quotes do not replace the required full sequential estimate, and no Mainnet transaction was submitted.
- The exact RC2 package-lock install was repeated in the active `.tools/starknet-privacy` checkout. Native Scarb `2.17.0` generated the `privacy_Privacy`, `privacy_MockAMM`, and `privacy_MockSwapExecutor` class and compiled-class fixtures. `npm run build` passed, the fast suite passed `252` tests, and the complete SDK command passed `259` tests across `28` files. The live service image revision remains unverified.
- The fresh RC2 Mainnet public preflight at block `14,040,539`, with independent provider block `14,040,540`, matched `SN_MAIN`, the Braavos account class, nonce `0x2`, balance `126.443768493564389985 STRK`, pool version `2.0`, a `6 STRK` pool fee, and a `450`-block proof window. Both frozen classes and addresses remain undeclared and undeployed, and the pool allowance remains `0`.
- The same preflight returned validation-on declaration estimates of `29.170380944846550924 STRK` for the Router and `4.947096903101895852 STRK` for the target, a declaration subtotal of `34.117477847948446776 STRK`. The reviewed `43 STRK` approval estimate was `0.153978902159965713 STRK`. Including the known `42 STRK` protocol component and `1 STRK` capability principal, the current measurable floor is `77.271456750108412489 STRK`. These are partial moving quotes, not the exact full-sequence wallet requirement.
- The current read-only block was `14,018,608`. The pool still reported `6 STRK` protocol fee and a `450`-block proof-validity window. Frozen salts derived Router `0x6048ed36607367ea5ae050c745d47006214ecf66fdbf173d01eba96ec5d780a` and target `0x74637f577350898c64835c88216df3030050828c723c6987a3d97d6d4eb986b` addresses through the unique UDC path.

The production sequence is: provision the migration role as the database or schema owner, run the migration job once, grant the runtime role `USAGE` plus application DML on the `vocap_*` tables, then start the indexer with only the runtime URL.

## Mainnet deployment record

The approved Mainnet deployment and proof lifecycle completed on 2026-08-29 using the exact `PRIVACY-0.14.3-RC.2` SDK checkout at commit `9bfeb8dd35565a2915a0617dff3f649bd5bb891a`. The frozen Router and target classes were declared and deployed through the UDC at the deterministic addresses recorded in [MAINNET_HANDOFF.md](MAINNET_HANDOFF.md). Policy `1` read back with the Mainnet STRK token, amount `1 STRK`, the deployed target, selector `premium_action`, and an empty target-calldata span.

The seven private-pool calls all returned `SUCCEEDED` and `ACCEPTED_ON_L2`: Alice registration, Bob registration, initial 1 STRK deposit, Alice's first Router execution, Alice's second Router execution, Alice-to-Bob succession, and Bob's Router execution. The target action count advanced from `0` to `3`. Alice's spent-note reuse was rejected before wallet submission. The complete sanitized evidence is outside the repository at [2026-08-29-mainnet-private-lifecycle.json](C:/Users/HomePC/Documents/VOCAP-mainnet-evidence/2026-08-29-mainnet-private-lifecycle.json).

The final operator-wallet debit was `80.524484515641070364 STRK`, leaving `45.919283977923319621 STRK` at the final read. It covers the actual declarations, deployments, policy and approval network fees, the two privacy registrations, deposit, succession, three Router executions, `42 STRK` in pool fees, the `1 STRK` capability principal, and `2 STRK` sent to the disposable Bob account. The exact receipt network-fee sum, including Bob's account-deployment fee, was `35.605562309795264188 STRK`.

A final dual-provider public preflight at block `14043972` matched `SN_MAIN`, the Braavos account class, the deployed Router and target classes and addresses, nonce `0x10`, balance `45.919283977923319621 STRK`, pool version `2.0`, the `6 STRK` fee, the `450`-block proof window, zero remaining allowance, and an empty error set.

The protected GitHub environment now has `VOCAP_ROUTER_ADDRESS` and `VOCAP_START_BLOCK=14042348`. Initial preflight run `33248999756` passed, and final preflight run `33251420976` passed against release commit `a81fdac3cf9bb7cff4ede961b7925aae162a0187`. Migration and initial sync run `33249047016` passed setup, build, migration, and runtime-role verification, then processed the first 12 50-block chunks from the Router deployment block. Follow-up run `33249526648` passed the same checks and processed the next 12 chunks through block `14043547`, with no execution failures. The scheduled job continues from the persisted cursor. A zero-block no-op run has not been captured, so local idempotence tests plus repeated successful catch-up are the available cursor evidence.

The live prover and discovery services returned HTTP 200, OHTTP keys, and prover spec `0.10.3-rc.2` during the lifecycle. They do not expose immutable image digests or revisions, so the release record keeps that provenance limitation open rather than inferring it.

## External gates

- [x] Complete the real Sepolia STRK20 RETURN and succession sequence with receipt, pool note, stale-note rejection, and backend indexing evidence. See [SEPOLIA_RUNBOOK.md](SEPOLIA_RUNBOOK.md) for the transaction record and the remaining L1 settlement-status follow-up for the newer succession receipts.
- [x] Complete the Mainnet privacy-pool proof-context gate. The live pool address, class hash, version, fee, proof window, upstream action ordering, and a non-broadcast RC2 proof-context rehearsal are recorded.
- [x] Confirm the frozen V1 target uses the intended empty target-calldata shape. The target ABI has no inputs, the V1 builder emits a zero-length span by default, and the existing security review accepts the configured privacy pool as the calldata trust boundary. Arbitrary target calldata remains outside the reviewed V1 path.
- [ ] Verify the proving and discovery service revisions or image digests against the selected SDK release. The live RC2 protocol and proof path passed, but the endpoints expose no immutable digest or revision.
- [x] Select a fresh Mainnet wallet and record only its public address and wallet type. Keep signing material outside the repository. The read-back account is a deployed Braavos account.
- [x] Refresh the final sequential fee accounting for account setup, declarations, deployments, policy configuration, funding, and proof-backed private actions.
- [x] Declare and deploy the frozen classes, then read back class hashes and constructor state from Mainnet.
- [x] Create policy `1` and read it back from the live Router.
- [x] Rehearse the deployment and recovery procedure with the final addresses, receipts, stale-note guard, and approved sequence.

## Release rule

Every submitted Mainnet transaction in the approved sequence was verified by final receipt and read-back state before the next dependent write. The remaining operational work is the final GitHub cursor/idempotence observation and immutable service-image provenance, neither of which changes the deployed contract or proof evidence.
