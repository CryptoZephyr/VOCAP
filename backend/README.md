# VOCAP backend

The backend is a deterministic Starknet projection service. Onchain state and confirmed receipts remain authoritative. PostgreSQL stores the replayable operational projection and sync cursor. The backend does not hold private keys, viewing keys, or capability spend authority.

## Render deployment

The repository root contains `render.yaml` for a zero-dollar Sepolia web service and a free PostgreSQL database. The web service exists only because Render does not offer free background workers. It exposes `/healthz` and runs the indexer in the same process. The Blueprint keeps automatic deploys disabled until the first supervised deployment has passed. Render prompts for `STARKNET_RPC_URL` during Blueprint creation. Use an HTTPS Sepolia RPC URL and do not add wallet or signer secrets because the indexer is read-only.

The free service build installs the frozen lockfile with dependency lifecycle scripts disabled and compiles TypeScript. The backend does not need the `esbuild` postinstall used by the test runner, and disabling dependency scripts keeps Render's pnpm supply-chain policy from blocking the production build. Its start command runs the idempotent database migration before each start, since Render's pre-deploy command is unavailable on free services. Render supplies the database's private connection string as `DATABASE_URL`, checks `/healthz`, and starts the indexer only after the migration succeeds. The process handles Render's shutdown signal and closes PostgreSQL cleanly within the free-tier platform limit.

Free Render web services sleep after 15 minutes without inbound traffic, and free Render PostgreSQL expires after 30 days without backups. Keep this profile for Sepolia development and supervised demonstrations. An external free uptime monitor can request `/healthz` every few minutes if continuous testnet polling is needed. This profile is not Mainnet infrastructure.

The Sepolia service starts at block `13993404`, the verified L1-finalized router deployment block. Its configured router is `0x0356db61e1d7eaa0417312307c128017e6cc1a85a5a8a649d5c23fee17312b2b`. This lets a fresh database rebuild the full router projection instead of beginning after the policy and earlier execution events.

The initial Blueprint connection uses the Render database owner for both migration and runtime access. Before a production Mainnet deployment, create a narrower runtime database role, grant only the application privileges described below, and replace the service's `DATABASE_URL` after the migration. Keep the migration-capable URL available only to a separate migration job.

Validate the deployment file without creating resources:

```bash
render blueprints validate render.yaml
```

Creating the Blueprint provisions free Render resources, subject to Render's free-tier limits and the 30-day PostgreSQL lifetime. Review those limits in the Render dashboard before approving the first sync.

### Zero-dollar Mainnet observer

`render.mainnet.yaml` is a separate read-only Mainnet profile. It uses the same free web-service shape, but requires the RPC URL, router address, and verified router deployment start block to be entered manually. Those values stay unset in Git so an incorrect or unfinished Mainnet deployment cannot be indexed by accident. The profile polls every 60 seconds to reduce free-tier outbound traffic and keeps automatic deploys disabled.

Use this profile only after the Mainnet router and policy state have been deployed and read back. Keep a free uptime monitor requesting `/healthz` at least every 10 minutes if you need the service awake. The service remains an observer. It never needs a wallet, private key, viewing key, or transaction signer.

Validate the Mainnet profile without creating resources:

```bash
render blueprints validate render.mainnet.yaml
```

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

## User wallet write path

The backend is part of an active application flow even though it does not hold a signer. A browser wallet and the official privacy SDK build and submit the private `apply_actions` transaction. The backend helper `submitVocapPrivateResult` validates the SDK result, forwards the proof facts and proof to the connected wallet, and returns the wallet-submitted transaction hash. The wallet remains responsible for user approval, signing, and broadcasting.

Use [docs/WALLET_FLOW.md](../docs/WALLET_FLOW.md) for the complete V1 RETURN sequence. Do not add a private key, viewing key, or capability signer to Render. The Render service can index the resulting receipt and expose operational status without taking custody of the capability.
