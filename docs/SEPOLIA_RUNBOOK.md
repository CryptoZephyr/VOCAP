# Sepolia gate

VOCAP stays Sepolia-first until the complete reusable sequence is proven with a real STRK20 privacy pool.

## What is already verified locally

- The RETURN-only router passes the local Cairo security suite and Cairo auditor preflight.
- The backend projection and transaction-state model pass their local tests and build.
- The pinned upstream privacy SDK, `@starkware-libs/starknet-privacy-sdk@0.14.3-rc.5`, builds locally.
- The upstream SDK invoke integration test passes four tests with coverage disabled.
- `backend/src/private-flow.ts` serializes the router call and checks the SDK withdrawal and return-note context.

These checks do not prove a Sepolia transaction.

## Required compatible deployment

All privacy components must come from a compatible release family. Record the exact version or class hash for each item before deploying VOCAP:

1. STRK20 privacy pool address.
2. Discovery or indexer service URL.
3. Proving service URL.
4. Capability token address and decimals.
5. A Sepolia RPC URL for the same network.
6. The router and target addresses after deployment.

The current upstream SDK source exports `createPrivateTransfers`, `ProvingServiceProofProvider`, and `IndexerDiscoveryProvider`. The SDK requires a wallet signer and viewing key. Those values stay in the wallet process and are never placed in the backend, repository, or agent prompt.

## Private RETURN flow

The first real flow must be assembled through the official SDK in this order:

```text
Alice private capability note
-> SDK withdraws the exact amount to VocapRouter
-> SDK creates one fresh open return note
-> pool invokes VocapRouter.privacy_invoke
-> router checks pool caller, policy, token, amount, target, selector, and balance
-> router invokes the configured target
-> router checks the capability balance was restored
-> router approves the privacy pool for the same amount
-> pool deposits the returned capability into the fresh open note
```

The backend helper builds the router calldata in this order:

```text
policy_id, token, amount, note_id, target, selector, target_calldata_length, target_calldata...
```

For the first low-risk target, use a no-argument selector and an empty target calldata span. Do not use a general-purpose arbitrary target or selector.

## Required smoke evidence

The Sepolia gate is complete only when the following are accepted and indexed:

1. Alice uses the capability once.
2. The same capability is returned to a fresh private note.
3. Alice uses the returned capability again.
4. Alice privately transfers the capability to Bob.
5. Alice's old note cannot be reused.
6. Bob uses the capability successfully.
7. The backend catches up from its persisted cursor and records the accepted executions idempotently.

Capture transaction hashes, final receipts, router events, pool open-note deposits, and the backend projection. Do not treat a submitted or pending transaction as success.

## Non-secret configuration gate

`loadSepoliaPrivateFlowConfig` validates these public values before a flow starts:

```text
STARKNET_RPC_URL
STARKNET_NETWORK=sepolia
STRK20_POOL_ADDRESS
VOCAP_ROUTER_ADDRESS
CAPABILITY_TOKEN_ADDRESS
VOCAP_TARGET_ADDRESS
PROVING_SERVICE_URL
DISCOVERY_SERVICE_URL
STARKNET_ACCOUNT_ADDRESS, optional public address
```

The account signer and viewing key are intentionally not part of this configuration. Use a disposable, user-controlled Sepolia account or an approved wallet or signer boundary.

## Two valid ways to clear the external gate

Use the official Starknet privacy team's compatible Sepolia or integration-Sepolia services when they are available and their version matches the pinned SDK and pool.

If those services are unavailable, run a controlled compatible stack yourself. That means the privacy pool, discovery service, and proving service must be built and configured as one tested release family. A router deployment by itself cannot clear the privacy gate.

Mainnet deployment and funding must wait until this runbook has a complete Sepolia evidence bundle. A public repository and the hackathon registry application may proceed earlier after the release files pass secret, build, and diff checks. They must not imply Sepolia or mainnet success.

## References

- [Starknet privacy source](https://github.com/starkware-libs/starknet-privacy)
- [STRK20 hackathon rules](https://github.com/starkience/strk20-hackathon)
