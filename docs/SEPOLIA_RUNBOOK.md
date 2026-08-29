# Sepolia gate

VOCAP stays Sepolia-first until the complete reusable sequence is proven with a real STRK20 privacy pool.

## What is already verified locally

- The RETURN-only router passes the local Cairo security suite and Cairo auditor preflight.
- The backend projection and transaction-state model pass their local tests and build.
- The active pinned upstream privacy SDK, `@starkware-libs/starknet-privacy-sdk@0.14.3-rc.2`, builds locally from the deterministic RC2 lockfile. The older RC5 rehearsal records below are historical only.
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

The router and target constructor state, policy state, class hashes, and deployment receipts were read back from Sepolia. The live flow evidence below covers the remaining STRK20 private withdrawal, router invocation, return-note, succession, and backend indexing gates.

## Live Sepolia evidence

Historical record, recorded 2026-08-28 from accepted receipts using the then-pinned SDK `0.14.3-rc.5`, OHTTP-enabled proving and discovery, and the configured Sepolia RPC. This record predates the active RC2 switch and is not a current Mainnet dependency. No private key or viewing key is stored here.

### RETURN and reuse

- Registration: `0x287fcd0e816700efa47963ef38a09aab1a46938dee5ae7a1bf8b260bb2786e3`, `ACCEPTED_ON_L1`, block `14142561`.
- Deposit: `0x4c31dc098a794afdeb5a821d6c84376d39efdee61b7003a8d6f69fe4e2adc37`, `ACCEPTED_ON_L1`, block `14142581`.
- First router invocation: `0x3a079da763772ecb3f6bb95220dca64e87414b70ca4d3ac1a91aa7c4608c592`, `ACCEPTED_ON_L1`, block `14142600`.
- Second invocation using the returned note: `0x7799dd35f6e80c337dbed04fc110ad956b60701229d3752ea844518a42aa583`, `ACCEPTED_ON_L1`, block `14142619`.
- Discovery returned one open note after the first invocation, and the approved target action count increased by `2`.

### Alice to Bob succession

- A fresh disposable OpenZeppelin account was used for Alice and a second fresh account for Bob. Their public addresses were `0x3bd8800bcb9b2628b11d1533a4deb3bca34bb1d597b1af72a6e2bab6473eeb6` and `0x7723c51482f9b848103f16e06ed90cc02412a717945dbc872269beb70d8eb71`.
- Alice registration: `0x696584be54b42711bd6a051ed0382815f834334a908dd43a3b5def6cf3a4840`, `SUCCEEDED/ACCEPTED_ON_L2`, block `14150404`.
- Bob registration relayed by the configured account: `0x2838a864a1a18f392627155c5f380262c7f1eb8be7437458cfb4bbe4d33d082`, `SUCCEEDED/ACCEPTED_ON_L2`, block `14150423`.
- Alice deposit: `0x2e574da3cb85b1bdeceeb5f5249458ab765808073e9de5a42d40d0b069ee62e`, `SUCCEEDED/ACCEPTED_ON_L2`, block `14150447`.
- Alice to Bob private transfer: `0x2dcc3a79f18e4b7e40bea049559a85f9d581e6e3cb71e5ecec7640b04a2fa3e`, `SUCCEEDED/ACCEPTED_ON_L2`, block `14150468`. Alice's original note disappeared from discovery and Bob's fresh note was discovered.
- Reusing Alice's original note was rejected by the prover before submission.
- Bob withdrawal: `0x487234e325bbe3b6f46dbc7015363c2e39608b08bb27f7957e86ad094602406`, `SUCCEEDED/ACCEPTED_ON_L2`, block `14150491`. Bob's STRK balance increased by exactly `1000000000000000000` wei, and the Bob note disappeared from discovery.

The succession receipts were accepted on L2 when this record was written. The earlier RETURN and reuse receipts reached L1 finality. L1 batch finality for the newer succession receipts is a separate settlement-status check.

### Backend projection

- The indexer processed blocks `14142560` through `14143059` with `2` router executions.
- PostgreSQL stored exactly `2` accepted execution rows for the normalized router address and a cursor of `14143060`.
- Reapplying the two live execution blocks left the execution count at `2` and the cursor unchanged, proving the production idempotence path.

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
