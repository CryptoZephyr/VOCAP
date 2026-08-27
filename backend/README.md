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

Run the migration job before starting the indexer. The migration job owns schema DDL. The long-running indexer only checks that the schema is ready, so its `DATABASE_URL` can use a narrower runtime role:

```bash
DATABASE_URL=postgresql://migration-role:... corepack pnpm migrate
DATABASE_URL=postgresql://runtime-role:... corepack pnpm start
```

Provision the migration role as the database or schema owner, then grant the runtime role `USAGE` on the schema and `SELECT`, `INSERT`, and `UPDATE` on the `vocap_*` tables. The runtime role does not need `CREATE`, `ALTER`, or `DROP`. Keep both connection URLs in the deployment secret manager and pass the migration URL only to the migration job.

Run the PostgreSQL integration suite separately with a disposable database:

```bash
VOCAP_TEST_DATABASE_URL=postgresql://... VOCAP_REQUIRE_POSTGRES=1 corepack pnpm test:postgres
```

The one-shot indexer requires a migrated PostgreSQL schema, a `DATABASE_URL`, an explicit Starknet network, a matching RPC URL, and a deployed router address. It checks schema readiness, verifies the RPC chain identity, reads only successful finalized receipts, and advances the cursor only after the complete block projection is committed.

Set `STARKNET_RPC_URL` to the verified Sepolia RPC selected for the deployment, then run the indexer with `STARKNET_NETWORK=sepolia`, `VOCAP_ROUTER_ADDRESS`, and `DATABASE_URL` set. No mainnet operation is implied by this command.

## State model

- `vocap_sync_cursors` records the next block to process for each network and router, including the last canonical block hash.
- `vocap_indexed_blocks` records block continuity data so a reorganization fails closed instead of silently rewriting history.
- `vocap_policies` projects `PolicyCreated` and `PolicyEnabled` events.
- `vocap_executions` records `PolicyExecuted` events with a unique event key.
- `vocap_transactions` records lifecycle transitions separately from execution events.

Replay is idempotent by `(network, router, transaction hash, event index)`. Cursor advancement and block projection happen in one PostgreSQL transaction. Pending transactions are never treated as successful until a confirmed receipt is observed. The production process handles SIGINT and SIGTERM for graceful shutdown, while the chain reader retries transient RPC failures with bounded exponential backoff.
