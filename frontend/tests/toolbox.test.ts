import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath: string): string {
  return readFileSync(join(frontendRoot, relativePath), "utf8");
}

describe("ui-toolbox role split", () => {
  it("installs shadcn-owned components on Base UI behavior only", () => {
    const manifest = JSON.parse(read("package.json")) as {
      dependencies: Record<string, string>;
    };
    const deps = { ...manifest.dependencies };
    expect(deps["@base-ui/react"]).toBeTruthy();
    expect(deps["@radix-ui/themes"]).toBeUndefined();
    expect(Object.keys(deps).some((name) => name.includes("react-bits"))).toBe(false);
    expect(Object.keys(deps).some((name) => name.includes("21st"))).toBe(false);
  });

  it("wires the shipped hero to toolbox button, separator, and ClickSpark", () => {
    const hero = read("src/Hero.tsx");
    expect(hero).toContain("@/components/ui/button.ts");
    expect(hero).toContain("@/components/ui/separator.ts");
    expect(hero).toContain("./motion/ClickSpark.ts");
    expect(read("src/components/ui/button.tsx")).toContain("@base-ui/react/button");
    expect(read("src/motion/ClickSpark.tsx")).toContain("sparkColor");
  });
});
