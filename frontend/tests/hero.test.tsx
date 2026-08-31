import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LOGO_PUBLIC_PATH } from "../src/brand.ts";
import { FORBIDDEN_PRIMARY_CTAS, getHeroCtas, HEADLINE, SUPPORTING } from "../src/copy.ts";
import { Hero } from "../src/Hero.tsx";
import { playgroundHref } from "../src/routes.ts";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function renderHero(): string {
  return renderToStaticMarkup(<Hero />);
}

describe("atmospheric hero", () => {
  it("renders Frontend.md headline, supporting copy, and protocol steps from the shipped component", () => {
    const html = renderHero();

    expect(html).toContain(HEADLINE);
    expect(html).toContain("Your asset is your permission.");
    expect(html).toContain(SUPPORTING);
    expect(html).toContain(
      "Use privately held STRK20 assets to authorize Starknet actions without revealing who currently holds the right.",
    );
    expect(html).toContain("CAPABILITY");
    expect(html).toContain("SUPPLY");
    expect(html).toContain("EXECUTE");
    expect(html).toContain("RETURN");
    expect(html).toContain("A real STRK20 asset represents the permission.");
    expect(html).toContain("The holder supplies it privately through STRK20.");
    expect(html).toContain("VOCAP permits only the configured target action.");
    expect(html).toContain("The same asset returns to a fresh private note.");
    expect(html).toContain('href="#mechanism-detail"');
    expect(html).toContain('href="#privacy"');
    expect(html).toContain('href="#mainnet"');
    expect(html).toContain('href="#integrate"');
    expect(html).not.toContain("holder hidden");
    expect(html).not.toContain("action public");
  });

  it("exposes the required CTAs and routes Capability Trace to /playground", () => {
    const html = renderHero();
    const ctas = getHeroCtas();
    const capabilityTrace = ctas.find((cta) => cta.id === "capability-trace");

    expect(ctas.map((cta) => cta.label)).toEqual([
      "See how it works",
      "View Mainnet proof",
      "Integrating VOCAP? Read the docs",
      "Capability Trace",
    ]);
    expect(capabilityTrace?.href).toBe(playgroundHref());
    expect(capabilityTrace?.href).toBe("/playground");

    for (const cta of ctas) {
      expect(html).toContain(cta.label);
      expect(html).toContain(`href="${cta.href}"`);
    }
  });

  it("does not use forbidden primary CTAs or yoga-retreat product art", () => {
    const html = renderHero();
    for (const phrase of FORBIDDEN_PRIMARY_CTAS) {
      expect(html).not.toContain(phrase);
    }
    expect(html.toLowerCase()).not.toContain("launch app");
    expect(html.toLowerCase()).not.toContain("open app");
    expect(html.toLowerCase()).not.toContain("enter dapp");
    expect(html.toLowerCase()).not.toContain("start now");
    expect(html.toLowerCase()).not.toContain("yoga");
    expect(html.toLowerCase()).not.toContain("world retreat");
    expect(html).not.toContain("VOCAP_inspiration");
  });

  it("ships the approved VOCAP logo as-is and references it from the hero", () => {
    const html = renderHero();
    const shippedPath = join(frontendRoot, "public", "vocap-logo.png");
    const approvedPath = join(frontendRoot, "..", "VOCAP_logo.png");

    expect(existsSync(shippedPath)).toBe(true);
    expect(html).toContain(`src="${LOGO_PUBLIC_PATH}"`);
    expect(LOGO_PUBLIC_PATH).toBe("/vocap-logo.png");

    if (!existsSync(approvedPath)) {
      throw new Error("approved VOCAP_logo.png missing; cannot verify byte identity");
    }

    expect(sha256(readFileSync(shippedPath))).toBe(sha256(readFileSync(approvedPath)));
  });
});
