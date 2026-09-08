"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Prose } from "@/components/prep/prose";
import { type Scenario } from "@/content/scenario-schema";

import { ChoiceRow, choiceLetter } from "./parts";

type Stage = "premise" | "vote" | "reveal" | "closing";

/**
 * The same case study, on a show of hands.
 *
 * This page holds no state anywhere but in this browser and asks the network
 * for nothing: the scenario is compiled into the bundle, which is what makes it
 * the honest answer to a hall with no wifi. The leader reads the beat, counts
 * hands, and presses the number that won.
 *
 * It is deliberately reachable on its own rather than only as a fallback. A
 * leader who knows the wifi is bad should be able to decide that before the
 * meeting rather than discover it during one.
 */
export function Deck({ scenario }: { scenario: Scenario }) {
  const [stage, setStage] = useState<Stage>("premise");
  const [beatIndex, setBeatIndex] = useState(0);
  const [picked, setPicked] = useState<Record<number, string>>({});

  const beat = scenario.beats[beatIndex];
  const last = beatIndex >= scenario.beats.length - 1;

  const forward = useCallback(() => {
    if (stage === "premise") setStage("vote");
    else if (stage === "reveal") {
      if (last) setStage("closing");
      else {
        setBeatIndex((index) => index + 1);
        setStage("vote");
      }
    }
  }, [last, stage]);

  const back = useCallback(() => {
    if (stage === "closing") setStage("reveal");
    else if (stage === "reveal") setStage("vote");
    else if (stage === "vote") {
      if (beatIndex === 0) setStage("premise");
      else {
        setBeatIndex((index) => index - 1);
        setStage("reveal");
      }
    }
  }, [beatIndex, stage]);

  const pick = useCallback(
    (key: string) => {
      setPicked((current) => ({ ...current, [beatIndex]: key }));
      setStage("reveal");
    },
    [beatIndex],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
        return;

      if (stage === "vote" && beat) {
        const choice = beat.choices[Number(event.key) - 1];
        if (choice) {
          event.preventDefault();
          pick(choice.key);
          return;
        }
      }
      if (["ArrowRight", "PageDown", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        forward();
      } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [back, beat, forward, pick, stage]);

  const chosen = picked[beatIndex];
  const won = beat?.choices.find((choice) => choice.key === chosen);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-white/10 px-8 py-4">
        <p className="m-0 font-sans text-sm text-on-violet-faint-legible">
          {scenario.caseTitle}
          <span className="mx-2">·</span>
          Show of hands — nothing here is being recorded
        </p>
        <p className="m-0 font-mono text-sm text-on-violet-faint-legible">
          {stage === "premise"
            ? "Premise"
            : stage === "closing"
              ? "Where it ended"
              : `Beat ${beatIndex + 1} of ${scenario.beats.length}`}
        </p>
      </header>

      <main
        id="main"
        className="flex flex-1 flex-col justify-center px-8 py-8 md:px-16"
      >
        {stage === "premise" ? (
          <section key="premise" className="animate-reveal">
            <h1 className="m-0 font-serif text-[clamp(2.2rem,5vw,4rem)] leading-none font-semibold [font-variation-settings:'SOFT'_24,'WONK'_1]">
              {scenario.caseTitle}
            </h1>
            <Prose
              html={scenario.premise}
              className="mt-6 max-w-[52ch] text-[clamp(1.1rem,2.1vw,1.75rem)] leading-snug text-on-violet-soft"
            />
            <ul className="m-0 mt-8 grid list-none gap-4 p-0 sm:grid-cols-3">
              {scenario.cast.map((member) => (
                <li
                  key={member.name}
                  className="rounded-xl border border-white/10 px-5 py-4"
                >
                  <p className="m-0 font-sans text-base font-extrabold text-brass-on-violet">
                    {member.name}
                  </p>
                  <Prose
                    html={member.description}
                    className="mt-1 mb-0 text-sm text-on-violet-soft"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {beat && stage === "vote" ? (
          <section key={`vote-${beat.index}`} className="animate-reveal">
            <Prose
              html={beat.situation}
              className="m-0 max-w-[46ch] text-[clamp(1.4rem,3vw,2.6rem)] leading-tight"
            />
            <p className="mt-6 mb-0 font-sans text-base font-extrabold tracking-[0.06em] text-brass-on-violet uppercase">
              {beat.prompt}
            </p>
            <ul className="m-0 mt-6 grid list-none gap-3 p-0">
              {beat.choices.map((choice, index) => (
                <ChoiceRow
                  key={choice.key}
                  choice={choice}
                  trailing={
                    <button
                      type="button"
                      onClick={() => {
                        pick(choice.key);
                      }}
                      className="rounded-md border border-brass px-3 py-1 font-sans text-sm font-semibold text-on-violet"
                    >
                      Most hands ({index + 1})
                    </button>
                  }
                />
              ))}
            </ul>
          </section>
        ) : null}

        {beat && stage === "reveal" && won ? (
          <section key={`reveal-${beat.index}`} className="animate-reveal">
            <p className="m-0 font-sans text-sm font-extrabold tracking-[0.06em] text-brass-on-violet uppercase">
              The room chose {choiceLetter(won.key)}
            </p>
            <Prose
              html={won.consequence}
              className="mt-4 max-w-[46ch] text-[clamp(1.3rem,2.8vw,2.4rem)] leading-tight"
            />
          </section>
        ) : null}

        {stage === "closing" ? (
          <section key="closing" className="animate-reveal">
            <h2 className="m-0 font-serif text-[clamp(1.8rem,4vw,3rem)] leading-none font-semibold">
              Where it ended
            </h2>
            <Prose
              html={scenario.closing.consequence}
              className="mt-5 max-w-[50ch] text-[clamp(1.2rem,2.4vw,2rem)] leading-snug text-on-violet-soft"
            />
            <p className="mt-8 mb-0 font-mono text-xl text-brass-on-violet">
              {scenario.closing.scriptureRefs.join("  ·  ")}
            </p>
          </section>
        ) : null}
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-8 py-5 text-sm text-on-violet-faint-legible">
        <span>
          {stage === "vote"
            ? "Count the hands, then press the number that won. 1–4."
            : "→ or the clicker to move on. ← to go back."}
        </span>
        <Link href="/present" className="text-on-violet-soft">
          Back to the live version
        </Link>
      </footer>
    </div>
  );
}
