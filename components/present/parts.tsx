import { type ReactNode } from "react";

import { type Beat, type Choice } from "@/content/scenario-schema";
import { type Tally } from "@/lib/room/machine";

/** A, B, C, D. The keys are stored lowercase; a room reads them aloud. */
export function choiceLetter(key: string): string {
  return key.toUpperCase();
}

export function ChoiceRow({
  choice,
  emphasis,
  trailing,
}: {
  choice: Choice;
  emphasis?: "won" | "tied";
  trailing?: ReactNode;
}) {
  const tone =
    emphasis === "won"
      ? "border-brass bg-brass/15 text-on-violet"
      : emphasis === "tied"
        ? "border-brass-on-violet/60 text-on-violet"
        : "border-white/10 text-on-violet-soft";

  return (
    <li
      className={`flex items-baseline gap-5 rounded-xl border px-6 py-4 ${tone}`}
    >
      <span className="font-mono text-2xl text-brass-on-violet">
        {choiceLetter(choice.key)}
      </span>
      <span className="flex-1 text-[clamp(1.1rem,2.2vw,1.9rem)] leading-snug">
        {choice.label}
      </span>
      {trailing}
    </li>
  );
}

/**
 * The split, once. It is drawn only after voting closes — showing a room what
 * it is currently thinking is the fastest way to stop it thinking.
 */
export function TallyBars({
  beat,
  tally,
  winner,
}: {
  beat: Beat;
  tally: Tally;
  winner: string;
}) {
  const counts = beat.choices.map((choice) => tally[choice.key] ?? 0);
  const highest = Math.max(1, ...counts);

  return (
    <ul className="m-0 mt-6 list-none space-y-3 p-0">
      {beat.choices.map((choice) => {
        const count = tally[choice.key] ?? 0;
        const won = choice.key === winner;
        return (
          <li key={choice.key} className="flex items-center gap-4">
            <span className="w-8 font-mono text-lg text-brass-on-violet">
              {choiceLetter(choice.key)}
            </span>
            <span className="h-6 flex-1 overflow-hidden rounded-full bg-white/10">
              <span
                className={`block h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${
                  won ? "bg-brass" : "bg-on-violet-faint"
                }`}
                style={{ width: `${Math.round((count / highest) * 100)}%` }}
              />
            </span>
            <span className="w-10 text-right font-mono text-lg text-on-violet-soft tabular-nums">
              {count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
