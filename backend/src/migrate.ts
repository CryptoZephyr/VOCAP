import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { PostgresStore } from "./postgres-store.js";

export async function runMigrations(databaseUrl: string): Promise<void> {
  if (databaseUrl.trim().length === 0) {
    throw new Error("DATABASE_URL is required for migrations");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await new PostgresStore(pool).migrate();
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for migrations");
  }
  await runMigrations(databaseUrl);
  process.stdout.write("VOCAP database migration complete\n");
}

const entrypoint = process.argv[1];
if (entrypoint && fileURLToPath(import.meta.url) === resolve(entrypoint)) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`VOCAP migration failed: ${message}\n`);
    process.exitCode = 1;
  });
}
