# VOCAP

VOCAP is a private programmable-capability protocol for Starknet.

The V1 contract and backend objective is a reusable `RETURN` flow:

```text
private STRK20 capability
-> VocapRouter
-> configured target action
-> same capability returned to a fresh private note
```

The repository is currently private and local. No public remote or deployment is configured.

## Current implementation gate

Contract and backend implementation starts only after the pinned Starknet and STRK20 toolchain is available and verified. The Windows environment requires WSL for Scarb and Starknet Foundry. The implementation must be proven locally and on Sepolia before any mainnet action.

V1 remains `RETURN` only. The frontend is intentionally out of scope until the contract, backend, indexing, and smoke flows are stable.

## Required verification

The completed repository will provide reproducible equivalents of:

```text
scarb build
snforge test
npm run typecheck
npm run test
npm run build
npm run smoke:local
npm run smoke:network
```

No private keys, viewing keys, wallet recovery secrets, RPC credentials, or deployer secrets belong in this repository.
