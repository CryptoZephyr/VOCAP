import { Open, createPrivateTransfers, type PrivateTransfersInterface } from "@starkware-libs/starknet-privacy-sdk";
import { CallData, num, type AccountInterface, type BigNumberish, type Call } from "starknet";
import type { DeploymentConfig } from "./config.ts";

type CallAndProof = {
  call: { contractAddress: string; entrypoint: string; calldata?: readonly BigNumberish[] };
  proof: { data: string; proofFacts: readonly BigNumberish[] };
};

export function buildVocapInvokeCalldata(input: {
  config: DeploymentConfig;
  noteId: BigNumberish;
}): string[] {
  const { config, noteId } = input;
  return CallData.compile([
    config.policyId,
    config.capabilityTokenAddress,
    config.amount,
    noteId,
    config.targetAddress,
    config.selector,
    config.targetCalldata.length,
    ...config.targetCalldata,
  ]);
}

export function createTransfers(
  account: AccountInterface & { address: string; signer: unknown },
  viewingKey: string,
  config: DeploymentConfig,
): PrivateTransfersInterface {
  return createPrivateTransfers({
    account: account as never,
    viewingKeyProvider: { getViewingKey: async () => viewingKey },
    provingProvider: {
      url: config.provingServiceUrl,
      chainId: config.chainId,
      nodeUrl: config.rpcUrl,
      ohttp: true,
    },
    discoveryProvider: { url: config.discoveryServiceUrl },
    poolContractAddress: config.poolAddress,
  });
}

export async function discoverCapability(transfers: PrivateTransfersInterface, config: DeploymentConfig) {
  const discovery = await transfers.discoverNotes({ tokens: [BigInt(config.capabilityTokenAddress)] });
  const notes = discovery.notes.get(BigInt(config.capabilityTokenAddress)) ?? [];
  const total = notes.reduce((sum, note) => sum + BigInt(note.amount), 0n);
  return { notes, total, timestamp: discovery.timestamp };
}

export async function buildReturnProof(
  transfers: PrivateTransfersInterface,
  accountAddress: string,
  config: DeploymentConfig,
): Promise<CallAndProof> {
  const result = await transfers
    .build({ autoDiscover: { notes: "refresh" }, autoSelectNotes: "naive" })
    .with(config.capabilityTokenAddress, (token) =>
      token
        .withdraw({ recipient: config.routerAddress, amount: config.amount })
        .transfer({ recipient: accountAddress, amount: Open }),
    )
    .invoke(({ openNotes, withdrawals }) => {
      if (withdrawals.length !== 1) throw new Error("VOCAP_PRIVATE_FLOW_REQUIRES_ONE_WITHDRAWAL");
      if (openNotes.length !== 1) throw new Error("VOCAP_PRIVATE_FLOW_REQUIRES_ONE_OPEN_NOTE");
      const withdrawal = withdrawals[0]!;
      const openNote = openNotes[0]!;
      if (BigInt(withdrawal.recipient) !== BigInt(config.routerAddress)) {
        throw new Error("VOCAP_WITHDRAWAL_RECIPIENT_MISMATCH");
      }
      if (BigInt(withdrawal.token) !== BigInt(config.capabilityTokenAddress)) {
        throw new Error("VOCAP_WITHDRAWAL_TOKEN_MISMATCH");
      }
      if (BigInt(withdrawal.amount) !== config.amount) throw new Error("VOCAP_WITHDRAWAL_AMOUNT_MISMATCH");
      if (BigInt(openNote.token) !== BigInt(config.capabilityTokenAddress)) {
        throw new Error("VOCAP_OPEN_NOTE_TOKEN_MISMATCH");
      }
      return {
        contractAddress: num.toHex(config.routerAddress),
        calldata: buildVocapInvokeCalldata({ config, noteId: openNote.noteId }),
      };
    })
    .execute();
  return result.callAndProof as CallAndProof;
}

export async function submitPrivateResult(
  account: Pick<AccountInterface, "execute">,
  result: CallAndProof,
  expectedPoolAddress: string,
): Promise<{ transactionHash: string; call: Call }> {
  if (result.call.entrypoint !== "apply_actions") throw new Error("VOCAP_PRIVATE_FLOW_EXPECTS_APPLY_ACTIONS");
  if (BigInt(result.call.contractAddress) !== BigInt(expectedPoolAddress)) {
    throw new Error("VOCAP_PRIVATE_FLOW_POOL_MISMATCH");
  }
  if (!result.proof.data || result.proof.proofFacts.length === 0) throw new Error("VOCAP_PRIVATE_FLOW_PROOF_REQUIRED");
  const call: Call = {
    contractAddress: result.call.contractAddress,
    entrypoint: result.call.entrypoint,
    calldata: result.call.calldata ? [...result.call.calldata] : [],
  };
  const response = await account.execute(call, {
    proofFacts: [...result.proof.proofFacts],
    proof: result.proof.data,
  });
  return { transactionHash: response.transaction_hash, call };
}

export async function transferCapability(
  transfers: PrivateTransfersInterface,
  recipient: string,
  config: DeploymentConfig,
): Promise<CallAndProof> {
  if (BigInt(recipient) === 0n) throw new Error("Recipient is required.");
  const result = await transfers
    .build({ autoDiscover: { notes: "refresh" }, autoSelectNotes: "naive", autoSetup: true })
    .with(config.capabilityTokenAddress, (token) => token.transfer({ recipient, amount: config.amount }))
    .execute();
  return result.callAndProof as CallAndProof;
}
