import { describe, expect, it } from "vitest";
import { describeEntryEnvironment } from "../src/boot.ts";
import { FILE_PROTOCOL_GUIDE } from "../src/copy.ts";

describe("frontend entry environment", () => {
  it("rejects file protocol with serve instructions", () => {
    const result = describeEntryEnvironment("file:");
    expect(result.ok).toBe(false);
    expect(result.message).toBe(FILE_PROTOCOL_GUIDE);
    expect(result.message).toContain("corepack pnpm dev");
  });

  it("accepts an HTTP origin", () => {
    expect(describeEntryEnvironment("http:").ok).toBe(true);
    expect(describeEntryEnvironment("https:").ok).toBe(true);
  });
});
