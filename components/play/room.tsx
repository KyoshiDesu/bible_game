"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";

import { Prose } from "@/components/prep/prose";
import { type Scenario } from "@/content/scenario-schema";
import { castVote } from "@/lib/actions/room";
import { type RoomState } from "@/lib/room/client";
import { beatAt } from "@/lib/room/machine";
import { useLiveRoom } from "@/lib/room/use-live-room";

export interface RoomProps {
  scenario: Scenario;
  initialState: RoomState;
  groupId: string;
  groupName: string;
  presenceKey: string;
  /** What this phone already chose on the current beat, if anything. */
  initialChoice: string | null;
}

/**
 * A phone, in a room, with the lights down.
 *
 * The projector is doing the talking. This screen carries one decision at a
 * time and says plainly what it has done with it, because the failure that
 * matters here is a participant who taps and cannot tell whether it counted.
 *
 * Nothing on this screen reports what anyone else chose. The count on the
 * projector is broadcast by the database and the split is not shown until the
 * beat is over — a room that can see where it is going stops thinking.
 */
export function Room({
  scenario,
  initialState,
  groupId,
  groupName,
  presenceKey,
  initialChoice,
}: RoomProps) {
  const { state, connection, refresh, refreshing } = useLiveRoom(
    initialState,
    presenceKey,
  );
  const [choice, setChoice] = useState<string | null>(initialChoice);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const beat = beatAt(scenario, state.currentBeat);
  const result = state.results.find(
    (entry) => entry.beatIndex === state.currentBeat,
  );

  // A new beat is a fresh decision. Carrying the last one over would show
  // somebody a locked-in answer they never gave.
  useEffect(() => {
    setChoice(null);
    setRefusal(null);
  }, [state.currentBeat]);

  function vote(key: string) {
    startTransition(async () => {
      const outcome = await castVote(state.runId, state.currentBeat, key);
      if (outcome.ok) {
        setChoice(key);
        setRefusal(null);
      } else {
        setRefusal(outcome.reason);
      }
    });
  }

  const chosenLabel = choice
    ? beat?.choices.find((candidate) => candidate.key === choice)?.label
    : undefined;

  return (
    <div className="pb-10">
      {connection === "lost" ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-clay bg-clay-lite px-4 py-3 text-sm text-clay-ink"
        >
          <p className="m-0 font-bold">This has stopped updating on its own.</p>
          <p className="m-0 mt-1">
            Your votes still go through. Tap to catch up with the room.
          </p>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="mt-2 rounded-md bg-clay px-3 py-1 font-semibold text-on-violet disabled:opacity-60"
          >
            {refreshing ? "Catching up…" : "Catch up"}
          </button>
        </div>
      ) : null}

      <p className="mt-8 mb-0 font-sans text-xs font-extrabold tracking-[0.08em] text-ink-faint-legible uppercase">
        {groupName}
      </p>
      <h1 className="mt-1 font-serif text-2xl leading-tight font-semibold [font-variation-settings:'SOFT'_22,'WONK'_1]">
        {scenario.caseTitle}
      </h1>

      {state.state === "idle" ? (
        <p className="mt-6 text-lg text-ink-soft">
          Waiting for your leader to start. The screen at the front has the
          story; this one has the choices.
        </p>
      ) : null}

      {beat && state.state === "voting" ? (
        <section className="mt-6">
          <p className="m-0 font-sans text-sm font-extrabold text-brass-legible">
            {beat.prompt}
          </p>
          <ul className="m-0 mt-4 list-none space-y-3 p-0">
            {beat.choices.map((option) => {
              const picked = option.key === choice;
              return (
                <li key={option.key}>
                  <button
                    type="button"
                    onClick={() => {
                      vote(option.key);
                    }}
                    disabled={pending}
                    aria-pressed={picked}
                    className={`flex w-full items-baseline gap-4 rounded-xl border px-4 py-4 text-left text-base leading-snug disabled:opacity-70 ${
                      picked
                        ? "border-teal bg-teal-lite text-ink"
                        : "border-rule bg-surface text-ink"
                    }`}
                  >
                    <span className="font-mono text-sm text-brass-legible">
                      {option.key.toUpperCase()}
                    </span>
                    <span className="flex-1">{option.label}</span>
                    {picked ? (
                      <span className="font-sans text-xs font-bold text-teal">
                        Locked in
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 mb-0 text-sm text-ink-soft" role="status">
            {choice
              ? `Locked in: ${chosenLabel}. You can change it until voting closes.`
              : "Pick one. Nobody sees what you chose."}
          </p>
        </section>
      ) : null}

      {state.state === "tied" ? (
        <p className="mt-6 text-lg text-ink-soft" role="status">
          The room is split. Your leader is choosing which way it goes — look
          up.
        </p>
      ) : null}

      {beat && state.state === "revealing" && result ? (
        <section className="mt-6">
          <p
            data-testid="room-chose"
            className="m-0 font-sans text-sm font-extrabold text-brass-legible"
          >
            The room chose {result.winningChoice.toUpperCase()}
            {result.decidedByLeader ? ", after a tie" : ""}
          </p>
          <Prose
            html={
              beat.choices.find((option) => option.key === result.winningChoice)
                ?.consequence ?? ""
            }
            className="mt-3 text-base leading-snug"
          />
          {choice && choice !== result.winningChoice ? (
            <p className="mt-4 mb-0 text-sm text-ink-soft">
              You chose {choice.toUpperCase()}. Worth saying out loud.
            </p>
          ) : null}
        </section>
      ) : null}

      {state.state === "complete" ? (
        <section className="mt-6">
          <p className="m-0 text-lg">That is the case study.</p>
          <p className="mt-2 mb-0 text-sm text-ink-soft">
            {scenario.closing.scriptureRefs.join(" · ")}
          </p>
          <p className="mt-6 mb-0">
            <Link href={`/me/${groupId}/session/${scenario.sessionNumber}`}>
              Write in your workbook
            </Link>
          </p>
        </section>
      ) : null}

      {refusal ? (
        <p className="mt-4 text-sm text-clay-ink" role="alert">
          {refusal}
        </p>
      ) : null}

      {state.results.length > 0 && state.state !== "revealing" ? (
        <section className="mt-10 border-t border-rule pt-4">
          <h2 className="m-0 font-sans text-xs font-extrabold tracking-[0.08em] text-ink-faint-legible uppercase">
            Earlier beats
          </h2>
          <ol className="m-0 mt-2 list-none p-0">
            {state.results.map((entry) => (
              <li key={entry.beatIndex} className="py-1 text-sm text-ink-soft">
                Beat {entry.beatIndex + 1} — {entry.winningChoice.toUpperCase()}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <p className="mt-10 mb-0 text-sm">
        <Link href={`/me/${groupId}`}>Your workbook</Link>
      </p>
    </div>
  );
}
