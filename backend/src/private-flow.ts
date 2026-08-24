import { CallData, num } from "starknet";
import type { BigNumberish, CallDetails } from "starknet";

export interface VocapOpenNoteContext {
  noteId: BigNumberish;
  token: BigNumberish;
}

export interface VocapWithdrawalContext {
  recipient: BigNumberish;
  token: BigNumberish;
  amount: bigint;
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

/**
 * Build the application calldata forwarded by the STRK20 privacy pool.
 *
 * The final span is encoded as [length, ...elements]. The privacy SDK compiles
 * this array as raw calldata, so the span must be serialized here instead of
 * passed as a nested JavaScript array.
 */
export function buildVocapPrivacyInvokeCalldata(
  input: VocapPrivacyInvokeInput,
): string[] {
  const targetCalldata = [...(input.targetCalldata ?? [])];
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
    if (withdrawal.amount !== input.amount) {
      throw new Error("VOCAP_WITHDRAWAL_AMOUNT_MISMATCH");
    }
    if (toBigInt(openNote.token) !== toBigInt(input.tokenAddress)) {
      throw new Error("VOCAP_OPEN_NOTE_TOKEN_MISMATCH");
    }

    return buildVocapPrivacyInvokeCall({
      ...input,
      noteId: openNote.noteId,
    });
  };
}

function toBigInt(value: BigNumberish): bigint {
  return BigInt(String(value));
}
