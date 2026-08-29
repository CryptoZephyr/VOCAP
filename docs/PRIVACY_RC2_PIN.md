# Starknet Privacy RC2 pin

Last verified: 2026-08-29

This is the deterministic client-side dependency record for the VOCAP wallet flow. VOCAP has no browser client package in this repository, so the SDK is kept in the ignored operator checkout under `.tools/starknet-privacy`. The backend lockfile remains backend-only and must not be used to select the privacy SDK.

## Immutable upstream release

- Repository: `https://github.com/starkware-libs/starknet-privacy`
- Release: `PRIVACY-0.14.3-RC.2`
- Commit: `9bfeb8dd35565a2915a0617dff3f649bd5bb891a`
- SDK package: `@starkware-libs/starknet-privacy-sdk@0.14.3-rc.2`
- Release page: `https://github.com/starkware-libs/starknet-privacy/releases/tag/PRIVACY-0.14.3-RC.2`

The official tag resolves to the commit above through the upstream Git reference. GitHub marks the release commit as verified. The active checkout is detached at this exact commit.

## Lockfile pin

The upstream `sdk/package-lock.json` is the lockfile for the SDK package:

- Lockfile format: npm lockfile version `3`
- `sdk/package.json` SHA-256: `D4EF4647C538DACBB59912E4981FF8E06BAA4DC503062240B10E827B4ABC4D59`
- `sdk/package-lock.json` SHA-256: `A93E86BFB7F10231C6584C40B29D5EE4DE96E349EC57AE7F822615BEFC97891B`
- Deterministic install: `npm ci --ignore-scripts --no-audit --no-fund`

The lockfile resolves the SDK runtime dependencies to `starknet@10.0.0-beta.6`, `ohttp-ts@0.3.0`, `starknet-devnet@0.7.2`, `zod@3.25.76`, and `@starknet-io/types-js@0.10.2`. VOCAP's backend continues to use its separately pinned `starknet@10.5.0` dependency. That difference is intentional because the backend does not import or bundle the privacy SDK.

## Active-path rule

No RC.5 package, lockfile, checkout, or service selection is part of the active Mainnet wallet path. Older RC.5 runs in the release notes are historical evidence only. Do not copy their dependency tree into the RC2 checkout, and do not add the privacy SDK to `backend/package.json`.

The official compatibility row remains a release-family gate. The transaction prover, proof interceptor when enabled, discovery service, and SDK must all use the matching RC2 revision. Service health or protocol responses alone do not prove the deployed image revision.

