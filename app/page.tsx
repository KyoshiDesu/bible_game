import { Button } from "@/components/ui/button";

const PALETTE = [
  { name: "violet-deep", className: "bg-violet-deep", hex: "#191231" },
  { name: "violet-mid", className: "bg-violet-mid", hex: "#2E2450" },
  { name: "ink", className: "bg-ink", hex: "#221A38" },
  { name: "ink-soft", className: "bg-ink-soft", hex: "#4A4166" },
  { name: "ink-faint", className: "bg-ink-faint", hex: "#7B7397" },
  { name: "brass", className: "bg-brass", hex: "#A8762C" },
  { name: "brass-lite", className: "bg-brass-lite", hex: "#E9DCC2" },
  { name: "teal", className: "bg-teal", hex: "#1F6E6A" },
  { name: "teal-lite", className: "bg-teal-lite", hex: "#D8EAE7" },
  { name: "clay", className: "bg-clay", hex: "#9B3B3B" },
  { name: "clay-lite", className: "bg-clay-lite", hex: "#F3DEDC" },
  { name: "vellum", className: "bg-vellum", hex: "#F4EFE3" },
  { name: "surface", className: "bg-surface", hex: "#FBFAFD" },
  { name: "surface-2", className: "bg-surface-2", hex: "#EBE7F0" },
  { name: "page", className: "bg-page", hex: "#F1EFF4" },
  { name: "rule", className: "bg-rule", hex: "#D9D4E2" },
];

/**
 * Placeholder home page. It exists so the foundation is verifiable by eye —
 * every ported token rendered once — and is replaced by the app shell in
 * phase 2.
 */
export default function Home() {
  return (
    <main className="mx-auto max-w-[860px] px-8 py-16">
      <p className="font-mono text-xs tracking-widest text-brass uppercase">
        Foundation
      </p>
      <h1 className="mt-2 text-5xl leading-none font-semibold text-ink [font-variation-settings:'SOFT'_22,'WONK'_1]">
        Press Start
      </h1>
      <p className="mt-4 text-lg text-ink-soft">
        A semester on video games and faith. The curriculum is being rebuilt as
        an application — prep, projector, and phone.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-ink">Palette</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PALETTE.map((swatch) => (
            <li
              key={swatch.name}
              className="overflow-hidden rounded-lg border border-rule bg-surface shadow-press"
            >
              <div className={`${swatch.className} h-14`} />
              <div className="px-3 py-2">
                <p className="text-sm font-bold text-ink">{swatch.name}</p>
                <p className="font-mono text-xs text-ink-faint">{swatch.hex}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-ink">Type</h2>
        <div className="mt-4 space-y-4 rounded-lg border border-rule bg-surface p-6 shadow-press">
          <p className="font-serif text-3xl">
            Fraunces sets the headings and the scripture.
          </p>
          <p className="font-sans text-base">
            Karla carries the body copy, the lesson plans, and the discussion
            questions.
          </p>
          <p className="font-mono text-sm text-teal">
            IBM Plex Mono — 00:40 · Session 07 · &ldquo;The Split&rdquo;
          </p>
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-ink">Components</h2>
        <p className="mt-2 text-sm text-ink-faint">
          shadcn/ui, drawing its semantic colours from the tokens above.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-rule bg-surface p-6 shadow-press">
          <Button>Start the session</Button>
          <Button variant="secondary">Preview slides</Button>
          <Button variant="outline">Case bank</Button>
          <Button variant="ghost">Skip</Button>
        </div>
      </section>
    </main>
  );
}
