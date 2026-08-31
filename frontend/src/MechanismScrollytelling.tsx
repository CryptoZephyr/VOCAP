import { useEffect, useRef, useState } from "react";

const chapters = [
  {
    id: "01",
    label: "Capability",
    title: "Select the private capability.",
    body: "The browser discovers a private STRK20 note and reads policy 1 from the selected Router. The viewing key and note registry stay with the user.",
    detail: "1 STRK · policy 1 · RETURN",
  },
  {
    id: "02",
    label: "Supply",
    title: "Commit one exact amount.",
    body: "The RC2 client withdraws the policy amount to VocapRouter and prepares one fresh open note. The pool owns the private note lifecycle.",
    detail: "private note → STRK20 pool",
  },
  {
    id: "03",
    label: "Execute",
    title: "Permit one public action.",
    body: "The pool calls the Router. The Router checks the caller, token, amount, target, selector, mode, note, and enabled state before premium_action() can run.",
    detail: "pool → Router → approved target",
  },
  {
    id: "04",
    label: "Return",
    title: "Keep the capability alive.",
    body: "After the action succeeds, the Router preserves the exact capability balance and returns it to the pool for a fresh private note.",
    detail: "same value · fresh note",
  },
] as const;

export function MechanismScrollytelling() {
  const [active, setActive] = useState(0);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const activeChapter = chapters[active] ?? chapters[0];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.chapter);
        if (Number.isInteger(index)) setActive(index);
      },
      { rootMargin: "-32% 0px -38%", threshold: [0.2, 0.5, 0.8] },
    );
    chapterRefs.current.forEach((chapter) => chapter && observer.observe(chapter));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="mechanism-detail" className="scroll-story scroll-mt-16 border-b border-border" aria-labelledby="mechanism-title">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[minmax(0,1.05fr)_minmax(19rem,.72fr)] md:px-10">
        <div className="scroll-story-pin md:sticky md:top-16 md:flex md:h-[calc(100dvh-4rem)] md:flex-col md:justify-center">
          <div className="max-w-xl pt-20 md:pt-0">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">The mechanism · scroll to follow</p>
            <h2 id="mechanism-title" className="m-0 max-w-lg text-balance text-3xl font-semibold tracking-tight md:text-5xl">One capability. Four exact states.</h2>
            <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-muted-foreground">The scene stays fixed while the permission moves through its real V1 lifecycle.</p>
          </div>

          <div className="protocol-map relative mt-10 overflow-hidden border-y border-border py-8" data-active={active + 1}>
            <div className="protocol-track absolute left-[12%] right-[12%] top-[4.35rem] h-px bg-border" aria-hidden="true"><span className="block h-full bg-primary" /></div>
            <div className="relative grid grid-cols-4 gap-2" aria-hidden="true">
              {chapters.map((chapter, index) => (
                <div className={`protocol-node ${index <= active ? "is-passed" : ""} ${index === active ? "is-current" : ""}`} key={chapter.id}>
                  <span className="mx-auto grid size-9 place-items-center border border-border bg-background font-mono text-[0.65rem]">{chapter.id}</span>
                  <span className="mt-4 block text-center font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">{chapter.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-9 grid min-h-32 grid-cols-[1fr_auto] items-end gap-6 border-t border-border pt-6">
              <div key={activeChapter.id} className="story-readout">
                <p className="m-0 font-mono text-xs uppercase tracking-[0.14em] text-primary">State {activeChapter.id}</p>
                <p className="m-0 mt-2 text-2xl font-semibold">{activeChapter.title}</p>
                <p className="m-0 mt-3 font-mono text-xs text-muted-foreground">{activeChapter.detail}</p>
              </div>
              <span className="font-mono text-5xl font-semibold tabular-nums text-foreground/10">0{active + 1}</span>
            </div>
          </div>
        </div>

        <ol className="m-0 list-none p-0 md:py-[34dvh]">
          {chapters.map((chapter, index) => (
            <li
              key={chapter.id}
              ref={(element) => { chapterRefs.current[index] = element; }}
              data-chapter={index}
              className={`story-chapter flex min-h-[72dvh] flex-col justify-center border-t border-border py-16 transition-opacity duration-300 md:min-h-[82dvh] ${index === active ? "is-active opacity-100" : "opacity-35"}`}
            >
              <p className="m-0 font-mono text-xs uppercase tracking-[0.16em] text-primary">{chapter.id} · {chapter.label}</p>
              <h3 className="m-0 mt-5 text-balance text-3xl font-semibold tracking-tight md:text-4xl">{chapter.title}</h3>
              <p className="m-0 mt-5 max-w-[40ch] text-base leading-relaxed text-muted-foreground">{chapter.body}</p>
              <p className="m-0 mt-8 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">{chapter.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
