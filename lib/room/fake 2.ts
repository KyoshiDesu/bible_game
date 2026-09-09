/**
 * The room, in memory.
 *
 * This is not a mock: it runs the same state machine the database runs, so a
 * scripted session through it exercises the real transition rules. What it does
 * not have is concurrency, which is exactly why the database has its own tests.
 */
import { type Scenario } from "@/content/scenario-schema";

import {
  type BeatResult,
  type RoomClient,
  type RoomController,
  type RoomResult,
  type RoomState,
  type Tie,
  type Unsubscribe,
  type VoteResult,
} from "./client";
import {
  acceptsVote,
  beatAt,
  resolveVotes,
  transition,
  type Run,
} from "./machine";

interface Vote {
  beatIndex: number;
  voter: string;
  choice: string;
}

export class FakeRoom implements RoomClient, RoomController {
  private run: Run = { state: "idle", currentBeat: 0 };
  private tie: Tie | null = null;
  private readonly votes: Vote[] = [];
  private readonly results: BeatResult[] = [];
  private readonly listeners = new Set<(state: RoomState) => void>();

  constructor(
    private readonly scenario: Scenario,
    private readonly runId = "fake-run",
  ) {}

  // --- what a phone sees ----------------------------------------------------

  getState(): Promise<RoomState> {
    return Promise.resolve(this.snapshot());
  }

  subscribe(_runId: string, onChange: (state: RoomState) => void): Unsubscribe {
    this.listeners.add(onChange);
    return () => this.listeners.delete(onChange);
  }

  vote(_runId: string, beatIndex: number, choice: string): Promise<VoteResult> {
    if (!acceptsVote(this.run, beatIndex)) {
      return Promise.resolve({
        ok: false,
        reason: "Voting is not open on that beat.",
      });
    }
    const beat = beatAt(this.scenario, beatIndex);
    if (!beat?.choices.some((candidate) => candidate.key === choice)) {
      return Promise.resolve({
        ok: false,
        reason: "That is not one of the choices.",
      });
    }
    return Promise.resolve({ ok: true });
  }

  /** The fake's own door for a named voter, since there is no session here. */
  voteAs(voter: string, beatIndex: number, choice: string): VoteResult {
    if (!acceptsVote(this.run, beatIndex)) {
      return { ok: false, reason: "Voting is not open on that beat." };
    }
    const beat = beatAt(this.scenario, beatIndex);
    if (!beat?.choices.some((candidate) => candidate.key === choice)) {
      return { ok: false, reason: "That is not one of the choices." };
    }

    const existing = this.votes.find(
      (vote) => vote.beatIndex === beatIndex && vote.voter === voter,
    );
    if (existing) existing.choice = choice;
    else this.votes.push({ beatIndex, voter, choice });
    return { ok: true };
  }

  // --- what the leader drives ----------------------------------------------

  open(): Promise<RoomResult> {
    return Promise.resolve(this.apply({ type: "open" }));
  }

  close(_runId: string, _choiceKeys: readonly string[]): Promise<RoomResult> {
    const beat = beatAt(this.scenario, this.run.currentBeat);
    if (!beat) return Promise.resolve({ ok: false, reason: "No such beat." });

    const resolution = resolveVotes(this.votesFor(this.run.currentBeat), beat);
    // Set before the transition so the tie and the state it explains are
    // announced together, exactly as one database transaction writes them.
    this.tie =
      resolution.kind === "tie"
        ? { tied: [...resolution.tied], tally: resolution.tally }
        : null;

    const applied = this.apply({ type: "close", resolution });
    if (applied.ok && resolution.kind === "winner") {
      this.results.push({
        beatIndex: beat.index,
        winningChoice: resolution.winner,
        tally: resolution.tally,
        decidedByLeader: false,
      });
      this.announce();
    }
    return Promise.resolve(applied.ok ? this.ok() : applied);
  }

  breakTie(
    _runId: string,
    choice: string,
    _choiceKeys: readonly string[],
  ): Promise<RoomResult> {
    const beat = beatAt(this.scenario, this.run.currentBeat);
    if (!beat) return Promise.resolve({ ok: false, reason: "No such beat." });

    const resolution = resolveVotes(this.votesFor(this.run.currentBeat), beat);
    const tied = resolution.kind === "tie" ? resolution.tied : [];
    const applied = this.apply({ type: "breakTie", choice, tied });
    if (!applied.ok) return Promise.resolve(applied);
    this.tie = null;

    this.results.push({
      beatIndex: beat.index,
      winningChoice: choice,
      tally: resolution.tally,
      decidedByLeader: true,
    });
    this.announce();
    return Promise.resolve(this.ok());
  }

  advance(): Promise<RoomResult> {
    this.tie = null;
    return Promise.resolve(this.apply({ type: "advance" }));
  }

  /** The counts the server would broadcast. Aggregates only, as on the wire. */
  liveCount(beatIndex: number): number {
    return this.votesFor(beatIndex).length;
  }

  // --- internals ------------------------------------------------------------

  private votesFor(beatIndex: number): { choiceKey: string }[] {
    return this.votes
      .filter((vote) => vote.beatIndex === beatIndex)
      .map((vote) => ({ choiceKey: vote.choice }));
  }

  private apply(command: Parameters<typeof transition>[1]): RoomResult {
    const result = transition(this.run, command, this.scenario);
    if (!result.ok) return { ok: false, reason: result.message };
    this.run = result.run;
    this.announce();
    return this.ok();
  }

  private ok(): RoomResult {
    return { ok: true, state: this.snapshot() };
  }

  private snapshot(): RoomState {
    return {
      runId: this.runId,
      scenarioId: this.scenario.id,
      state: this.run.state,
      currentBeat: this.run.currentBeat,
      results: [...this.results],
      tie: this.tie,
    };
  }

  private announce(): void {
    const state = this.snapshot();
    for (const listener of this.listeners) listener(state);
  }
}
