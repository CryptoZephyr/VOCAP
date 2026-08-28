import { afterEach, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { closeHealthServer, startHealthServer, type HealthState } from "../src/health.js";

const servers: Server[] = [];

afterEach(async () => {
  while (servers.length > 0) {
    const server = servers.pop();
    if (server) await closeHealthServer(server);
  }
});

describe("health endpoint", () => {
  it("reports startup and ready states without exposing the error", async () => {
    const state: HealthState = { ready: false, lastSyncAt: null, lastError: "private error" };
    const server = await startHealthServer(state, 0);
    servers.push(server);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("health server did not bind");

    const starting = await fetch(`http://127.0.0.1:${address.port}/healthz`);
    expect(starting.status).toBe(503);
    expect(await starting.json()).toEqual({
      status: "starting",
      lastSyncAt: null,
      lastError: "sync_failed",
    });

    state.ready = true;
    state.lastSyncAt = "2026-08-28T00:00:00.000Z";
    state.lastError = null;
    const ready = await fetch(`http://127.0.0.1:${address.port}/healthz`);
    expect(ready.status).toBe(200);
    expect(await ready.json()).toEqual({
      status: "ok",
      lastSyncAt: "2026-08-28T00:00:00.000Z",
      lastError: null,
    });
  });
});
