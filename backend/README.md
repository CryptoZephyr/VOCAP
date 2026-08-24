# VOCAP backend

The backend is a deterministic Starknet projection service. Onchain state and confirmed receipts remain authoritative. PostgreSQL stores the replayable operational projection and sync cursor. The backend does not hold private keys, viewing keys, or capability spend authority.

## Local commands

From WSL, use the pinned Node runtime and Corepack pnpm:

```bash
export PATH="$HOME/.local/bin:$HOME/.asdf/shims:$PATH"
cd /path/to/VOCAP/backend
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

The one-shot indexer requires a PostgreSQL `DATABASE_URL`, a Starknet RPC URL, and a deployed router address. It reads accepted block receipts and advances the cursor only after the complete block projection is committed.

Set `STARKNET_RPC_URL` to the verified Sepolia RPC selected for the deployment, then run the indexer with `STARKNET_NETWORK=sepolia`, `VOCAP_ROUTER_ADDRESS`, and `DATABASE_URL` set. No mainnet operation is implied by this command.

## State model

- `vocap_sync_cursors` records the next block to process.
- `vocap_policies` projects `PolicyCreated` and `PolicyEnabled` events.
- `vocap_executions` records `PolicyExecuted` events with a unique event key.
- `vocap_transactions` records lifecycle transitions separately from execution events.

Replay is idempotent by `(network, router, transaction hash, event index)`. Cursor advancement and block projection happen in one PostgreSQL transaction. Pending transactions are never treated as successful until a confirmed receipt is observed.
