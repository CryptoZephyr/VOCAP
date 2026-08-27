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
  const abortController = new AbortController();
  const stop = () => abortController.abort();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    await store.assertSchemaReady();
    await reader.verifyNetwork(config.network);
    let failureCount = 0;
    do {
      if (abortController.signal.aborted) break;
      try {
        const result = await indexer.syncOnce();
        failureCount = 0;
        process.stdout.write(`${JSON.stringify(result)}\n`);
      } catch (error) {
        if (once || isFatalIndexerError(error)) throw error;
        failureCount += 1;
        const retryMs = Math.min(30_000, 1_000 * 2 ** Math.min(failureCount - 1, 5));
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`VOCAP sync failed, retrying in ${retryMs}ms: ${message}\n`);
        await waitForPoll(retryMs, abortController.signal);
        continue;
      }
      if (!once) {
        await waitForPoll(config.pollMs, abortController.signal);
      }
    } while (!once && !abortController.signal.aborted);
  } finally {
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
    await store.close();
  }
}

function isFatalIndexerError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /chain reorganization detected|missing parent hash|unexpected block|RPC returned block|invalid .* response/.test(
    message,
  );
}

function waitForPoll(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`VOCAP backend stopped: ${message}\n`);
  process.exitCode = 1;
});
