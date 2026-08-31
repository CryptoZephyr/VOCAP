import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CapabilityTracePage } from "../src/CapabilityTracePage.tsx";
import { MAINNET_EVIDENCE, MAINNET_EXECUTIONS } from "../src/protocol/mainnet-evidence.ts";

describe("Capability Trace", () => {
  it("renders the Mainnet lifecycle and all recorded receipts", () => {
    const html = renderToStaticMarkup(<CapabilityTracePage />);

    expect(html).toContain("Capability Trace");
    expect(html).toContain("STRK20");
    expect(html).toContain("VOCAP Router");
    expect(html).toContain("Policy #1");
    expect(html).toContain("premium_action()");
    expect(html).toContain("RETURN");
    expect(html).toContain(MAINNET_EVIDENCE.routerAddress);
    expect(html).toContain(MAINNET_EVIDENCE.targetAddress);
    expect(html).toContain(MAINNET_EVIDENCE.poolAddress);
    expect(html).toContain(MAINNET_EVIDENCE.tokenAddress);

    for (const execution of MAINNET_EXECUTIONS) {
      expect(html).toContain(execution.transactionHash);
      expect(html).toContain(execution.blockNumber.toLocaleString("en-US"));
      expect(html).toContain(`${execution.actualFeeStrk} STRK`);
      expect(html).toContain(`https://starkscan.co/tx/${execution.transactionHash}`);
    }
  });

  it("keeps the public trace read-only", () => {
    const html = renderToStaticMarkup(<CapabilityTracePage />).toLowerCase();

    expect(html).not.toContain("connect wallet");
    expect(html).not.toContain("viewing key");
    expect(html).not.toContain("try a capability");
    expect(html).not.toContain("transfer capability");
    expect(html).toContain("read-only evidence");
  });
});
