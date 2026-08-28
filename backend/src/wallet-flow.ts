import type {
  AccountInterface,
  AllowArray,
  BigNumberish,
  Call,
  InvocationsDetails,
} from "starknet";

/**
 * The part of the privacy SDK result needed by the user's wallet.
 *
 * This structural type keeps the backend package independent from the privacy
 * SDK package. A browser client can pass the SDK's CallAndProof value here
 * without giving the backend access to a viewing key or private signer.
 */
export interface VocapCallAndProof {
  call: {
    contractAddress: string;
    entrypoint: string;
    calldata?: readonly BigNumberish[];
  };
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

/**
 * Validate and normalize the proven privacy-pool call before handing it to a
 * wallet. The final transaction is still signed and broadcast by the wallet.
 */
export function prepareVocapWalletCall(
  result: VocapCallAndProof,
  options: VocapWalletSubmissionOptions = {},
): { call: Call; details: InvocationsDetails } {
  if (result.call.entrypoint !== "apply_actions") {
    throw new Error("VOCAP_PRIVATE_FLOW_EXPECTS_APPLY_ACTIONS");
  }
  if (isZeroAddress(result.call.contractAddress)) {
    throw new Error("VOCAP_PRIVATE_FLOW_POOL_REQUIRED");
  }
  if (
    options.expectedPoolAddress !== undefined &&
    toBigInt(result.call.contractAddress) !== toBigInt(options.expectedPoolAddress)
  ) {
    throw new Error("VOCAP_PRIVATE_FLOW_POOL_MISMATCH");
  }
  if (typeof result.proof.data !== "string" || result.proof.data.length === 0) {
    throw new Error("VOCAP_PRIVATE_FLOW_PROOF_REQUIRED");
  }
  if (result.proof.proofFacts.length === 0) {
    throw new Error("VOCAP_PRIVATE_FLOW_PROOF_FACTS_REQUIRED");
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
  const response = await account.execute(
    prepared.call as AllowArray<Call>,
    prepared.details,
  );
  return {
    transactionHash: response.transaction_hash,
    call: prepared.call,
  };
}

function toBigInt(value: BigNumberish): bigint {
  try {
    return BigInt(String(value));
  } catch {
    throw new Error("VOCAP_PRIVATE_FLOW_INVALID_ADDRESS");
  }
}

function isZeroAddress(value: BigNumberish): boolean {
  return toBigInt(value) === 0n;
}
