"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { type Scenario, SECONDS_PER_VOTE } from "@/content/scenario-schema";
import {
  advanceRun,
  breakTie,
  closeVote,
  endMeeting,
  openVote,
  type RoomActionResult,
} from "@/lib/actions/room";
import { type RoomState } from "@/lib/room/client";
import { beatAt } from "@/lib/room/machine";
import { useLiveRoom } from "@/lib/room/use-live-room";
import { Prose } from "@/components/prep/prose";

import { ConnectionBanner } from "./connection-banner";
import { Countdown } from "./countdown";
import { ChoiceRow, TallyBars, choiceLetter } from "./parts";

export interface PresenterProps {
  scenario: Scenario;
  initialState: RoomState;
  meetingId: string;
  groupId: string;
  groupName: string;
  sessionNumber: number;
  /** The denominator for the live count: how many are in the group. */
  memberCount: number;
  presenceKey: string;
}

/** Keys a presentation clicker sends, plus the ones a hand reaches for. */
const FORWARD = new Set(["ArrowRight", "PageDown", "Enter", " ", "n", "N"]);

/**
 * The projector.
 *
 * Everything on this screen comes from the run row, so the projector and every
 * phone in the room are rendering the same answer to the same question. The
 * leader's controls are server actions: they return the state they produced,
 * which is applied directly, so the room moves even when the socket carrying
 * everyone else's updates has died.
 *
 * Leader notes are deliberately absent. `leaderNote` is what the leader should
 * draw out of the room, and this screen is pointed at the room.
 */
export function Presenter({
  scenario,
  initialState,
  meetingId,
  groupId,
  groupName,
  sessionNumber,
  memberCount,
  presenceKey,
}: PresenterProps) {
  const router = useRouter();
  const {
    state,
    connection,
    present,
    voted,
    members,
    refresh,
    refreshing,
    apply,
  } = useLiveRoom(initialState, presenceKey);
  const [pending, startTransition] = useTransition();
  const [refusal, setRefusal] = useState<string | null>(null);
  const [blanked, setBlanked] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const beat = beatAt(scenario, state.currentBeat);
  const result = state.results.find(
    (entry) => entry.beatIndex === state.currentBeat,
  );

  const act = useCallback(
    (run: () => Promise<RoomActionResult>) => {
      startTransition(async () => {
        const outcome = await run();
        if (outcome.ok) {
          apply(outcome.state);
          setRefusal(null);
        } else {
          setRefusal(outcome.reason);
        }
      });
    },
    [apply],
  );

  const forward = useCallback(() => {
    const runId = state.runId;
    if (state.state === "idle") act(() => openVote(runId));
    else if (state.state === "voting") act(() => closeVote(runId));
    else if (state.state === "revealing") act(() => advanceRun(runId));
  }, [act, state.runId, state.state]);

  // The options the room was level on, as written by the same transaction that
  // put the run into `tied`. `break_tie` refuses anything outside this list, so
  // the screen offers exactly what the database will accept.
  const tiedKeys = useMemo(
    () => (state.state === "tied" ? (state.tie?.tied ?? []) : []),
    [state.state, state.tie],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
        return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if (event.key === "Escape") {
        setHelpOpen(false);
        setBlanked(false);
        return;
      }
      if (event.key === "?" || event.key === "h") {
        event.preventDefault();
        setHelpOpen((open) => !open);
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setBlanked((on) => !on);
        return;
      }
      if (blanked) return;

      if (state.state === "tied") {
        const chosen = tiedKeys[Number(event.key) - 1];
        if (chosen) {
          event.preventDefault();
          act(() => breakTie(state.runId, chosen));
          return;
        }
      }
      if (FORWARD.has(event.key)) {
        event.preventDefault();
        forward();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [act, blanked, forward, state.runId, state.state, tiedKeys]);

  if (blanked) {
    return (
      <button
        type="button"
        onClick={() => {
          setBlanked(false);
        }}
        aria-label="Screen blanked. Press B or click to bring it back."
        className="fixed inset-0 z-50 bg-black"
      />
    );
  }

  const primary =
    state.state === "idle"
      ? "Open the first vote"
      : state.state === "voting"
        ? "Close voting"
        : state.state === "revealing"
          ? state.currentBeat + 1 >= scenario.beats.length
            ? "Show where it ended"
            : "Next beat"
          : null;

  return (
    <div className="flex min-h-screen flex-col bg-violet-deep text-on-violet">
      <ConnectionBanner
        connection={connection}
        onRefresh={refresh}
        refreshing={refreshing}
        deckHref={`/deck/${scenario.id}`}
      />

      <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-white/10 px-8 py-4">
        <p className="m-0 font-sans text-sm text-on-violet-faint-legible">
          {groupName}
          <span className="mx-2">·</span>
          Session {String(sessionNumber).padStart(2, "0")}
          <span className="mx-2">·</span>
          {scenario.caseTitle}
        </p>
        <p className="m-0 font-mono text-sm text-on-violet-faint-legible">
          {state.state === "idle" || state.state === "complete"
            ? state.state === "idle"
              ? "Not started"
              : "Finished"
            : `Beat ${state.currentBeat + 1} of ${scenario.beats.length}`}
          <span className="mx-2">·</span>
          <span data-testid="present-here">{present} here</span>
        </p>
      </header>

      <main
        id="main"
        className="flex flex-1 flex-col justify-center px-8 py-8 md:px-16"
      >
        {state.state === "idle" ? (
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

        {beat && (state.state === "voting" || state.state === "tied") ? (
          <section key={`beat-${beat.index}`} className="animate-reveal">
            <Prose
              html={beat.situation}
              className="m-0 max-w-[46ch] text-[clamp(1.4rem,3vw,2.6rem)] leading-tight"
            />
            <p className="mt-6 mb-0 font-sans text-base font-extrabold tracking-[0.06em] text-brass-on-violet uppercase">
              {beat.prompt}
            </p>
            <ul className="m-0 mt-6 grid list-none gap-3 p-0">
              {beat.choices.map((choice) => {
                const position = tiedKeys.indexOf(choice.key);
                return (
                  <ChoiceRow
                    key={choice.key}
                    choice={choice}
                    emphasis={position >= 0 ? "tied" : undefined}
                    trailing={
                      position >= 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            act(() => breakTie(state.runId, choice.key));
                          }}
                          disabled={pending}
                          className="rounded-md border border-brass px-3 py-1 font-sans text-sm font-semibold text-on-violet"
                        >
                          Take this one ({position + 1})
                        </button>
                      ) : null
                    }
                  />
                );
              })}
            </ul>
            {state.state === "tied" ? (
              <>
                {state.tie ? (
                  <TallyBars beat={beat} tally={state.tie.tally} winner="" />
                ) : null}
                <p className="mt-6 mb-0 text-lg text-on-violet-warm">
                  The room is split{" "}
                  {tiedKeys.length > 0
                    ? `between ${tiedKeys.map(choiceLetter).join(" and ")}`
                    : ""}
                  . Pick the one to play out — the disagreement is the
                  interesting part, so name it before you choose.
                </p>
              </>
            ) : null}
          </section>
        ) : null}

        {beat && state.state === "revealing" && result ? (
          <section key={`reveal-${beat.index}`} className="animate-reveal">
            <p
              data-testid="room-chose"
              className="m-0 font-sans text-sm font-extrabold tracking-[0.06em] text-brass-on-violet uppercase"
            >
              The room chose {choiceLetter(result.winningChoice)}
              {result.decidedByLeader ? " — after a tie, you did" : ""}
            </p>
            <Prose
              html={
                beat.choices.find(
                  (choice) => choice.key === result.winningChoice,
                )?.consequence ?? ""
              }
              className="mt-4 max-w-[46ch] text-[clamp(1.3rem,2.8vw,2.4rem)] leading-tight"
            />
            <TallyBars
              beat={beat}
              tally={result.tally}
              winner={result.winningChoice}
            />
          </section>
        ) : null}

        {state.state === "complete" ? (
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

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-8 py-5">
        <div className="flex items-center gap-6">
          {primary ? (
            <button
              type="button"
              onClick={forward}
              disabled={pending}
              className="rounded-lg bg-brass px-6 py-3 font-sans text-lg font-extrabold text-brass-ink-strong disabled:opacity-60"
            >
              {primary}
            </button>
          ) : null}
          {state.state === "complete" ? (
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  await endMeeting(meetingId, groupId);
                  router.push(`/groups/${groupId}`);
                });
              }}
              disabled={pending}
              className="rounded-lg border border-white/25 px-6 py-3 font-sans text-lg font-semibold text-on-violet disabled:opacity-60"
            >
              End the meeting
            </button>
          ) : null}
          {refusal ? (
            <p role="status" className="m-0 max-w-[40ch] text-on-violet-warm">
              {refusal}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-8">
          {state.state === "voting" ? (
            <>
              <p
                className="m-0 font-mono text-2xl text-on-violet tabular-nums"
                data-testid="present-voted"
                aria-live="polite"
              >
                {voted} of {members ?? memberCount} voted
              </p>
              <Countdown
                seconds={SECONDS_PER_VOTE}
                restartKey={`${state.currentBeat}`}
              />
            </>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setHelpOpen((open) => !open);
            }}
            className="font-sans text-sm text-on-violet-faint-legible underline"
            aria-expanded={helpOpen}
          >
            Keys
          </button>
        </div>
      </footer>

      {helpOpen ? (
        <div className="fixed right-8 bottom-24 z-40 max-w-sm rounded-xl border border-white/15 bg-violet-mid px-6 py-5 text-sm text-on-violet-soft shadow-press">
          <h2 className="m-0 font-sans text-sm font-extrabold text-on-violet">
            Driving this from a clicker
          </h2>
          <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="font-mono text-brass-on-violet">→ ⏎ ␣</dt>
            <dd className="m-0">Open, close, then move on</dd>
            <dt className="font-mono text-brass-on-violet">1–4</dt>
            <dd className="m-0">Break a tie with that option</dd>
            <dt className="font-mono text-brass-on-violet">B</dt>
            <dd className="m-0">Blank the screen</dd>
            <dt className="font-mono text-brass-on-violet">?</dt>
            <dd className="m-0">This list</dd>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
