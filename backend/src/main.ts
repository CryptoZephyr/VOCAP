import { Pool } from "pg";
import { loadConfig } from "./config.js";
import { StarknetChainReader } from "./chain.js";
import { RouterIndexer } from "./indexer.js";
import { PostgresStore } from "./postgres-store.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.databaseUrl });
  const store = new PostgresStore(pool);
  const reader = new StarknetChainReader(config.rpcUrl);
  const indexer = new RouterIndexer(reader, store, {
    network: config.network,
    routerAddress: config.routerAddress,
    startBlock: config.startBlock,
    chunkSize: config.syncChunkSize,
  });

  const once = process.argv.includes("--once");
  try {
    await store.migrate();
    do {
      const result = await indexer.syncOnce();
      process.stdout.write(`${JSON.stringify(result)}\n`);
      if (!once) {
        await new Promise((resolve) => setTimeout(resolve, config.pollMs));
      }
    } while (!once);
  } finally {
    await store.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`VOCAP backend stopped: ${message}\n`);
  process.exitCode = 1;
});
