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

Run the PostgreSQL integration suite separately with a disposable database:

```bash
VOCAP_TEST_DATABASE_URL=postgresql://... VOCAP_REQUIRE_POSTGRES=1 corepack pnpm test:postgres
```

The one-shot indexer requires a PostgreSQL `DATABASE_URL`, an explicit Starknet network, a matching RPC URL, and a deployed router address. It verifies the RPC chain identity, reads only successful finalized receipts, and advances the cursor only after the complete block projection is committed.

Set `STARKNET_RPC_URL` to the verified Sepolia RPC selected for the deployment, then run the indexer with `STARKNET_NETWORK=sepolia`, `VOCAP_ROUTER_ADDRESS`, and `DATABASE_URL` set. No mainnet operation is implied by this command.

## State model

- `vocap_sync_cursors` records the next block to process for each network and router, including the last canonical block hash.
- `vocap_indexed_blocks` records block continuity data so a reorganization fails closed instead of silently rewriting history.
- `vocap_policies` projects `PolicyCreated` and `PolicyEnabled` events.
- `vocap_executions` records `PolicyExecuted` events with a unique event key.
- `vocap_transactions` records lifecycle transitions separately from execution events.

Replay is idempotent by `(network, router, transaction hash, event index)`. Cursor advancement and block projection happen in one PostgreSQL transaction. Pending transactions are never treated as successful until a confirmed receipt is observed. The production process handles SIGINT and SIGTERM for graceful shutdown, while the chain reader retries transient RPC failures with bounded exponential backoff.
