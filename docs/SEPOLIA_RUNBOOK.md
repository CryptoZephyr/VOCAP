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

## Current Sepolia deployment record

Recorded 2026-08-24 from accepted Sepolia receipts. No private key or viewing key is stored here.

- Network: `SN_SEPOLIA`
- Deployer account: `0x05561fc8b083db47a4e2c537b609febe82563d2e3a77a0589c9be559e61ad369`
- Deployer class hash: `0x3957f9f5a1cbfe918cedc2015c85200ca51a5f7506ecb6de98a5207b759bf8a`
- Privacy pool: `0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91`
- Router class hash: `0x05523f610ef12898912e00188bec88cf7e8080506d93360d17a20cb1c775bd78`
  - declaration: `0x070c2c918267a2f77acc223897527cb1712da55bda85c1c567f15fcb641e4936`
  - deployment: `0x02ec4ff4f016df419bb9a3a85aee8ee56b44c17a23ca85b74ec5e5b3befafa2c`
  - address: `0x0356db61e1d7eaa0417312307c128017e6cc1a85a5a8a649d5c23fee17312b2b`
- Approved target class hash: `0x07d637107437a81f099e7dd761fbd812059882fca8e62031a5979d6932f80a2f`
  - declaration: `0x074ece253e0fcc293c5072d645b83a6be68c3a7317840f3b4e0313ccf9e2abbd`
  - deployment: `0x03494a32d0f9bf285d3e89551cabafd148f612954d747ff2b57a64aef81458e7`
  - address: `0x0499995a27c1e1ad2d53ecf81649e99f8421e50383f144816809058496034c66`
- Policy `1`: Sepolia STRK `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d`, amount `1000000000000000000`, target `premium_action`, RETURN mode, enabled.
  - creation: `0x039b4782c6c0be8c596590ec036b43108c34244c4b54cc35e657575b0621079b`

The router and target constructor state, policy state, class hashes, and transaction receipts were read back from Sepolia. This record proves deployment and policy configuration. It does not prove the STRK20 private withdrawal, router invocation, private return note, succession, or backend indexing sequence.

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
