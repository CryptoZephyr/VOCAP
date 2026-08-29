# VOCAP Mainnet handoff

Last updated: 2026-08-29

Repository: `https://github.com/CryptoZephyr/VOCAP`

Release branch: `main`

Handoff commit at preparation time: `6475cb7647d496bd99e81dd2ac6fbaa6d000de03`

Status: pre-write refresh completed. Local verification and a non-broadcast Mainnet proof-context rehearsal passed. A Sepolia-only faucet funding checkpoint and Braavos account deployment also succeeded. No Mainnet declaration, deployment, policy write, funding transfer, private registration, private action, or scoring transaction has been submitted. Mainnet signing remains paused while the exact frozen Sepolia rehearsal, service provenance, and final sequential fee approval are open.

This file is the execution handoff for the frozen VOCAP V1 release. It records what is ready, what must remain unchanged, the wallet and secret boundaries, the required transaction order, the corrected cost model, the STRK20 scoring evidence, the zero-cost backend activation sequence, and the conditions for stopping.

## Executive summary

VOCAP's contract and backend verification suites pass. The frozen contract artifacts and source hashes are recorded below. A real RETURN, capability reuse, private succession, stale-note rejection, and PostgreSQL projection flow has been demonstrated on Sepolia using an older Router deployment. The frozen Router contains a later surplus-balance fix, so the exact frozen Router still needs a final Sepolia rehearsal before Mainnet writes.

The Mainnet backend is prepared on a zero-monthly-cost pilot design:

- Neon Free stores the PostgreSQL projection.
- A scheduled GitHub Actions workflow catches up finalized blocks.
- The backend is read-only with respect to Starknet and holds no wallet signer or viewing key.
- Users approve private writes from their own wallet process.

The Mainnet workflow is currently safe and inactive. The RPC and database secrets exist in the protected `vocap-mainnet` GitHub environment. `VOCAP_ROUTER_ADDRESS` and `VOCAP_START_BLOCK` must stay unset until the Router has been deployed and read back from Mainnet.

The public wallet was funded and deployed on Sepolia only as a rehearsal checkpoint. The faucet transfer and account deployment succeeded, but the remaining testnet balance is below the cost of the complete seven-call private lifecycle. This did not touch the Mainnet wallet or Mainnet configuration.

The conservative provisional wallet target is `106 STRK`. This is a planning ceiling, not a final quote. The configured Mainnet wallet currently reports `126.443768493564389985 STRK`, but the current declaration-only estimate is `33.722541433835540256 STRK` and the remaining deployment, policy, funding, and proof-backed calls still need a sequential estimate. Immediately before funding or signing, replace the planning ceiling with a fresh estimate for the final wallet, salts, addresses, calldata, and real proof contexts.

## Non-negotiable security boundary

The normal production write path is user approved. The backend and scheduled indexer never sign transactions.

Never place any of the following in Git, this handoff, GitHub variables, GitHub Actions logs, Neon, Render, issue comments, pull requests, screenshots, or agent prompts:

- private keys;
- seed phrases or recovery phrases;
- wallet export files;
- privacy viewing keys;
- private note witnesses or registries;
- proof-signing material;
- database passwords or full connection strings;
- authenticated RPC URLs when they contain credentials.

The root `.gitignore` excludes `.env` and `.env.*`, except `.env.example`. The dedicated operator file is `.env.mainnet.local`. Before every commit, still run a secret scan and inspect the staged diff. Ignore rules reduce accidents but do not make a secret safe after it has been staged or printed.

Preferred wallet boundary:

1. Connect Argent X, Braavos, or another compatible Starknet wallet locally.
2. Keep the signer inside the wallet extension or user-controlled wallet process.
3. Let the official privacy SDK build and prove the private action locally.
4. Let the user inspect and approve the final transaction in the wallet.
5. Give the backend only the public transaction hash for lifecycle tracking.

If a local command-line signer is used, its secret may exist only in an ignored local environment or OS secret store for that process. It must never be copied to the backend or GitHub Actions. Browser-wallet approval remains the preferred release path.

## Local wallet configuration

Configure the local ignored file `.env.mainnet.local` at the repository root. Use real values only on the operator machine. The following template contains placeholders and must not be committed:

```dotenv
STARKNET_NETWORK=mainnet
STARKNET_RPC_URL=<mainnet-rpc-url>

# Public deployment account metadata
STARKNET_ACCOUNT_ADDRESS=<public-mainnet-wallet-address>
STARKNET_WALLET_TYPE=<argent-x-or-braavos-or-other-reviewed-wallet>
STARKNET_ACCOUNT_DEPLOYED=<true-or-false>

# Public upstream contracts and services
STRK20_POOL_ADDRESS=0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a
CAPABILITY_TOKEN_ADDRESS=0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
PROVING_SERVICE_URL=<verified-compatible-mainnet-prover-url>
DISCOVERY_SERVICE_URL=<verified-compatible-mainnet-discovery-url>

# Fill these only after deployment and read-back
VOCAP_ROUTER_ADDRESS=
VOCAP_TARGET_ADDRESS=
VOCAP_ROUTER_DEPLOYMENT_BLOCK=
VOCAP_POLICY_ID=1

# Freeze the final choices before fee estimation
VOCAP_ROUTER_DEPLOYMENT_SALT=<public-final-salt>
VOCAP_TARGET_DEPLOYMENT_SALT=<public-final-salt>
VOCAP_POLICY_AMOUNT=1000000000000000000
VOCAP_TARGET_SELECTOR=premium_action
```

Do not add a private key or viewing key to `.env.example`. If the selected local wallet tool requires a private-key variable, configure it only in the ignored local environment and verify with `git status` that no secret-bearing file is staged.

## Frozen release basis

Use these exact production dependencies:

| Component | Frozen value |
| --- | --- |
| Scarb | `2.20.1` |
| Cairo | `2.20.0` |
| Starknet.js | `10.5.0` |
| Privacy SDK | `@starkware-libs/starknet-privacy-sdk@0.14.3-rc.5` |
| Privacy SDK tag | `PRIVACY-0.14.3-RC.5` |
| Privacy SDK commit | `66e3caae8c0201227a6719696d004e30d90aea65` |

Do not use the later local privacy checkout at commit `51652200561151499b03f90e3a05f03c91f5b349`. It contains unreleased V2.1 changes while retaining the RC.5 package version. The selected Mainnet pool reports version `2.0`.

Frozen artifacts:

| Contract | Sierra class hash | CASM compiled class hash | Sierra SHA-256 | CASM SHA-256 |
| --- | --- | --- | --- | --- |
| `VocapRouter` | `0x7f36c12a5d08a3b64cead89d94ac1969f8c6424dadd91731ad1ee3e20a6dde8` | `0x1041c8a960487be590d523bc28c9e16dc60132f9fe188b86e581478b5f05025` | `EB04D2F4D5C4E0B0FB40C7BAD9B32DEF94DCD057B4A645A82776E0D23C7CD29E` | `4FB7E23885FDEEE85AB5AE2C10A141A12C1C5D62D2BEEF982A08550594A9D09B` |
| `VocapApprovedTarget` | `0x7d637107437a81f099e7dd761fbd812059882fca8e62031a5979d6932f80a2f` | `0x4f5f6e21ea82b54e426e1b0d9f4e5f5eb1e4d3113fc634b414787ec06896b9f` | `26D4D5462920F1D96F3C318CAA0C302543A9EF1289FDF3F9B2F5CCA6A2F26045` | `DAF459E2D878464B0B083BE3B11D255BE483BFB568899057956E9E44F5741AE1` |

Source locks:

| File | SHA-256 |
| --- | --- |
| `contracts/src/vocap_router.cairo` | `8DCBE622F6C995D19BCE4D5F1514314D9BEDB8764A478AEADFE79559BC0C3D6B` |
| `contracts/src/vocap_approved_target.cairo` | `23F0B10406207ADC46599DD0EA96D80D4B778FF5DAC8700AA37C7BE39E7BB3EB` |
| `contracts/Scarb.toml` | `694A0736D50C4B36E0866DF4BFA584CA15D268C114AF4D4924B556F8462911CA` |
| `contracts/Scarb.lock` | `E8D15E2BDBDEEB4E2F789CC007AD2922C016120A3F5C40F837CB9213768E865C` |

Any change to a locked source, dependency, class hash, compiled class hash, or artifact digest invalidates the freeze. Stop, rebuild, retest, and issue a new freeze instead of deploying a mixed release.

## Verified state at handoff

The following evidence already exists:

- `scarb build` passed.
- `snforge test` passed all `26` contract tests.
- Backend typecheck and build passed.
- Backend default tests passed, with the PostgreSQL integration test guarded unless a test database is configured.
- The explicit PostgreSQL integration test passed against PostgreSQL.
- The Neon production schema migration completed successfully.
- The restricted Neon runtime role passed the runtime-role verifier and cannot perform DDL or destructive table operations.
- The official immutable privacy SDK RC.5 built successfully.
- The official external-invoke and compute-and-invoke suites passed `7` tests with coverage disabled.
- The historical Sepolia Router completed RETURN, reuse, succession, stale-note rejection, and backend projection.
- The zero-cost Mainnet workflow preflight passed on GitHub Actions run `33189649181`.
- The working tree was clean and `main` matched `origin/main` at handoff preparation time.

The 2026-08-29 operator refresh added this evidence:

- `scarb build` passed with Scarb `2.20.1`, and `snforge test` passed all `26` tests again.
- Backend typecheck, build, and the default Vitest run passed. The default run reported `39` passed and `1` skipped because the PostgreSQL test is guarded without a URL.
- The forced PostgreSQL integration test passed `1` test against the local `vocap_test` database.
- The Mainnet wallet read back as address `0x075f37debf547892cfcd1fa0e4d383a6cdec6b791dd8805078bf7ae65151f964`, account class `0x3957f9f5a1cbfe918cedc2015c85200ca51a5f7506ecb6de98a5207b759bf8a`, deployed state `true`, nonce `0x2`, and balance `126.443768493564389985 STRK`. The account class matches Braavos and the local wallet label is now corrected to `braavos`.
- An independent Mainnet RPC read through Cartridge at block `14,019,218` returned the same chain ID and exact STRK balance as the Lava read.
- A second independent Cartridge read at block `14,019,330` returned the configured pool class hash, the `6 STRK` protocol fee, and the `450`-block proof-validity window.
- The live Mainnet refresh at block `14,018,608` confirmed chain `SN_MAIN`, the frozen STRK20 pool address, pool fee `6 STRK`, and proof-validity window `450` blocks.
- The frozen salts derived expected Router `0x6048ed36607367ea5ae050c745d47006214ecf66fdbf173d01eba96ec5d780a` and target `0x74637f577350898c64835c88216df3030050828c723c6987a3d97d6d4eb986b` through the unique UDC path. Both deployment address fields remain blank until a write is approved.
- A fresh Cartridge Mainnet read at block `14,019,437` confirmed both expected deterministic addresses are still undeployed.
- The same provider at block `14,019,454` confirmed the frozen Router and target Sierra class hashes are still undeclared on Mainnet.
- A real RC.5 SDK proof-context rehearsal completed against the live Mainnet prover and discovery services using an in-memory viewing key. The prover returned `9` proof facts, `18` output words, and an `apply_actions` call. No transaction was broadcast and no viewing key was persisted.
- The prover health endpoint returned HTTP `200`, JSON-RPC spec `0.10.3-rc.2`, and a `43`-byte OHTTP key response. Discovery health returned HTTP `200`, `status: OK`, Mainnet chain head `14,018,643`, and about `5` seconds of lag. The live image digests are still not exposed by either service.
- A final read-only service refresh remained healthy: both health endpoints returned HTTP `200`, both OHTTP key responses were `43` bytes, and discovery reported Mainnet chain head `14,019,416` with about `5` seconds of lag. This refresh still exposed no immutable image digest.
- The corresponding alpha-Sepolia prover and discovery hosts are reachable for the pending testnet rehearsal. Sepolia prover health and JSON-RPC spec returned `200` and `0.10.3-rc.2`, discovery health returned `200` with a live chain head, and both OHTTP key responses were `43` bytes. These hosts are not substituted into the Mainnet environment, and they still do not expose immutable image digests.
- An initial read-only Sepolia check at block `14,205,377` found the same public wallet address with `1 STRK` and no deployed account class. This was the pre-funding state.
- The candidate historical Sepolia pool read at block `14,205,393` returned its known class hash, a `2 STRK` protocol fee, and a `450`-block proof window. The initial `1 STRK` testnet balance could not cover even one pool protocol-fee call, before account, gas, or contract deployment costs.
- The declaration-only fee estimate at the refresh block was `28.840460154282420096 STRK` for `VocapRouter` and `4.882081279553120160 STRK` for `VocapApprovedTarget`. Deployment and policy estimates correctly remained unavailable because their classes and Router address are not declared or deployed.
- The official public Sepolia faucet transferred `5 STRK` to the public wallet in transaction `0x361d91c86a8289aff2c0ba6b0b29cdd5e5d19005110d888999bae50f2ff242f`. The receipt was `SUCCEEDED` and `ACCEPTED_ON_L2` at block `14,205,514`, with the transfer event showing `5 STRK`.
- The standard Braavos account deployment then succeeded in transaction `0x14210ad15334ae3962e3792e4d4175f19b212cd6f8d9f56320f0581d32cc595`. The receipt was `SUCCEEDED` and `ACCEPTED_ON_L2` at block `14,205,980`, with an actual fee of `0.054521748329982568 STRK`. A post-receipt read returned the expected Braavos account class, and the chain was allowed to advance to block `14,205,997` before the next dependency check.
- A fresh Sepolia read at block `14,206,379` returned the expected Braavos account class and a balance of `5.945478251670017432 STRK`. The candidate pool fee remains `2 STRK` per `apply_actions` call, so this balance cannot fund the seven-call private lifecycle. No Sepolia protocol declaration, Router deployment, policy write, registration, or private action was submitted.

This evidence does not prove the remaining Mainnet deployment or scoring flow.

## Gates that remain open

Do not begin Mainnet signing while any required pre-write gate is open:

- [x] Re-run the full local contract and backend verification from the exact release commit.
- [ ] Deploy the exact frozen Router to Sepolia and repeat the RETURN and succession rehearsal. The older Sepolia Router has a different class hash.
- [ ] Record L1 finality for the remaining historical Sepolia succession receipts or replace them with the exact frozen rehearsal evidence.
- [x] Confirm the final Mainnet wallet public address, wallet type, account class, deployment state, and nonce. The public address, Braavos account class, deployed state, and nonce are read back, and the local wallet label is `braavos`.
- [x] Freeze Router and target deployment salts and derive their expected addresses before submission.
- [ ] Obtain immutable prover and discovery revisions or image digests compatible with the selected release family.
- [ ] Obtain additional Sepolia funding before the exact frozen rehearsal can consume protocol fees. The public faucet checkpoint supplied `5 STRK`, account deployment consumed `0.054521748329982568 STRK`, and the remaining `5.945478251670017432 STRK` is insufficient for seven `2 STRK` pool fees before gas.
- [x] Generate a real Mainnet proof-context rehearsal using the official RC.5 SDK. This was non-broadcast and used a fresh in-memory viewing key.
- [ ] Run a fresh sequential fee estimate for the entire final transaction sequence.
- [ ] Confirm whether the wallet has enough STRK for the approved final estimate and retry buffer. The current balance is above the provisional `106 STRK` planning ceiling, but the final sequential quote and any provider charges remain open.
- [x] Confirm the V1 target uses the reviewed no-argument `premium_action` call and empty target calldata. The deployed target ABI has zero inputs, the V1 builder emits a zero-length span by default, and arbitrary target calldata remains outside the reviewed V1 path.

Health responses alone do not clear the privacy-service compatibility gate. The services returned HTTP 200 and the RC.5 proof-context rehearsal passed, but their immutable deployed image digests were not available. The current upstream compatibility matrix also lists the RC.2 prover, discovery service, and SDK row, so the live service image and the selected RC.5 SDK still need an explicit release-family match before signing.

## Live Mainnet dependency snapshot

The latest read-only refresh used Starknet Mainnet block `14,018,608` on 2026-08-29:

| Item | Observed value |
| --- | --- |
| Chain | `SN_MAIN` |
| Privacy pool | `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a` |
| Pool class hash | `0x67dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d` |
| Pool version | `2.0` |
| `apply_actions` protocol fee | `6000000000000000000` fri, exactly `6 STRK` |
| Proof-validity window | `450` blocks |
| Data availability mode | `BLOB` |

The wallet identity read-back for this refresh was:

| Item | Observed value |
| --- | --- |
| Account address | `0x075f37debf547892cfcd1fa0e4d383a6cdec6b791dd8805078bf7ae65151f964` |
| Account class hash | `0x3957f9f5a1cbfe918cedc2015c85200ca51a5f7506ecb6de98a5207b759bf8a` |
| Account deployed | `true` |
| Account nonce | `0x2` |
| STRK balance | `126.443768493564389985 STRK` |
| Configured wallet label | `braavos` |

The frozen deployment inputs produced these unique UDC addresses:

| Contract | Salt | Expected address |
| --- | --- | --- |
| `VocapRouter` | `0x485692721194e739b3d2854a2d8b857b074b37694dba9f70a39c31b025a1b94` | `0x6048ed36607367ea5ae050c745d47006214ecf66fdbf173d01eba96ec5d780a` |
| `VocapApprovedTarget` | `0x22024e9cf18cdf0ffc40d0f51ae18d3e28e64190214c27c6e6d33506b6c592e` | `0x74637f577350898c64835c88216df3030050828c723c6987a3d97d6d4eb986b` |

Refresh every value immediately before a write. Stop if the chain ID, pool address, pool class hash, version, fee, or proof window differs from the reviewed values.

## Corrected Mainnet cost model

The old five-pool-call model omitted Alice and Bob privacy-account registrations. The corrected V1 lifecycle contains seven `apply_actions` calls:

1. Alice privacy registration.
2. Bob privacy registration.
3. Initial capability deposit or funding.
4. Alice's first Router execution.
5. Alice's second Router execution using the returned note.
6. Alice-to-Bob private succession.
7. Bob's successful Router execution.

At the observed `6 STRK` pool fee, the fixed protocol component is:

```text
7 apply_actions calls x 6 STRK = 42 STRK
```

The capability amount is `1 STRK`. It is principal used through the lifecycle, not a fee. It must be funded once and must not be double counted as consumed network cost.

The conservative historical fee-only model is:

| Component | Reference amount |
| --- | ---: |
| Six setup network transactions | `29.182988878794028464 STRK` |
| Reference account deployment | `0.140112952562932008 STRK` |
| Reference source-to-wallet transfer fee | `0.125399132452186536 STRK` |
| Seven pool protocol fees | `42.000000000000000000 STRK` |
| Seven private-action network-fee proxies | `20.570316948100320576` to `23.830216781634907084 STRK` |
| Raw fee-only range | `92.018817911909467584` to `95.278717745444054092 STRK` |
| Fee-only range with 10% retry buffer | `101.220699703100414343` to `104.806589519988459502 STRK` |
| Wallet requirement after adding 1 STRK principal | `102.220699703100414343` to `105.806589519988459502 STRK` |

Use `106 STRK` only as a provisional conservative planning target. Do not fund from this historical model without the final sequential estimate.

A later read-only estimate at block `14,003,229` reduced the supplied Router and target declaration estimate to `13.643308142616313344 STRK` with validation skipped. That estimate proves the declarations can be estimated without broadcasting. It does not justify lowering the provisional wallet target because the remaining calls, account validation, final nonce, salts, addresses, and private proof contexts were not estimated in the same final sequence.

The 2026-08-29 refresh estimated only the two declarations, with validation skipped and an explicit zero tip to avoid depending on sparse tip statistics:

| Operation | Estimated fee |
| --- | ---: |
| `VocapRouter` declaration | `28.840460154282420096 STRK` |
| `VocapApprovedTarget` declaration | `4.882081279553120160 STRK` |
| Declaration subtotal | `33.722541433835540256 STRK` |

With the deployed wallet's normal account validation enabled, a follow-up estimate at block `14,019,664` returned `28.782763929127762416 STRK` for the Router declaration and `4.872314589998839920 STRK` for the target declaration, a combined `33.655078519126602336 STRK`. Gas prices can change between blocks, so this is still a current read-only quote rather than an approved final budget.

The Router deployment estimate failed closed because its class is not declared. The target deployment and policy estimates failed closed because the target and Router are not deployed. These are expected read-only pre-write results, not errors to bypass.

Before funding, estimate all final operations in order:

1. Account deployment, only if the chosen wallet account is undeployed.
2. Router declaration.
3. Approved target declaration.
4. Router deployment through the UDC.
5. Approved target deployment through the UDC.
6. Policy creation.
7. STRK approval.
8. Source-to-wallet funding transfer, if required.
9. Alice privacy registration.
10. Bob privacy registration.
11. Initial capability deposit.
12. Alice's first Router execution.
13. Alice's second Router execution.
14. Alice-to-Bob private succession.
15. Bob's successful Router execution.

Remove account deployment or source transfer only when the final wallet state proves they are unnecessary. Estimate private calls with the actual SDK-generated call, proof facts, and proof data. Do not scale an old receipt by the current gas price and call it exact.

## Required Mainnet execution order

Every write is a separate checkpoint. Wait for a successful final receipt and perform the stated read-back before proceeding. A submitted or pending transaction is not success.

### Phase 0: final preflight

1. Check out the exact approved release commit.
2. Confirm `git status --short` is empty.
3. Recalculate all frozen hashes and compare them with this handoff.
4. Run the contract build and all contract tests.
5. Run backend typecheck, tests, PostgreSQL integration, and build.
6. Confirm the connected wallet reports `SN_MAIN` and the expected public address.
7. Confirm the Mainnet RPC reports `SN_MAIN`.
8. Refresh the pool class hash, version, fee, and proof window.
9. Confirm service compatibility evidence.
10. Complete and save the final sequential fee estimate without broadcasting.
11. Record the approved maximum total and retry policy.

Stop immediately on any mismatch.

### Phase 1: wallet and funding

1. Determine whether the selected wallet account is already deployed.
2. If undeployed, estimate and deploy it through the wallet's supported flow.
3. Wait for a successful final receipt and read back the account class hash.
4. Transfer only the approved STRK amount to the user-controlled wallet.
5. Verify the wallet balance through two independent read-only sources when practical.

Do not send funds to a derived address until its class, constructor, salt, and address calculation have been verified.

### Phase 2: declarations

1. Declare the frozen `VocapRouter` Sierra and CASM pair.
2. Wait for success and verify the declared Sierra class hash is exactly `0x7f36c12a5d08a3b64cead89d94ac1969f8c6424dadd91731ad1ee3e20a6dde8`.
3. Declare the frozen `VocapApprovedTarget` Sierra and CASM pair.
4. Wait for success and verify the declared Sierra class hash is exactly `0x7d637107437a81f099e7dd761fbd812059882fca8e62031a5979d6932f80a2f`.

If a class already exists, verify the exact class hash and artifact match. Do not redeclare or substitute another class merely because it has a similar ABI.

### Phase 3: deterministic deployments

1. Derive the expected Router and target addresses from the frozen class hashes, constructors, UDC uniqueness setting, deployer, and final salts.
2. Deploy the Router through the reviewed UDC path.
3. Verify its final receipt, deployed address, class hash, constructor state, pool address, and administrative state.
4. Record the finalized Router deployment block. This becomes `VOCAP_START_BLOCK` for the indexer.
5. Deploy `VocapApprovedTarget` through the reviewed UDC path.
6. Verify its final receipt, address, class hash, constructor state, and initial action count.

Never infer an address from a transaction hash alone. Read it back from Mainnet.

### Phase 4: policy configuration

Create policy `1` with the reviewed values:

| Field | Required V1 value |
| --- | --- |
| Token | Mainnet STRK, `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` |
| Amount | `1000000000000000000` fri, or `1 STRK` |
| Target | Deployed and verified `VocapApprovedTarget` address |
| Selector | `premium_action` |
| Target calldata | Empty |
| Return mode | Enabled |
| Policy enabled | Yes |

After the policy transaction is final:

1. Read policy `1` back from the Router.
2. Compare every field with the intended values.
3. Confirm the target action count is still at its expected initial value.
4. Record the policy transaction hash, block, receipt status, and read-back output.

Stop if any field differs.

### Phase 5: approval and privacy registration

1. Approve only the amount required by the reviewed privacy funding flow.
2. Register Alice's privacy account through the selected official RC.5 SDK path.
3. Wait for a successful final receipt and confirm discovery recognizes Alice.
4. Register Bob's privacy account.
5. Wait for a successful final receipt and confirm discovery recognizes Bob.
6. Confirm both registrations used the reviewed pool and service release family.

Each registration is currently budgeted as its own `apply_actions` call and therefore its own `6 STRK` pool fee plus Starknet network gas.

### Phase 6: initial capability funding

1. Deposit the `1 STRK` capability amount into Alice's private state.
2. Wait for a successful final receipt.
3. Confirm discovery returns the intended fresh note for Alice.
4. Record the transaction hash and note-discovery evidence without publishing private viewing data.

### Phase 7: the proof lifecycle

Run the meaningful V1 sequence:

1. Alice uses the capability once through `VocapRouter`.
2. Confirm the target action count increases by one.
3. Confirm the Router returns the same `1 STRK` capability into a fresh private note.
4. Alice uses the returned capability a second time through `VocapRouter`.
5. Confirm the action count increases again and a fresh return note exists.
6. Alice privately transfers the capability to Bob.
7. Confirm Alice's spent note disappears and Bob discovers the fresh note.
8. Attempt to reuse Alice's spent note only through a safe simulation or prover rejection path. Do not deliberately broadcast a known-invalid transaction.
9. Bob uses the capability successfully through `VocapRouter`.
10. Confirm the action count increases and the expected return state exists.

Wait for finality and refresh state before building each dependent proof. The proof-validity window was `450` blocks at handoff time. The SDK guidance also requires proofs to use sufficiently finalized state rather than the unstable chain tip.

## STRK20 scoring proof

The hackathon requires at least three successful Mainnet transaction hashes. Each submitted hash must exist, succeed, touch the STRK20 pool, and, because VOCAP deploys contracts, run through a VOCAP contract.

Use these three Router executions as the scoring proof:

1. Alice's first successful Router execution.
2. Alice's second successful Router execution using the returned note.
3. Bob's successful Router execution after private succession.

Do not use declarations, deployments, registrations, the initial deposit, or the private succession transfer as substitutes for these three application proof hashes. They are useful supporting evidence but do not individually prove the required repeated VOCAP contract path.

The root `strk20.json` is intentionally absent until real Mainnet values exist. Create it only after all three hashes are successful and verified. Follow the current schema from the upstream `starkience/strk20-hackathon` repository at submission time. Do not copy an old schema or insert placeholders.

For each of the three hashes, record:

- transaction hash;
- Mainnet block number;
- final execution status;
- finality status;
- STRK20 pool address touched;
- Router address touched;
- expected `PolicyExecuted` event;
- policy ID;
- target address and selector;
- target action count before and after;
- backend projection status;
- explorer link.

## Zero-cost backend activation

The Mainnet indexer uses `.github/workflows/vocap-mainnet-indexer.yml` and the protected GitHub environment `vocap-mainnet`.

Already configured as encrypted environment secrets:

- `STARKNET_RPC_URL`
- `VOCAP_DATABASE_URL`
- `VOCAP_MIGRATION_DATABASE_URL`

Keep these GitHub environment variables unset until the Router deployment is final and read back:

- `VOCAP_ROUTER_ADDRESS`
- `VOCAP_START_BLOCK`

Activation order:

1. Set `VOCAP_ROUTER_ADDRESS` to the verified Mainnet Router address.
2. Set `VOCAP_START_BLOCK` to the finalized Router deployment block, not the current chain head.
3. Manually run `VOCAP Mainnet indexer` in `preflight` mode.
4. Confirm the summary says the configuration is present and that no indexing step ran.
5. Manually run `migrate-and-sync` once.
6. Confirm the migration succeeds, the restricted runtime-role check succeeds, and the cursor starts at the configured deployment block.
7. Run `sync` manually a second time.
8. Confirm replay is idempotent and the cursor advances or remains correctly caught up.
9. Observe at least two scheduled runs.
10. Force or safely simulate one RPC failure and confirm the cursor does not advance incorrectly.
11. Confirm a later run catches up without duplicate executions.
12. Monitor Neon Free storage and compute usage.

This backend is a delayed projection service with no uptime SLA. GitHub schedules can be delayed or disabled after prolonged repository inactivity. Neon Free can scale to zero. The chain receipt remains authoritative when the projection is behind.

## Evidence bundle

Create a private operator evidence folder outside the repository while executing. Publish only the final non-secret subset required for review and scoring.

For every write, record:

```text
step name
UTC timestamp
release commit
network and chain ID
wallet public address and wallet type
transaction hash
block number
execution status
finality status
actual fee in STRK
expected state change
read-back state
explorer URL
operator decision: continue or stop
```

Also preserve:

- frozen artifact hash verification output;
- local test output;
- final sequential fee-estimation output;
- derived contract addresses and their derivation inputs;
- declared and deployed class-hash read-backs;
- Router constructor read-back;
- policy read-back;
- privacy pool dependency refresh;
- service compatibility proof;
- privacy registration receipts;
- note-discovery observations with private material removed;
- the three qualifying scoring receipts;
- target action-count changes;
- stale-note rejection evidence;
- backend cursor and execution rows;
- GitHub Actions run links;
- Neon runtime-role verification.

## Stop conditions

Stop immediately and do not submit the next transaction if any of these occurs:

- the wallet or RPC reports a chain other than `SN_MAIN`;
- an artifact or source hash differs from the freeze;
- the pool address, class hash, version, fee, or proof window differs unexpectedly;
- the prover or discovery service cannot be matched to the reviewed release family;
- a fee estimate exceeds the approved transaction or total limit;
- a deployment derives a different address than expected;
- a declaration, deployment, or policy receipt reverts or remains unresolved;
- class-hash, constructor, or policy read-back differs;
- the target calldata is non-empty for V1;
- the target selector differs from `premium_action`;
- a private proof is built from stale or unfinalized state;
- discovery returns an ambiguous or unexpected note set;
- the Router fails to restore the capability balance;
- a submitted transaction lacks the expected pool call, Router call, event, or state change;
- any private key, viewing key, credential, or connection string appears in output or version control.

Do not retry blindly. Save the receipt and state, diagnose the cause, refresh the estimate and chain state, then obtain a new operator approval before retrying.

## Completion checklist

VOCAP Mainnet work is complete only when every item below has authoritative evidence:

- [ ] Exact frozen Router rehearsal passed on Sepolia.
- [x] Sepolia faucet funding and public account deployment checkpoint recorded. This is testnet-only evidence and does not clear the exact frozen Router rehearsal.
- [x] Mainnet wallet public metadata and deployment state recorded.
- [x] Final salts and expected addresses frozen.
- [ ] Privacy service release compatibility verified.
- [ ] Fresh full-sequence fee estimate approved.
- [ ] Wallet funded within the approved limit.
- [ ] Router and target classes declared and verified.
- [ ] Router and target deployed and read back.
- [ ] Policy `1` created and read back.
- [ ] Alice and Bob privacy registrations finalized.
- [ ] Initial private capability deposit finalized.
- [ ] Alice first Router execution finalized.
- [ ] Alice second Router execution finalized.
- [ ] Alice-to-Bob succession finalized.
- [ ] Alice stale-note reuse rejected without a harmful broadcast.
- [ ] Bob Router execution finalized.
- [ ] At least three qualifying Router transaction hashes verified.
- [ ] Root `strk20.json` created from the current upstream schema with real values only.
- [ ] Mainnet indexer activated from the verified Router deployment block.
- [ ] Migration, restricted runtime role, cursor, retry, and idempotence verified.
- [ ] Public documentation updated with truthful Mainnet evidence.
- [ ] Final secret scan and release diff passed.

## Canonical repository references

- `docs/MAINNET_READINESS.md`, tracked readiness gates.
- `docs/MAINNET_RELEASE_FREEZE.md`, frozen artifacts and source hashes.
- `docs/STARKNET_MAINNET_DEPENDENCIES.md`, selected SDK and live pool snapshot.
- `docs/WALLET_FLOW.md`, user-approved private write boundary.
- `docs/SEPOLIA_RUNBOOK.md`, historical live flow evidence.
- `docs/ZERO_COST_MAINNET_BACKEND.md`, Neon Free and GitHub Actions operations.
- `docs/STRK20_HACKATHON_RULES.md`, scoring and publication gates.
- `.github/workflows/vocap-mainnet-indexer.yml`, inactive-until-configured Mainnet indexer.
- `.env.example`, public configuration shape and secret warning.

When records conflict, stop and resolve them against the current source, frozen artifact hashes, live chain state, and current upstream Starknet repositories. Never choose the value that merely makes deployment easier.
