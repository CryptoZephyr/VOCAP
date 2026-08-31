import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { applyFileProtocolGuard } from "./boot.ts";
import { FILE_PROTOCOL_GUIDE } from "./copy.ts";
import "./styles.css";

export function mountFrontend(doc: Document, loc: Pick<Location, "protocol">): void {
  if (applyFileProtocolGuard(doc, loc.protocol)) {
    const root = doc.getElementById("root");
    if (root) root.replaceChildren();
    if (!doc.getElementById("serve-hint")) {
      const p = doc.createElement("p");
      p.id = "serve-hint";
      p.textContent = FILE_PROTOCOL_GUIDE;
      doc.body.append(p);
    }
    return;
  }

  const root = doc.getElementById("root");
  if (!root) throw new Error("missing #root");
  createRoot(root).render(<App />);
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  const root = document.getElementById("root");
  if (root) mountFrontend(document, window.location);
}
