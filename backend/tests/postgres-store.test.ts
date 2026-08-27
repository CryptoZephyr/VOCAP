import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { PostgresStore } from "../src/postgres-store.js";

const databaseUrl = process.env.VOCAP_TEST_DATABASE_URL;
if (!databaseUrl && process.env.VOCAP_REQUIRE_POSTGRES === "1") {
  throw new Error("VOCAP_TEST_DATABASE_URL is required for the PostgreSQL integration suite");
}
const postgresDescribe = databaseUrl ? describe : describe.skip;

postgresDescribe("PostgreSQL projection", () => {
  it("commits a block and ignores an exact replay", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const store = new PostgresStore(pool);
    const routerAddress = "0xpostgres-test";
    const otherRouterAddress = "0xpostgres-other";

    await store.migrate();
    await pool.query("DELETE FROM vocap_executions WHERE router_address = $1", [routerAddress]);
    await pool.query("DELETE FROM vocap_policies WHERE router_address = $1", [routerAddress]);
    await pool.query("DELETE FROM vocap_indexed_blocks WHERE router_address IN ($1, $2)", [routerAddress, otherRouterAddress]);
    await pool.query("DELETE FROM vocap_transactions WHERE network = $1 AND tx_hash = $2", ["devnet", "0xlifecycle"]);
    await pool.query("DELETE FROM vocap_sync_cursors WHERE network = $1 AND router_address IN ($2, $3)", ["devnet", routerAddress, otherRouterAddress]);

    const block = {
      network: "devnet" as const,
      routerAddress,
      blockNumber: 100,
      blockHash: "0x100",
      policies: [
        {
          network: "devnet" as const,
          routerAddress,
          policyId: "1",
          tokenAddress: "0xabc",
          amount: "42",
          targetAddress: "0xdef",
          selector: "0x1234",
          enabled: true,
          mode: "RETURN" as const,
          blockNumber: 100,
          txHash: "0xcreate",
        },
      ],
      policyEnabled: [
        {
          network: "devnet" as const,
          routerAddress,
          policyId: "1",
          enabled: false,
          blockNumber: 100,
          txHash: "0xdisable",
        },
      ],
      executions: [
        {
          eventKey: "devnet:0xpostgres-test:0xexecute:0",
          network: "devnet" as const,
          routerAddress,
          txHash: "0xexecute",
          eventIndex: 0,
          blockNumber: 100,
          blockHash: "0x100",
          policyId: "1",
          targetAddress: "0xdef",
          selector: "0x1234",
          tokenAddress: "0xabc",
          amount: "42",
          noteId: "0xbeef",
          status: "accepted" as const,
        },
      ],
    };

    await store.applyBlock(block);
    await store.applyBlock(block);

    const cursor = await store.getCursor("devnet", routerAddress, 0);
    const executionCount = await pool.query(
      "SELECT count(*)::int AS count FROM vocap_executions WHERE router_address = $1",
      [routerAddress],
    );
    const policy = await pool.query(
      "SELECT enabled FROM vocap_policies WHERE router_address = $1 AND policy_id = $2",
      [routerAddress, "1"],
    );

    expect(cursor).toBe(101);
    expect(await store.getCursor("devnet", otherRouterAddress, 0)).toBe(0);
    expect(executionCount.rows[0]?.count).toBe(1);
    expect(policy.rows[0]?.enabled).toBe(false);

    await store.registerTransaction("devnet", "0xlifecycle", "router_execution");
    await store.observeReceipt("devnet", "0xlifecycle", "accepted");
    const lifecycle = await pool.query(
      "SELECT status FROM vocap_transactions WHERE network = $1 AND tx_hash = $2",
      ["devnet", "0xlifecycle"],
    );
    expect(lifecycle.rows[0]?.status).toBe("accepted");

    await expect(
      store.applyBlock({
        network: "devnet",
        routerAddress,
        blockNumber: 101,
        blockHash: "0x101",
        parentHash: "0xwrong",
        policies: [],
        policyEnabled: [],
        executions: [],
      }),
    ).rejects.toThrow("chain reorganization detected");

    await pool.query("DELETE FROM vocap_executions WHERE router_address = $1", [routerAddress]);
    await pool.query("DELETE FROM vocap_policies WHERE router_address = $1", [routerAddress]);
    await pool.query("DELETE FROM vocap_indexed_blocks WHERE router_address IN ($1, $2)", [routerAddress, otherRouterAddress]);
    await pool.query("DELETE FROM vocap_transactions WHERE network = $1 AND tx_hash = $2", ["devnet", "0xlifecycle"]);
    await pool.query("DELETE FROM vocap_sync_cursors WHERE network = $1 AND router_address IN ($2, $3)", ["devnet", routerAddress, otherRouterAddress]);
    await store.close();
  });
});
