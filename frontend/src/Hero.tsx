import { ArrowUpRight } from "@phosphor-icons/react";
import { ATMOSPHERE_PATH, LOGO_ALT, LOGO_PUBLIC_PATH } from "./brand.ts";
import { Button } from "@/components/ui/button.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
  getHeroCtas,
  HEADLINE,
  PROTOCOL_STEPS,
  SCENE_NAV,
  SUPPORTING,
} from "./copy.ts";
import { ClickSpark } from "./motion/ClickSpark.tsx";
import { handleInternalClick } from "./navigate.ts";
import { ROUTES } from "./routes.ts";

export function Hero() {
  const ctas = getHeroCtas();
  const tryCapability = ctas.find((cta) => cta.id === "try-capability");
  const copyCtas = ctas.filter((cta) => cta.id !== "try-capability");

  return (
    <ClickSpark>
      <div className="hero relative grid min-h-[100dvh] grid-rows-[auto_1fr_auto] overflow-hidden bg-background text-foreground">
        <img
          className="protocol-atmosphere pointer-events-none absolute inset-0 size-full object-cover"
          src={ATMOSPHERE_PATH}
          alt=""
        />
        <a
          className="brand absolute left-4 top-2 z-[2] block mix-blend-multiply md:left-10"
          href={ROUTES.home}
          aria-label="VOCAP home"
        >
          <img
            className="size-16 object-contain"
            src={LOGO_PUBLIC_PATH}
            alt={LOGO_ALT}
            width={64}
            height={64}
          />
        </a>
        <header className="hero-chrome relative flex h-16 max-h-20 items-center justify-end px-4 md:px-10">
          {tryCapability ? (
            <Button
              nativeButton={false}
              render={
                <a
                  href={tryCapability.href}
                  onClick={(event) => handleInternalClick(event, tryCapability.href)}
                />
              }
            >
              {tryCapability.label}
            </Button>
          ) : null}
        </header>

        <div className="hero-body relative z-10 grid items-end gap-6 px-4 pb-7 pt-6 md:grid-cols-[minmax(0,1.3fr)_auto] md:gap-12 md:px-10">
          <section className="hero-copy relative max-w-xl">
            <h1 className="m-0 mb-4 pb-1 font-sans text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {HEADLINE}
            </h1>
            <p className="supporting m-0 mb-7 max-w-[42ch] text-base leading-relaxed text-muted-foreground">
              {SUPPORTING}
            </p>
            <div className="cta-row flex flex-wrap items-center gap-x-5 gap-y-3">
              {copyCtas.map((cta) => (
                <Button
                  key={cta.id}
                  variant={cta.id === "see-how" ? "secondary" : "link"}
                  nativeButton={false}
                  render={
                    <a
                      href={cta.href}
                      {...(cta.external
                        ? { target: "_blank", rel: "noreferrer" }
                        : { onClick: (event) => handleInternalClick(event, cta.href) })}
                    />
                  }
                >
                  {cta.label}
                  {cta.external ? <ArrowUpRight data-icon="inline-end" /> : null}
                </Button>
              ))}
            </div>
          </section>

          <nav className="scene-nav flex min-w-0 flex-row flex-wrap gap-x-2 gap-y-2 pb-2 md:min-w-40 md:flex-col md:items-start md:gap-1.5" aria-label="Landing sections">
            {SCENE_NAV.map((item, index) => (
              <a
                key={item.id}
                href={item.href}
                className={index === 0
                  ? "is-active bg-background/85 px-2 py-1 text-left text-[0.95rem] font-semibold text-foreground"
                  : "bg-background/75 px-2 py-1 text-left text-[0.95rem] text-foreground/75 hover:bg-background/90 hover:text-foreground"}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <ol className="protocol-strip relative z-10 m-0 grid list-none grid-cols-1 gap-6 bg-background/70 px-4 py-5 md:grid-cols-4 md:px-10 md:pb-7" id="mechanism">
          <Separator className="col-span-full" />
          {PROTOCOL_STEPS.map((step) => (
            <li key={step.id} className="min-w-0">
              <span className="step-id mb-2 block font-mono text-xs tracking-wide">
                {step.id} {step.name}
              </span>
              <p className="m-0 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </ClickSpark>
  );
}
