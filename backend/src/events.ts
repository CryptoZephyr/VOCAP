import { hash } from "starknet";
import { normalizeAddress } from "./config.js";

export interface RawRouterEvent {
  from_address: string;
  keys: string[];
  data: string[];
}

const eventNamespace = "vocap_contracts::vocap_router::VocapRouter";

export const ROUTER_EVENT_SELECTORS = {
  policyCreated: hash.getSelectorFromName(`${eventNamespace}::PolicyCreated`).toLowerCase(),
  policyEnabled: hash.getSelectorFromName(`${eventNamespace}::PolicyEnabled`).toLowerCase(),
  policyExecuted: hash.getSelectorFromName(`${eventNamespace}::PolicyExecuted`).toLowerCase(),
} as const;

export type ParsedRouterEvent =
  | {
      kind: "policy_created";
      policyId: string;
      tokenAddress: string;
      amount: string;
      targetAddress: string;
      selector: string;
    }
  | {
      kind: "policy_enabled";
      policyId: string;
      enabled: boolean;
    }
  | {
      kind: "policy_executed";
      policyId: string;
      targetAddress: string;
      selector: string;
      tokenAddress: string;
      amount: string;
      noteId: string;
    };

export function parseRouterEvent(
  routerAddress: string,
  event: RawRouterEvent,
): ParsedRouterEvent | null {
  if (normalizeAddress(event.from_address) !== normalizeAddress(routerAddress)) {
    return null;
  }

  const selector = event.keys[0]?.toLowerCase();
  const policyId = event.keys[1];
  if (!selector || policyId === undefined) {
    return null;
  }

  if (selector === ROUTER_EVENT_SELECTORS.policyCreated) {
    requireLength(event.data, 4, "PolicyCreated");
    return {
      kind: "policy_created",
      policyId: feltToDecimal(policyId),
      tokenAddress: normalizeAddress(dataAt(event.data, 0, "PolicyCreated")),
      amount: feltToDecimal(dataAt(event.data, 1, "PolicyCreated")),
      targetAddress: normalizeAddress(dataAt(event.data, 2, "PolicyCreated")),
      selector: normalizeFelt(dataAt(event.data, 3, "PolicyCreated")),
    };
  }

  if (selector === ROUTER_EVENT_SELECTORS.policyEnabled) {
    requireLength(event.data, 1, "PolicyEnabled");
    return {
      kind: "policy_enabled",
      policyId: feltToDecimal(policyId),
      enabled: parseBool(dataAt(event.data, 0, "PolicyEnabled")),
    };
  }

  if (selector === ROUTER_EVENT_SELECTORS.policyExecuted) {
    requireLength(event.data, 5, "PolicyExecuted");
    return {
      kind: "policy_executed",
      policyId: feltToDecimal(policyId),
      targetAddress: normalizeAddress(dataAt(event.data, 0, "PolicyExecuted")),
      selector: normalizeFelt(dataAt(event.data, 1, "PolicyExecuted")),
      tokenAddress: normalizeAddress(dataAt(event.data, 2, "PolicyExecuted")),
      amount: feltToDecimal(dataAt(event.data, 3, "PolicyExecuted")),
      noteId: normalizeFelt(dataAt(event.data, 4, "PolicyExecuted")),
    };
  }

  return null;
}

function requireLength(values: string[], minimum: number, eventName: string): void {
  if (values.length < minimum) {
    throw new Error(`${eventName} event has insufficient data`);
  }
}

function dataAt(values: string[], index: number, eventName: string): string {
  const value = values[index];
  if (value === undefined) {
    throw new Error(`${eventName} event has insufficient data`);
  }
  return value;
}

function parseBool(value: string): boolean {
  const parsed = BigInt(value);
  if (parsed === 0n) return false;
  if (parsed === 1n) return true;
  throw new Error(`invalid boolean event value: ${value}`);
}

function feltToDecimal(value: string): string {
  return BigInt(value).toString(10);
}

function normalizeFelt(value: string): string {
  return `0x${BigInt(value).toString(16)}`;
}
