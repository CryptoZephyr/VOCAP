import assert from "node:assert/strict";
import test from "node:test";
import {
  VocapApiError,
  buildVocapPrivacyInvokeCalldata,
  createVocapClient,
  createVocapInvokeCallBuilder,
  prepareVocapWalletCall,
  submitVocapPrivateResult,
} from "../dist/index.js";

const baseInput = {
  routerAddress: "0x123",
  policyId: 1n,
  tokenAddress: "0x456",
  amount: 7n,
  targetAddress: "0xabc",
  selector: "0xdef",
};

const proofResult = {
  call: {
    contractAddress: "0x1234",
    entrypoint: "apply_actions",
    calldata: ["0x1", "0x2"],
  },
  proof: {
    data: "base64-proof",
    proofFacts: ["0x10", "0x11"],
  },
};

test("serializes the Router span as decimal calldata", () => {
  assert.deepEqual(
    buildVocapPrivacyInvokeCalldata({
      ...baseInput,
      noteId: "0x789",
      targetCalldata: [11n, 12n],
    }).map((value) => BigInt(value)),
    [1n, 0x456n, 7n, 0x789n, 0xabcn, 0xdefn, 2n, 11n, 12n],
  );
});

test("blocks a mismatched SDK context", () => {
  const build = createVocapInvokeCallBuilder(baseInput);
  assert.throws(
    () =>
      build({
        withdrawals: [{ recipient: "0x999", token: "0x456", amount: 7n }],
        openNotes: [{ noteId: "0x789", token: "0x456" }],
      }),
    /VOCAP_WITHDRAWAL_RECIPIENT_MISMATCH/,
  );
});

test("keeps proof facts in wallet transaction details", async () => {
  const executeCalls = [];
  const submission = await submitVocapPrivateResult(
    {
      async execute(call, details) {
        executeCalls.push({ call, details });
        return { transaction_hash: "0xabc" };
      },
    },
    proofResult,
    { expectedPoolAddress: "0x1234", transactionDetails: { tip: 3n } },
  );
  assert.equal(submission.transactionHash, "0xabc");
  assert.deepEqual(executeCalls[0], {
    call: {
      contractAddress: "0x1234",
      entrypoint: "apply_actions",
      calldata: ["0x1", "0x2"],
    },
    details: { tip: 3n, proofFacts: ["0x10", "0x11"], proof: "base64-proof" },
  });
});

test("defaults a configured client submission to its pool", () => {
  const client = createVocapClient({
    network: "sepolia",
    ...baseInput,
    poolAddress: "0x1234",
  });
  assert.deepEqual(client.prepareWalletCall(proofResult).details, {
    proofFacts: ["0x10", "0x11"],
    proof: "base64-proof",
  });
  assert.throws(
    () => client.prepareWalletCall({ ...proofResult, call: { ...proofResult.call, contractAddress: "0x999" } }),
    /VOCAP_PRIVATE_FLOW_POOL_MISMATCH/,
  );
});

test("uses scoped public API requests without sending private data", async () => {
  const requests = [];
  const client = createVocapClient({
    network: "sepolia",
    ...baseInput,
    poolAddress: "0x1234",
    backendUrl: "https://indexer.example/",
    fetch: async (input, init) => {
      requests.push({ input, init });
      return {
        ok: true,
        status: 200,
        async json() {
          return { items: [], nextCursor: null };
        },
      };
    },
  });
  const page = await client.listExecutions({ limit: 10 });
  assert.deepEqual(page, { items: [], nextCursor: null });
  assert.match(requests[0].input, /^https:\/\/indexer\.example\/api\/v1\/executions\?/);
  assert.match(requests[0].input, /network=sepolia/);
  assert.match(requests[0].input, /routerAddress=0x123/);
  assert.match(requests[0].input, /limit=10/);
  assert.equal(requests[0].init, undefined);
});

test("surfaces API error codes", async () => {
  const client = createVocapClient({
    network: "sepolia",
    ...baseInput,
    poolAddress: "0x1234",
    backendUrl: "https://indexer.example",
    fetch: async () => ({
      ok: false,
      status: 503,
      async json() {
        return { error: "service_unavailable" };
      },
    }),
  });
  await assert.rejects(() => client.getPolicy(), (error) => {
    assert.ok(error instanceof VocapApiError);
    assert.equal(error.status, 503);
    assert.equal(error.code, "service_unavailable");
    return true;
  });
});

test("prepare helper rejects incomplete proofs", () => {
  assert.throws(
    () => prepareVocapWalletCall({ ...proofResult, proof: { data: "", proofFacts: ["0x1"] } }),
    /VOCAP_PRIVATE_FLOW_PROOF_REQUIRED/,
  );
});
