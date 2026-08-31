import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { describeEntryEnvironment } from "../src/boot.ts";
import { pathFromLocation, ROUTES } from "../src/routes.ts";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function sourceOf(relativePath: string): string {
  return readFileSync(join(frontendRoot, relativePath), "utf8");
}

describe("shipped frontend entry", () => {
  it("is ESM without unguarded require or module.exports", async () => {
    const main = sourceOf("src/main.tsx");
    const boot = sourceOf("src/boot.ts");
    expect(main).not.toMatch(/\brequire\s*\(/);
    expect(main).not.toMatch(/\bmodule\.exports\b/);
    expect(boot).not.toMatch(/\brequire\s*\(/);
    expect(boot).not.toMatch(/\bmodule\.exports\b/);

    const previousWindow = globalThis.window;
    (globalThis as { window?: { location: { protocol: string; pathname: string } } }).window = {
      location: { protocol: "http:", pathname: "/" },
    };

    try {
      const mod = await import("../src/boot.ts");
      expect(mod.describeEntryEnvironment("http:").ok).toBe(true);
      expect(typeof describeEntryEnvironment).toBe("function");
    } finally {
      if (previousWindow) {
        globalThis.window = previousWindow;
      } else {
        Reflect.deleteProperty(globalThis, "window");
      }
    }
  });

  it("recognizes every public application route", () => {
    expect(pathFromLocation("/docs")).toBe(ROUTES.docs);
    expect(pathFromLocation("/playground")).toBe(ROUTES.playground);
    expect(pathFromLocation("/terms")).toBe(ROUTES.terms);
    expect(pathFromLocation("/privacy")).toBe(ROUTES.privacy);
  });
});
