# Starknet Mainnet dependency record

This record identifies the exact upstream Starknet Privacy source selected for VOCAP Mainnet review. It contains public dependency information only and does not authorize a transaction.

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
- The RC2 proof preflight against the live Mainnet services returned `9` proof facts and `18` `apply_actions` words. It made no Mainnet write.

## Live Mainnet read-only snapshot

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

The protocol responses match RC2, but neither service exposes an immutable image digest or revision. Health, key, and protocol responses do not prove the deployed image tag. The service operator must provide the prover and discovery image digests or immutable revisions before the privacy release-family gate can close.

The latest direct service refresh also returned HTTP `200` from both health endpoints and both OHTTP-key endpoints, with prover spec `0.10.3-rc.2`. The response headers still exposed no immutable digest or revision.

The latest Mainnet public preflight at block `14,040,539`, with an independent head at `14,040,540`, confirmed `SN_MAIN`, the deployed Braavos account, nonce `0x2`, balance `126.443768493564389985 STRK`, pool version `2.0`, a `6 STRK` pool fee, and a `450`-block proof window. Both frozen classes and addresses remain undeclared and undeployed, and pool allowance remains `0`. Validation-on declaration quotes were `29.170380944846550924 STRK` for the Router and `4.947096903101895852 STRK` for the target. The reviewed `43 STRK` approval quote was `0.153978902159965713 STRK`, making the current measurable floor `77.271456750108412489 STRK` after adding the known `42 STRK` protocol component and `1 STRK` capability principal. The full sequential Mainnet requirement remains unavailable until the dependent writes exist.

The configured wallet still has zero pool allowance, and the frozen Router and target classes and addresses are undeclared and undeployed. The proof fee estimate therefore fails closed at the allowance dependency. The declaration-only and approval-only values in the handoff are moving read-only quotes, not the complete sequential Mainnet requirement.

## Release boundary

Before any Mainnet proof or deployment write:

1. Obtain immutable prover and discovery revisions or image digests and match them to the RC2 row above.
2. Refresh the wallet, pool, class, address, nonce, and chain-state reads.
3. Generate a fresh sequential fee estimate after each dependency exists. An exact full-sequence quote cannot be produced while the required approval, declarations, deployments, policy, and private calls remain unwritten.
4. Obtain explicit funding and deployment approval from the operator.

No Mainnet transaction has been submitted during this RC2 switch.
