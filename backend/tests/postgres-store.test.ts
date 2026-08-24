import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { PostgresStore } from "../src/postgres-store.js";

const databaseUrl = process.env.VOCAP_TEST_DATABASE_URL;
const postgresDescribe = databaseUrl ? describe : describe.skip;

postgresDescribe("PostgreSQL projection", () => {
  it("commits a block and ignores an exact replay", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const store = new PostgresStore(pool);
    const routerAddress = "0xpostgres-test";

    await store.migrate();
    await pool.query("DELETE FROM vocap_executions WHERE router_address = $1", [routerAddress]);
    await pool.query("DELETE FROM vocap_policies WHERE router_address = $1", [routerAddress]);
    await pool.query("DELETE FROM vocap_sync_cursors WHERE network = $1", ["devnet"]);

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

    const cursor = await store.getCursor("devnet", 0);
    const executionCount = await pool.query(
      "SELECT count(*)::int AS count FROM vocap_executions WHERE router_address = $1",
      [routerAddress],
    );
    const policy = await pool.query(
      "SELECT enabled FROM vocap_policies WHERE router_address = $1 AND policy_id = $2",
      [routerAddress, "1"],
    );

    expect(cursor).toBe(101);
    expect(executionCount.rows[0]?.count).toBe(1);
    expect(policy.rows[0]?.enabled).toBe(false);

    await pool.query("DELETE FROM vocap_executions WHERE router_address = $1", [routerAddress]);
    await pool.query("DELETE FROM vocap_policies WHERE router_address = $1", [routerAddress]);
    await pool.query("DELETE FROM vocap_sync_cursors WHERE network = $1", ["devnet"]);
    await store.close();
  });
});
