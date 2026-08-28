# User wallet flow

VOCAP's V1 write path is user-controlled. The browser wallet owns the Starknet account, the privacy viewing key, and the private note registry. The Render service remains a public projection and status service. It never receives a private key or viewing key.

## Sequence

```text
wallet connects to the selected Starknet network
    -> privacy SDK discovers the user's notes
    -> privacy SDK builds the RETURN action
    -> user approves the proof invocation in the wallet
    -> proving service returns the proof
    -> user approves the final apply_actions transaction
    -> privacy pool calls VocapRouter.privacy_invoke
    -> target action runs
    -> the same capability is deposited into a fresh private note
    -> backend indexes the confirmed receipt and router event
```

The wallet process keeps the viewing key and private registry. Rebuild discovery at the start of a new session instead of persisting private registry data in the backend.

## Public and private inputs

The wallet app may receive these public values from deployment configuration:

- Starknet RPC URL and network.
- STRK20 privacy pool address.
- VOCAP Router address.
- Capability token address and policy amount.
- Approved target address and selector.
- Compatible proving and discovery service URLs.

The wallet app must keep these values local to the wallet process:

- Account signer or browser wallet connection.
- Privacy viewing key.
- Private note witnesses and registry.
- Proof invocation signature material.

## Building the RETURN action

The pinned privacy SDK is the component that discovers the note, creates the private withdrawal, creates the fresh open return note, and asks the user wallet to sign the proof invocation. The VOCAP callback binds the SDK context to the configured router policy:

```typescript
import { Open, createPrivateTransfers } from "@starkware-libs/starknet-privacy-sdk";
import { submitVocapPrivateResult } from "../backend/src/wallet-flow.js";
import { createVocapInvokeCallBuilder } from "../backend/src/private-flow.js";

const transfers = createPrivateTransfers({
  account: walletAccount,
  viewingKeyProvider: { getViewingKey: () => walletViewingKey },
  provingProvider: {
    url: provingServiceUrl,
    chainId: "SN_SEPOLIA",
    nodeUrl: rpcUrl,
    ohttp: true,
  },
  discoveryProvider: { url: discoveryServiceUrl },
  poolContractAddress: poolAddress,
});

const result = await transfers
  .build({
    autoDiscover: { notes: "refresh" },
    autoSelectNotes: "naive",
  })
  .with(capabilityToken, (token) =>
    token
      .withdraw({ recipient: routerAddress, amount: policyAmount })
      .transfer({ recipient: walletAccount.address, amount: Open }),
  )
  .invoke(
    createVocapInvokeCallBuilder({
      routerAddress,
      policyId,
      tokenAddress: capabilityToken,
      amount: policyAmount,
      targetAddress,
      selector: targetSelector,
      targetCalldata: [],
    }),
  )
  .execute();

const submission = await submitVocapPrivateResult(walletAccount, result, {
  expectedPoolAddress: poolAddress,
});

console.log(submission.transactionHash);
```

The final helper call invokes the connected wallet's normal transaction approval. It forwards the SDK proof as Starknet transaction details and returns the submitted transaction hash. It does not relay through a server account.

The example uses Sepolia values as placeholders. Replace them only with values read back from the selected deployment and a privacy-service release compatible with the pinned SDK. Keep V1 target calldata empty until the target restriction is explicitly expanded and reviewed.

## Backend handoff

After the wallet returns a transaction hash, the app can show a pending state and wait for the backend projection to catch up. The chain receipt remains authoritative. A pending transaction must not be shown as successful until the confirmed receipt and expected `PolicyExecuted` event are observed.

The backend's `RouterIndexer` records the router event and updates a transaction lifecycle row when that hash was registered by the caller. The wallet-facing app should register the hash through its application integration before relying on the lifecycle projection. The backend does not infer private note ownership from the event.

## Compatibility gate

The browser wallet, privacy SDK, proving service, discovery service, and pool must be tested as one release family. A connected Starknet wallet by itself does not prove that the private flow can generate or submit a valid `apply_actions` transaction.
