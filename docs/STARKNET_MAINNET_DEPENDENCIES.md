# Starknet Mainnet dependency record

This record identifies the exact upstream Starknet privacy source selected for VOCAP Mainnet review. It contains public dependency information only and does not authorize a transaction.

## Selected release

- Repository: `https://github.com/starkware-libs/starknet-privacy`
- Tag: `PRIVACY-0.14.3-RC.5`
- Commit: `66e3caae8c0201227a6719696d004e30d90aea65`
- SDK package version: `0.14.3-rc.5`
- Starknet.js dependency: `10.5.0`

The selected commit is the immutable official RC.5 tag. Do not build the Mainnet wallet flow from the later local checkout at commit `51652200561151499b03f90e3a05f03c91f5b349`. That checkout still labels its package RC.5 but contains unreleased version `2.1` changes, while the live Mainnet privacy pool reports version `2.0`.

The official RC.5 SDK build passed locally. Its external-invoke and compute-and-invoke suites passed `7` tests with coverage disabled. A separate non-broadcast proof-context rehearsal against the live Mainnet prover and discovery services also completed, returning `9` proof facts and the expected `apply_actions` call shape. This does not prove a submitted Mainnet transaction.

The upstream pool interface enforces phased client actions. `CreateOpenNote` is phase `5`, `Withdraw` is phase `6`, and `InvokeExternal` is phase `7`, with at most one external invocation. VOCAP's callback additionally requires exactly one withdrawal to the Router and exactly one open return note for the policy token before it builds Router calldata.

## Live Mainnet read-only snapshot

Recorded 2026-08-29 at Starknet Mainnet block `14,018,608`:

- Chain: `SN_MAIN`
- Privacy pool: `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`
- Pool class hash: `0x67dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d`
- Pool version: `2.0`
- Pool `apply_actions` fee: `6000000000000000000` fri, or `6 STRK`
- Proof validity window: `450` blocks
- Transaction prover health: HTTP 200
- Discovery service health: HTTP 200
- Discovery chain head at service check: block `14,018,643`, about `5` seconds of lag
- Transaction prover RPC spec: `0.10.3-rc.2`
- OHTTP key responses: `43` bytes from both services

The latest read-only refresh on 2026-08-29 reached common block `14,026,607` through Lava and Cartridge. It still matched `SN_MAIN`, pool version `2.0`, the `6 STRK` fee, and the `450`-block proof window. The configured wallet's pool allowance remained `0`, so the RC.5 proof preflight stopped before a fee quote that depends on approval. Both service health endpoints and both OHTTP-key endpoints returned HTTP `200`, with `43`-byte key responses. Discovery reported a live Mainnet head at block `14,026,635` with `5` seconds of lag. No immutable service revision or image digest was exposed.

The newest public preflight reached block `14,026,733` through Lava and `14,026,734` through Cartridge. The frozen Router and target remained undeployed, and a validation-on estimate for the reviewed `43 STRK` allowance approval returned `0.150653541579872337 STRK`. The declaration estimates moved with gas conditions, so the complete sequence still requires a fresh sequential quote immediately before any approved write.

The current upstream compatibility matrix names `PRIVACY-0.14.3-RC.2` for the transaction prover, discovery service, and SDK row. The selected local SDK remains the immutable `PRIVACY-0.14.3-RC.5` package. The public Mainnet prover reports RPC spec `0.10.3-rc.2`, but that RPC value is not an immutable container digest. The deployed prover and discovery image digests remain unverified. The RC.5 proof-context rehearsal is useful evidence that the live endpoints answered the selected protocol, but it does not establish the deployed image revision or clear the release-family gate.

## Release boundary

Before the first Mainnet proof, obtain the deployed prover and discovery revisions or image digests from the service operator and match them to an upstream tested row. If the operator cannot provide that evidence, treat the private Mainnet flow as unverified even when both health endpoints return HTTP 200.

Generate the final private-action fee estimate from the selected RC.5 SDK, the fresh wallet, the deployed VOCAP addresses, and a valid proof context. Historical transaction fees and health checks cannot replace that estimate.
