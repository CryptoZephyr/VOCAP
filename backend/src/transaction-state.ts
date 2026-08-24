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
}): Exclude<TransactionStatus, "pending"> {
  if (receipt.execution_status?.toUpperCase() === "REVERTED") {
    return "reverted";
  }
  if (receipt.finality_status?.toUpperCase() === "REJECTED") {
    return "rejected";
  }
  return "accepted";
}
