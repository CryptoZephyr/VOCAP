# @vocap/client

`@vocap/client` is the browser-safe integration boundary for VOCAP. It keeps
private note discovery and proof building in the official Starknet Privacy SDK,
then validates the resulting `apply_actions` call before handing it to a
connected Starknet wallet.

The package contains public addresses and policy values only. It never accepts
a private key, viewing key, note witness, or proof-signing secret.

## Install

After the package is published to npm:

```bash
npm install @vocap/client@0.1.0 starknet@10.5.0
```

The official `PRIVACY-0.14.3-RC.2` SDK is currently distributed from the
Starknet Privacy release, not the public npm registry. Keep that dependency
pinned to the verified RC2 release in the integrating application. The VOCAP
client accepts its result structurally, so it does not create a second SDK or
silently select another revision.

For local development from this repository:

```bash
cd packages/vocap-client
npm install
npm test
```

## Browser quickstart

Create one client from the reviewed deployment values. Pass the connected
wallet account and the `callAndProof` result returned by the pinned RC2 SDK.

```ts
import { createVocapClient } from "@vocap/client";

const vocap = createVocapClient({
  network: "sepolia",
  routerAddress: "0x0356...",
  poolAddress: "0x0254...",
  policyId: 1n,
  tokenAddress: "0x04718f...",
  amount: 1_000_000_000_000_000_000n,
  targetAddress: "0x0499...",
  selector: "0x...",
  targetCalldata: [],
  backendUrl: "https://your-indexer.example",
});

// `sdkResult` comes from PRIVACY-0.14.3-RC.2 after the client-side
// discovery, proof, and invoke builder steps.
const submission = await vocap.submitPrivateResult(walletAccount, sdkResult);
console.log(submission.transactionHash);

// Optional. Register only the public transaction hash with the projection API.
await vocap.registerRouterExecution(submission.transactionHash);
```

The default submission check requires `sdkResult.call.contractAddress` to
match the configured pool and requires the entrypoint to be `apply_actions`.
Pass `transactionDetails` when the wallet needs an explicit nonce, fee, or
resource bounds. The wallet still shows its normal approval prompt and signs
the transaction.

## Build the SDK callback directly

Apps that already own the privacy SDK builder can use the lower-level callback:

```ts
const buildRouterCall = vocap.createInvokeCallBuilder();

const routerCall = buildRouterCall({
  withdrawals: [{ recipient: vocap.routerAddress, token: tokenAddress, amount: 1n }],
  openNotes: [{ noteId, token: tokenAddress }],
});
```

The callback rejects multiple withdrawals, multiple open notes, wrong token,
wrong amount, wrong Router recipient, and a zero return-note id. The Router
calldata uses the reviewed V1 order:

```text
policy_id, token, amount, open_note_id, target, selector,
target_calldata_length, target_calldata...
```

## Public projection API

When `backendUrl` is set, the client provides typed helpers for the public
projection routes:

- `getPolicy()` reads the configured policy.
- `listExecutions({ limit, cursor })` reads finalized public executions.
- `getTransaction(txHash)` reads a registered lifecycle row.
- `registerRouterExecution(txHash)` registers a public Router transaction hash.

The backend remains read-only with respect to private capability material. A
projection API response is delayed operational state. The chain receipt remains
authoritative for transaction success.

## Package boundary

This package does not discover notes, hold a viewing key, run the prover, or
submit a transaction with a private signer. Use the pinned official RC2 SDK in
the browser for private state and use a connected Starknet wallet for approval.
The package can be published independently because it has no dependency on
VOCAP's PostgreSQL indexer or server runtime.
