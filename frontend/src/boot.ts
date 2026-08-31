import { FILE_PROTOCOL_GUIDE } from "./copy.ts";

export function describeEntryEnvironment(protocol: string): { ok: boolean; message: string } {
  if (protocol === "file:") {
    return { ok: false, message: FILE_PROTOCOL_GUIDE };
  }
  return { ok: true, message: "" };
}

export function applyFileProtocolGuard(doc: Document, protocol: string): boolean {
  const hint = doc.getElementById("serve-hint");
  const blocked = !describeEntryEnvironment(protocol).ok;
  if (hint instanceof HTMLElement) {
    hint.hidden = !blocked;
  }
  return blocked;
}
