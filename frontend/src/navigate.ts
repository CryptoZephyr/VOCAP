import type { MouseEvent } from "react";
import { isInternalPath } from "./routes.ts";

export function navigate(href: string): void {
  if (!isInternalPath(href)) return;
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function handleInternalClick(event: MouseEvent<HTMLAnchorElement>, href: string): void {
  if (event.defaultPrevented) return;
  if (event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!isInternalPath(href)) return;
  event.preventDefault();
  navigate(href);
}
