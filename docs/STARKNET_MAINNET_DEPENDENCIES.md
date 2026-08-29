# Starknet Mainnet dependency record

This record identifies the exact upstream Starknet Privacy source selected for VOCAP Mainnet and records public compatibility and deployment evidence. It contains no signing material.

## Selected release

- Repository: `https://github.com/starkware-libs/starknet-privacy`
- Tag: `PRIVACY-0.14.3-RC.2`
- Commit: `9bfeb8dd35565a2915a0617dff3f649bd5bb891a`
- SDK package version: `0.14.3-rc.2`
- SDK lockfile: upstream `sdk/package-lock.json`, npm lockfile version `3`
- SDK lockfile SHA-256: `A93E86BFB7F10231C6584C40B29D5EE4DE96E349EC57AE7F822615BEFC97891B`
- SDK runtime `starknet`: `10.0.0-beta.6`, as resolved by that lockfile
- VOCAP backend `starknet`: `10.5.0`, a separate backend dependency

The upstream Git reference resolves the RC2 tag to the commit above, and GitHub marks the release commit as verified. The active local checkout under `.tools/starknet-privacy` is detached at this exact commit. The reproducible client pin and package manifest hashes are recorded in [PRIVACY_RC2_PIN.md](PRIVACY_RC2_PIN.md).

No RC5 package, lockfile, checkout, or service selection is part of the active Mainnet path. Older RC5 runs in the handoff and Sepolia records are historical evidence only. The privacy SDK remains client-side and is not added to `backend/package.json`.

## Official compatibility row

The upstream matrix says that components in one row are tested together and must use matching revisions:

| Component | Required RC2 selection |
| --- | --- |
| Transaction prover | `ghcr.io/starkware-libs/starknet-privacy/transaction-prover:PRIVACY-0.14.3-RC.2` |
| Proof interceptor | `ghcr.io/starkware-libs/starknet-privacy/proof-interceptor:PRIVACY-0.14.3-RC.2` when screening is enabled |
| Discovery service | `ghcr.io/starkware-libs/starknet-privacy/discovery-service:PRIVACY-0.14.3-RC.2` |
| Pathfinder | `eqlabs/pathfinder:v0.22.7` with `PATHFINDER_STORAGE_STATE_TRIES=10000` |
| SDK | `PRIVACY-0.14.3-RC.2` |

Source: [official Starknet Privacy compatibility matrix](https://github.com/starkware-libs/starknet-privacy#compatibility-matrix).

## Immutable RC2 image references

The public GHCR manifests for the RC2 service tags resolved on 2026-08-29 to these immutable digests:

| Image | Expected manifest digest |
| --- | --- |
| `transaction-prover:PRIVACY-0.14.3-RC.2` | `sha256:a2f71d7139069fa566c4f44bdd66b79cac992c0cbc20ddf0af3a3558c6cabd64` |
| `proof-interceptor:PRIVACY-0.14.3-RC.2` | `sha256:985f11fb532e009fb6df442ac4dfa1033677c39fb4b9032c8d6df7590b478f1c` |
| `discovery-service:PRIVACY-0.14.3-RC.2` | `sha256:29c3be4422a0471039e87e3318173153c4e9484d6c185404390916fee7ce3bae` |

These are the comparison values for the deployed service images. The live HTTP endpoints expose no digest or immutable revision, so the service gate cannot be marked verified until the operator supplies the deployed references.

## RC2 verification

- Exact `npm ci --ignore-scripts --no-audit --no-fund` completed in the RC2 `sdk/` directory using the upstream lockfile.
- `npm run build` passed from the exact RC2 checkout.
- The fast SDK suite passed `252` tests across `26` files with coverage disabled.
- The full SDK command ran `28` files and passed all `259` tests. The exact upstream lockfile was used with native Scarb `2.17.0` to generate the `privacy_Privacy`, `privacy_MockAMM`, and `privacy_MockSwapExecutor` fixtures. The official `starknet-devnet` `v0.8.0-rc.3` launcher was used for the five devnet tests. This verifies the RC2 client and fixture path without a mixed SDK revision.
- The upstream `npm run lint` wrapper reports formatting differences across the pristine release checkout. No upstream source was reformatted or changed.
- The RC2 proof preflight against the live Mainnet services returned `9` proof facts and `18` `apply_actions` words. The approved Mainnet lifecycle then exercised that same RC2 proof path successfully across seven private-pool calls.

## Live Mainnet dependency and deployment snapshot

Recorded 2026-08-29 at the RC2 proof refresh:

- Chain: `SN_MAIN`
- Privacy pool: `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`
- Pool class hash: `0x67dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d`
- Pool version: `2.0`
- Pool `apply_actions` fee: `6000000000000000000` fri, or `6 STRK`
- Proof validity window: `450` blocks
- Prover health and OHTTP keys: HTTP `200`
- Discovery health and OHTTP keys: HTTP `200`
- Prover JSON-RPC spec: `0.10.3-rc.2`
- RC2 proof refresh: block `14,040,550`, proving block `14,040,540`, `316432` proof bytes

The protocol responses match RC2, but neither service exposes an immutable image digest or revision. Health, key, and protocol responses do not prove the deployed image tag. This provenance limitation remains open even though the live RC2 proof path passed.

The latest direct service refresh also returned HTTP `200` from both health endpoints and both OHTTP-key endpoints, with prover spec `0.10.3-rc.2`. The response headers still exposed no immutable digest or revision.

The approved Mainnet sequence declared and deployed the frozen Router and target, created policy `1`, approved `43 STRK` to the pool, and completed the seven-call private lifecycle. The Router is deployed at `0x6048ed36607367ea5ae050c745d47006214ecf66fdbf173d01eba96ec5d780a`, the target is deployed at `0x74637f577350898c64835c88216df3030050828c723c6987a3d97d6d4eb986b`, and the target action count advanced from `0` to `3`. The final public wallet read returned nonce `0x10`, balance `45.919283977923319621 STRK`, and zero remaining pool allowance after the approved sequence. Full transaction and fee evidence is in [MAINNET_HANDOFF.md](MAINNET_HANDOFF.md).

The configured wallet currently has zero pool allowance because the approved `43 STRK` allowance was consumed by the seven private-pool calls. Future private calls require a fresh allowance and a new fee check. The exact completed operator-wallet debit was `80.524484515641070364 STRK`, and the receipt network fees summed to `35.605562309795264188 STRK`.

The older declaration-only and allowance snapshots below are retained as historical pre-write quotes. They describe the state before the approved Mainnet writes and are not the current deployment state.

## Post-deployment boundary

For any future Mainnet proof or deployment write:

1. Obtain immutable prover and discovery revisions or image digests and match them to the RC2 row above, if the service operator exposes them.
2. Refresh the wallet, pool, class, address, nonce, and chain-state reads.
3. Generate a fresh sequential fee estimate for the new operation, including any new pool allowance and protocol fees.
4. Obtain explicit funding and operation approval from the operator.

The approved Mainnet transaction sequence is complete. No further write is implied by this dependency record.
