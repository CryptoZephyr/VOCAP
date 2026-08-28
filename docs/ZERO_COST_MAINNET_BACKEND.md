# Zero-cost Mainnet backend

VOCAP can keep its PostgreSQL projection at zero monthly platform cost by combining a Neon Free PostgreSQL project with the scheduled GitHub Actions indexer in `.github/workflows/vocap-mainnet-indexer.yml`.

The wallet remains the transaction boundary. Users approve private transactions in their own wallet process. The scheduled backend holds no signer, private key, viewing key, or wallet recovery material. It only reads finalized Starknet receipts and writes the resulting projection to PostgreSQL.

## Why this replaces the free Render Mainnet profile

Render's free web service sleeps and its free PostgreSQL database expires. Neon Free currently has no time limit or credit-card requirement, provides 0.5 GB of PostgreSQL storage, and scales compute to zero when idle. Standard GitHub-hosted Actions are free for this public repository.

This arrangement has no uptime SLA. GitHub may delay or drop scheduled jobs during high load, and public-repository schedules are disabled after 60 days without repository activity. The persisted cursor makes a later run catch up safely. A manual workflow dispatch is available for recovery.

## One-time setup

1. Create a Neon Free project named `vocap-mainnet`.
2. Keep the Neon owner connection string as the migration credential.
3. Create a separate runtime role and grant it `USAGE` on the schema plus `SELECT`, `INSERT`, and `UPDATE` on the `vocap_*` tables. Revoke `CREATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, and `TRIGGER`. Do not grant it schema ownership or DDL privileges.
4. Create a GitHub environment named `vocap-mainnet` and require deployment approval if the repository settings support it.
5. Add these environment secrets:
   - `STARKNET_RPC_URL`, an HTTPS Mainnet RPC endpoint.
   - `VOCAP_MIGRATION_DATABASE_URL`, the Neon owner connection string.
   - `VOCAP_DATABASE_URL`, the direct Neon connection string for the restricted runtime role.
6. Add these environment variables only after Mainnet deployment read-back succeeds:
   - `VOCAP_ROUTER_ADDRESS`
   - `VOCAP_START_BLOCK`, the finalized Router deployment block.
7. Run the workflow manually once with `run_migration` enabled.
8. Run it manually again with migration disabled and verify that the cursor advances from the Router deployment block.

Run the migration first with the Neon owner URL. Then use the Neon SQL editor as the owner to apply the runtime grants below. Replace the database or role name if your Neon project uses different names:

```sql
CREATE ROLE vocap_runtime
  LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT
  PASSWORD '<generated-secret>';
GRANT CONNECT ON DATABASE vocap_mainnet TO vocap_runtime;
GRANT USAGE ON SCHEMA public TO vocap_runtime;
REVOKE CREATE ON SCHEMA public FROM vocap_runtime;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO vocap_runtime;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM vocap_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO vocap_runtime;
```

Use the owner connection string for `VOCAP_MIGRATION_DATABASE_URL` and the restricted role's direct connection string for `VOCAP_DATABASE_URL`. The scheduled job opens only one small Node PostgreSQL pool, so a direct Neon endpoint is sufficient. The workflow runs `verify:runtime-role` before every sync and stops if the credential is over-privileged or missing required access.

Neon's CLI-created roles inherit the `neon_superuser` role and are too broad for the runtime boundary. Create `vocap_runtime` with SQL as a login role that has `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, and `NOINHERIT`, then apply the grants above. The deployed runtime verifier rejects Neon owner or `neon_superuser` credentials.

Never add connection strings, RPC credentials, wallet keys, or viewing keys to Git, workflow variables, logs, or issue comments. Connection strings belong in encrypted GitHub environment secrets.

## Runtime behavior

The workflow starts at minutes 7, 17, 27, 37, 47, and 57 of each hour. Each run processes up to twelve chunks of fifty finalized blocks and exits early after reaching the chain head. Runs share a concurrency group, so two indexers cannot update the same cursor concurrently.

The scheduled job is intentionally inactive until all four required runtime values exist. A manual run fails clearly when configuration is incomplete. Migration is manual-only and uses its separate credential.

## Verification

After setup, verify all of the following before calling the backend operational:

- the migration job completes with the migration credential;
- the runtime credential can index blocks but cannot create or alter tables;
- two consecutive scheduled runs advance or retain the same valid cursor without duplicate executions;
- a forced failed RPC run leaves the cursor unchanged and a later run catches up;
- the GitHub workflow history shows successful scheduled runs;
- the Neon usage dashboard remains within the Free plan limits.

This profile is suitable for an early Mainnet pilot that accepts delayed indexing. It is not an always-on service and carries no provider SLA.
