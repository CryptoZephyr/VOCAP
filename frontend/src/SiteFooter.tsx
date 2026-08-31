import { LOGO_ALT, LOGO_PUBLIC_PATH } from "./brand.ts";
import { handleInternalClick } from "./navigate.ts";
import { ROUTES } from "./routes.ts";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between md:px-10">
        <a className="inline-flex w-fit items-center gap-3" href={ROUTES.home} onClick={(event) => handleInternalClick(event, ROUTES.home)}>
          <img className="size-10 object-contain mix-blend-multiply" src={LOGO_PUBLIC_PATH} alt={LOGO_ALT} width={40} height={40} />
          <span className="text-sm font-semibold">VOCAP</span>
        </a>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legal">
          <a className="text-muted-foreground hover:text-foreground" href={ROUTES.terms} onClick={(event) => handleInternalClick(event, ROUTES.terms)}>Terms</a>
          <a className="text-muted-foreground hover:text-foreground" href={ROUTES.privacy} onClick={(event) => handleInternalClick(event, ROUTES.privacy)}>Privacy</a>
          <a className="text-muted-foreground hover:text-foreground" href={ROUTES.docs} onClick={(event) => handleInternalClick(event, ROUTES.docs)}>Docs</a>
        </nav>
      </div>
    </footer>
  );
}
