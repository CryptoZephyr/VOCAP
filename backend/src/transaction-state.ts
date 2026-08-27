import type { TransactionStatus } from "./types.js";

const allowedTransitions: Record<TransactionStatus, readonly TransactionStatus[]> = {
  pending: ["pending", "accepted", "rejected", "reverted"],
  accepted: ["accepted"],
  rejected: ["rejected"],
  reverted: ["reverted"],
};

export function assertTransactionTransition(
  current: TransactionStatus,
  next: TransactionStatus,
): void {
  if (!allowedTransitions[current].includes(next)) {
    throw new Error(`invalid transaction status transition: ${current} -> ${next}`);
  }
}

export function receiptStatus(receipt: {
  execution_status?: string;
  finality_status?: string;
  executionStatus?: string;
  finalityStatus?: string;
}): Exclude<TransactionStatus, "pending"> {
  const executionStatus = receipt.execution_status ?? receipt.executionStatus;
  const finalityStatus = receipt.finality_status ?? receipt.finalityStatus;
  if (finalityStatus?.toUpperCase() === "REJECTED") {
    return "rejected";
  }
  if (
    (finalityStatus?.toUpperCase() === "ACCEPTED_ON_L2" ||
      finalityStatus?.toUpperCase() === "ACCEPTED_ON_L1") &&
    executionStatus?.toUpperCase() === "REVERTED"
  ) {
    return "reverted";
  }
  if (isConfirmedSuccessfulReceipt(receipt)) {
    return "accepted";
  }
  throw new Error("receipt is not finalized successfully");
}

/** Only receipts that cannot be replaced or reverted may create projections. */
export function isConfirmedSuccessfulReceipt(receipt: {
  execution_status?: string;
  finality_status?: string;
  executionStatus?: string;
  finalityStatus?: string;
}): boolean {
  const executionStatus = (receipt.execution_status ?? receipt.executionStatus)?.toUpperCase();
  const finalityStatus = (receipt.finality_status ?? receipt.finalityStatus)?.toUpperCase();
  return (
    executionStatus === "SUCCEEDED" &&
    (finalityStatus === "ACCEPTED_ON_L2" || finalityStatus === "ACCEPTED_ON_L1")
  );
}

export function receiptStatusOrPending(receipt: {
  execution_status?: string;
  finality_status?: string;
  executionStatus?: string;
  finalityStatus?: string;
}): TransactionStatus {
  const executionStatus = receipt.execution_status ?? receipt.executionStatus;
  const finalityStatus = receipt.finality_status ?? receipt.finalityStatus;
  if (finalityStatus?.toUpperCase() === "REJECTED") return "rejected";
  if (
    (finalityStatus?.toUpperCase() === "ACCEPTED_ON_L2" ||
      finalityStatus?.toUpperCase() === "ACCEPTED_ON_L1") &&
    executionStatus?.toUpperCase() === "REVERTED"
  ) {
    return "reverted";
  }
  if (isConfirmedSuccessfulReceipt(receipt)) return "accepted";
  return "pending";
}
