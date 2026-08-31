import { CallData, num } from "starknet";
import type {
  AccountInterface,
  BigNumberish,
  Call,
  CallDetails,
  InvocationsDetails,
} from "starknet";

export type { BigNumberish } from "starknet";

export type VocapNetwork = "sepolia" | "mainnet" | "devnet";

export interface VocapOpenNoteContext {
  noteId: BigNumberish;
  token: BigNumberish;
}

export interface VocapWithdrawalContext {
  recipient: BigNumberish;
  token: BigNumberish;
  amount: BigNumberish;
}

export interface VocapInvokeContext {
  openNotes: readonly VocapOpenNoteContext[];
  withdrawals: readonly VocapWithdrawalContext[];
}

export interface VocapPrivacyInvokeInput {
  routerAddress: BigNumberish;
  policyId: BigNumberish;
  tokenAddress: BigNumberish;
  amount: bigint;
  noteId: BigNumberish;
  targetAddress: BigNumberish;
  selector: BigNumberish;
  targetCalldata?: readonly BigNumberish[];
}

export interface VocapPrivacyCall {
  contractAddress: string;
  entrypoint: string;
  calldata?: readonly BigNumberish[];
}

export interface VocapCallAndProof {
  call: VocapPrivacyCall;
  proof: {
    data: string;
    proofFacts: readonly BigNumberish[];
  };
}

export interface VocapWalletSubmissionOptions {
  /** Refuse to submit a result intended for a different privacy pool. */
  expectedPoolAddress?: BigNumberish;
  /** Fee, nonce, resource-bound, or paymaster settings supplied by the wallet. */
  transactionDetails?: InvocationsDetails;
}

export interface VocapWalletSubmission {
  transactionHash: string;
  call: Call;
}

export interface VocapFetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type VocapFetch = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<VocapFetchResponse>;

export interface VocapPolicyProjection {
  network: VocapNetwork;
  routerAddress: string;
  policyId: string;
  tokenAddress: string;
  amount: string;
  targetAddress: string;
  selector: string;
  enabled: boolean;
  mode: "RETURN";
  blockNumber: number;
  txHash: string;
}

export interface VocapExecutionProjection {
  eventKey: string;
  network: VocapNetwork;
  routerAddress: string;
  txHash: string;
  eventIndex: number;
  blockNumber: number;
  blockHash: string;
  policyId: string;
  targetAddress: string;
  selector: string;
  tokenAddress: string;
  amount: string;
  status: "accepted";
}

export interface VocapExecutionPage {
  items: VocapExecutionProjection[];
  nextCursor: string | null;
}

export type VocapTransactionKind =
  | "policy_create"
  | "policy_enable"
  | "router_execution"
  | "capability_transfer"
  | "unknown";

export type VocapTransactionStatus = "pending" | "accepted" | "rejected" | "reverted";

export interface VocapTransactionProjection {
  network: VocapNetwork;
  txHash: string;
  kind: VocapTransactionKind;
  status: VocapTransactionStatus;
  submittedAt: string;
  confirmedAt: string | null;
}

export interface VocapClientConfig {
  network: VocapNetwork;
  routerAddress: BigNumberish;
  poolAddress: BigNumberish;
  policyId: BigNumberish;
  tokenAddress: BigNumberish;
  amount: bigint;
  targetAddress: BigNumberish;
  selector: BigNumberish;
  targetCalldata?: readonly BigNumberish[];
  /** Optional public projection API base URL. A missing URL disables API helpers. */
  backendUrl?: string | null;
  /** Inject a fetch implementation for tests, SSR, or a custom transport. */
  fetch?: VocapFetch;
}

export interface VocapExecutionQuery {
  policyId?: BigNumberish;
  limit?: number;
  cursor?: string;
}

export interface VocapClient {
  readonly network: VocapNetwork;
  readonly routerAddress: string;
  readonly poolAddress: string;
  readonly policyId: string;
  readonly backendUrl: string | null;
  buildPrivacyInvokeCall(noteId: BigNumberish): CallDetails;
  createInvokeCallBuilder(): (context: VocapInvokeContext) => CallDetails;
  prepareWalletCall(
    result: VocapCallAndProof,
    options?: VocapWalletSubmissionOptions,
  ): { call: Call; details: InvocationsDetails };
  submitPrivateResult(
    account: Pick<AccountInterface, "execute">,
    result: VocapCallAndProof,
    options?: VocapWalletSubmissionOptions,
  ): Promise<VocapWalletSubmission>;
  getPolicy(): Promise<VocapPolicyProjection>;
  listExecutions(query?: VocapExecutionQuery): Promise<VocapExecutionPage>;
  getTransaction(txHash: BigNumberish): Promise<VocapTransactionProjection>;
  registerRouterExecution(txHash: BigNumberish): Promise<VocapTransactionProjection>;
}

export class VocapApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(`VOCAP API request failed (${status}): ${code}`);
    this.name = "VocapApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Build the application calldata forwarded by the STRK20 privacy pool.
 *
 * The final span is encoded as [length, ...elements]. The privacy SDK compiles
 * this array as raw calldata, so the span is serialized here instead of being
 * passed as a nested JavaScript array.
 */
export function buildVocapPrivacyInvokeCalldata(
  input: VocapPrivacyInvokeInput,
): string[] {
  validateInvokeInput(input);
  const targetCalldata = [...(input.targetCalldata ?? [])];
  for (const value of targetCalldata) toBigInt(value);
  return CallData.compile([
    input.policyId,
    input.tokenAddress,
    input.amount,
    input.noteId,
    input.targetAddress,
    input.selector,
    targetCalldata.length,
    ...targetCalldata,
  ]);
}

export function buildVocapPrivacyInvokeCall(
  input: VocapPrivacyInvokeInput,
): CallDetails {
  validateInvokeInput(input);
  return {
    contractAddress: num.toHex(input.routerAddress),
    calldata: buildVocapPrivacyInvokeCalldata(input),
  };
}

/**
 * Create the callback passed to the official privacy SDK's .invoke() builder.
 * It refuses to build a call unless the private withdrawal and open return
 * note both match the configured capability policy.
 */
export function createVocapInvokeCallBuilder(
  input: Omit<VocapPrivacyInvokeInput, "noteId">,
): (context: VocapInvokeContext) => CallDetails {
  validateInvokeInput({ ...input, noteId: 1n });

  return ({ openNotes, withdrawals }) => {
    if (withdrawals.length !== 1) {
      throw new Error("VOCAP_PRIVATE_FLOW_REQUIRES_ONE_WITHDRAWAL");
    }
    if (openNotes.length !== 1) {
      throw new Error("VOCAP_PRIVATE_FLOW_REQUIRES_ONE_OPEN_NOTE");
    }

    const withdrawal = withdrawals[0];
    const openNote = openNotes[0];
    if (withdrawal === undefined || openNote === undefined) {
      throw new Error("VOCAP_PRIVATE_FLOW_CONTEXT_INCOMPLETE");
    }

    if (toBigInt(withdrawal.recipient) !== toBigInt(input.routerAddress)) {
      throw new Error("VOCAP_WITHDRAWAL_RECIPIENT_MISMATCH");
    }
    if (toBigInt(withdrawal.token) !== toBigInt(input.tokenAddress)) {
      throw new Error("VOCAP_WITHDRAWAL_TOKEN_MISMATCH");
    }
    if (toBigInt(withdrawal.amount) !== input.amount) {
      throw new Error("VOCAP_WITHDRAWAL_AMOUNT_MISMATCH");
    }
    if (toBigInt(openNote.token) !== toBigInt(input.tokenAddress)) {
      throw new Error("VOCAP_OPEN_NOTE_TOKEN_MISMATCH");
    }
    if (toBigInt(openNote.noteId) === 0n) {
      throw new Error("VOCAP_OPEN_NOTE_ID_MISMATCH");
    }

    return buildVocapPrivacyInvokeCall({
      ...input,
      noteId: openNote.noteId,
    });
  };
}

/**
 * Validate and normalize the proven privacy-pool call before handing it to a
 * wallet. The final transaction is still signed and broadcast by the wallet.
 */
export function prepareVocapWalletCall(
  result: VocapCallAndProof,
  options: VocapWalletSubmissionOptions = {},
): { call: Call; details: InvocationsDetails } {
  if (!result || typeof result !== "object" || !result.call || typeof result.call !== "object") {
    throw new Error("VOCAP_PRIVATE_FLOW_RESULT_REQUIRED");
  }
  if (result.call.entrypoint !== "apply_actions") {
    throw new Error("VOCAP_PRIVATE_FLOW_EXPECTS_APPLY_ACTIONS");
  }

  const poolAddress = toBigInt(result.call.contractAddress);
  if (poolAddress === 0n) {
    throw new Error("VOCAP_PRIVATE_FLOW_POOL_REQUIRED");
  }
  if (
    options.expectedPoolAddress !== undefined &&
    poolAddress !== toBigInt(options.expectedPoolAddress)
  ) {
    throw new Error("VOCAP_PRIVATE_FLOW_POOL_MISMATCH");
  }
  if (!result.proof || typeof result.proof.data !== "string" || result.proof.data.length === 0) {
    throw new Error("VOCAP_PRIVATE_FLOW_PROOF_REQUIRED");
  }
  if (!Array.isArray(result.proof.proofFacts) || result.proof.proofFacts.length === 0) {
    throw new Error("VOCAP_PRIVATE_FLOW_PROOF_FACTS_REQUIRED");
  }
  for (const fact of result.proof.proofFacts) toBigInt(fact);
  if (result.call.calldata !== undefined && !Array.isArray(result.call.calldata)) {
    throw new Error("VOCAP_PRIVATE_FLOW_CALLDATA_INVALID");
  }

  const call: Call = {
    contractAddress: result.call.contractAddress,
    entrypoint: result.call.entrypoint,
    ...(result.call.calldata === undefined ? {} : { calldata: [...result.call.calldata] }),
  };
  const details: InvocationsDetails = {
    ...(options.transactionDetails ?? {}),
    proofFacts: [...result.proof.proofFacts],
    proof: result.proof.data,
  };
  return { call, details };
}

/**
 * Submit a proven private action through a connected Starknet wallet.
 *
 * `WalletAccount` and `Account` both satisfy this interface. The method invokes
 * the wallet's normal approval prompt. No private key, viewing key, or proof
 * signing material is accepted by this helper.
 */
export async function submitVocapPrivateResult(
  account: Pick<AccountInterface, "execute">,
  result: VocapCallAndProof,
  options: VocapWalletSubmissionOptions = {},
): Promise<VocapWalletSubmission> {
  const prepared = prepareVocapWalletCall(result, options);
  const response = await account.execute(prepared.call, prepared.details);
  if (!response || typeof response.transaction_hash !== "string" || response.transaction_hash.length === 0) {
    throw new Error("VOCAP_PRIVATE_FLOW_TRANSACTION_HASH_MISSING");
  }
  return {
    transactionHash: response.transaction_hash,
    call: prepared.call,
  };
}

/**
 * Create a configured client for one reviewed deployment. The client contains
 * public addresses and policy values only. It never accepts a private key or
 * viewing key, and it defaults wallet submissions to the configured pool.
 */
export function createVocapClient(config: VocapClientConfig): VocapClient {
  const normalized = normalizeClientConfig(config);
  const invokeInput = {
    routerAddress: normalized.routerAddress,
    policyId: normalized.policyId,
    tokenAddress: normalized.tokenAddress,
    amount: normalized.amount,
    targetAddress: normalized.targetAddress,
    selector: normalized.selector,
    ...(normalized.targetCalldata === undefined
      ? {}
      : { targetCalldata: normalized.targetCalldata }),
  } satisfies Omit<VocapPrivacyInvokeInput, "noteId">;
  const fetcher = config.fetch ?? (typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : undefined);
  const backendUrl = normalizeBackendUrl(config.backendUrl);

  const requestJson = async <T>(path: string, init?: Parameters<VocapFetch>[1]): Promise<T> => {
    if (backendUrl === null) throw new Error("VOCAP_API_BASE_URL_REQUIRED");
    if (!fetcher) throw new Error("VOCAP_FETCH_UNAVAILABLE");
    const response = await fetcher(`${backendUrl}${path}`, init);
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) {
      const code = readApiErrorCode(body) ?? `http_${response.status}`;
      throw new VocapApiError(response.status, code);
    }
    return body as T;
  };

  const scope = (params: URLSearchParams): string => {
    params.set("network", normalized.network);
    params.set("routerAddress", normalized.routerAddress);
    return params.toString();
  };

  return {
    network: normalized.network,
    routerAddress: normalized.routerAddress,
    poolAddress: normalized.poolAddress,
    policyId: normalized.policyId,
    backendUrl,
    buildPrivacyInvokeCall(noteId) {
      return buildVocapPrivacyInvokeCall({ ...invokeInput, noteId });
    },
    createInvokeCallBuilder() {
      return createVocapInvokeCallBuilder(invokeInput);
    },
    prepareWalletCall(result, options = {}) {
      return prepareVocapWalletCall(result, {
        ...options,
        expectedPoolAddress: options.expectedPoolAddress ?? normalized.poolAddress,
      });
    },
    submitPrivateResult(account, result, options = {}) {
      return submitVocapPrivateResult(account, result, {
        ...options,
        expectedPoolAddress: options.expectedPoolAddress ?? normalized.poolAddress,
      });
    },
    getPolicy() {
      const params = new URLSearchParams({ policyId: normalized.policyId });
      return requestJson<VocapPolicyProjection>(`/api/v1/policies?${scope(params)}`);
    },
    listExecutions(query = {}) {
      const params = new URLSearchParams();
      if (query.policyId !== undefined) params.set("policyId", toDecimal(query.policyId));
      if (query.limit !== undefined) {
        if (!Number.isSafeInteger(query.limit) || query.limit < 1 || query.limit > 100) {
          throw new Error("VOCAP_API_INVALID_LIMIT");
        }
        params.set("limit", String(query.limit));
      }
      if (query.cursor !== undefined) params.set("cursor", query.cursor);
      return requestJson<VocapExecutionPage>(`/api/v1/executions?${scope(params)}`);
    },
    getTransaction(txHash) {
      const params = new URLSearchParams({ txHash: toHex(txHash) });
      return requestJson<VocapTransactionProjection>(`/api/v1/transactions?${scope(params)}`);
    },
    registerRouterExecution(txHash) {
      return requestJson<VocapTransactionProjection>("/api/v1/transactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          network: normalized.network,
          routerAddress: normalized.routerAddress,
          txHash: toHex(txHash),
          kind: "router_execution",
        }),
      });
    },
  };
}

function normalizeClientConfig(config: VocapClientConfig): {
  network: VocapNetwork;
  routerAddress: string;
  poolAddress: string;
  policyId: string;
  tokenAddress: string;
  amount: bigint;
  targetAddress: string;
  selector: string;
  targetCalldata?: readonly BigNumberish[];
} {
  if (!config || typeof config !== "object") throw new Error("VOCAP_CLIENT_CONFIG_REQUIRED");
  if (config.network !== "sepolia" && config.network !== "mainnet" && config.network !== "devnet") {
    throw new Error("VOCAP_NETWORK_REQUIRED");
  }
  const amount = toBigInt(config.amount);
  const input: VocapPrivacyInvokeInput = {
    routerAddress: config.routerAddress,
    policyId: config.policyId,
    tokenAddress: config.tokenAddress,
    amount,
    noteId: 1n,
    targetAddress: config.targetAddress,
    selector: config.selector,
    ...(config.targetCalldata === undefined ? {} : { targetCalldata: config.targetCalldata }),
  };
  validateInvokeInput(input);
  const pool = toBigInt(config.poolAddress);
  if (pool === 0n) throw new Error("VOCAP_POOL_ADDRESS_REQUIRED");
  return {
    network: config.network,
    routerAddress: toHex(config.routerAddress),
    poolAddress: toHex(pool),
    policyId: toDecimal(config.policyId),
    tokenAddress: toHex(config.tokenAddress),
    amount,
    targetAddress: toHex(config.targetAddress),
    selector: toHex(config.selector),
    ...(config.targetCalldata === undefined ? {} : { targetCalldata: [...config.targetCalldata] }),
  };
}

function validateInvokeInput(input: VocapPrivacyInvokeInput): void {
  if (toBigInt(input.routerAddress) === 0n) throw new Error("VOCAP_ROUTER_ADDRESS_REQUIRED");
  if (toBigInt(input.policyId) === 0n) throw new Error("VOCAP_POLICY_ID_REQUIRED");
  if (toBigInt(input.tokenAddress) === 0n) throw new Error("VOCAP_TOKEN_ADDRESS_REQUIRED");
  if (toBigInt(input.amount) <= 0n) throw new Error("VOCAP_AMOUNT_REQUIRED");
  if (toBigInt(input.noteId) === 0n) throw new Error("VOCAP_NOTE_ID_REQUIRED");
  if (toBigInt(input.targetAddress) === 0n) throw new Error("VOCAP_TARGET_ADDRESS_REQUIRED");
  if (toBigInt(input.selector) === 0n) throw new Error("VOCAP_SELECTOR_REQUIRED");
}

function toBigInt(value: BigNumberish): bigint {
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    throw new Error("VOCAP_PRIVATE_FLOW_INVALID_FELT");
  }
  try {
    const parsed = BigInt(String(value));
    if (parsed < 0n) throw new Error("negative");
    return parsed;
  } catch {
    throw new Error("VOCAP_PRIVATE_FLOW_INVALID_FELT");
  }
}

function toDecimal(value: BigNumberish): string {
  return toBigInt(value).toString(10);
}

function toHex(value: BigNumberish): string {
  return num.toHex(toBigInt(value));
}

function normalizeBackendUrl(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  return trimmed.replace(/\/+$/, "");
}

function readApiErrorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const error = (body as { error?: unknown }).error;
  return typeof error === "string" && error.length > 0 ? error : null;
}
