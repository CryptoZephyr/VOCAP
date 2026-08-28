import { createServer, type Server } from "node:http";

export interface HealthState {
  ready: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
}

export function startHealthServer(state: HealthState, port: number): Promise<Server> {
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    if (request.method === "GET" && requestUrl.pathname === "/healthz") {
      response.writeHead(state.ready ? 200 : 503, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          status: state.ready ? "ok" : "starting",
          lastSyncAt: state.lastSyncAt,
          lastError: state.lastError ? "sync_failed" : null,
        }),
      );
      return;
    }

    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "not_found" }));
  });

  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.removeListener("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      resolve(server);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen({ host: "0.0.0.0", port });
  });
}

export function closeHealthServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
