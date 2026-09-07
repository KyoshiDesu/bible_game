# Press Start — Web Application Design

**Date:** 2026-09-07
**Status:** Approved for planning

## Summary

Rebuild *Press Start — A Semester on Video Games and Faith* as a deployable web
application. The existing single-file HTML curriculum becomes a Next.js
application with two roles, persistent workbooks, and a live in-session game
layer: each session's primary case study becomes a scenario the group plays
together, voting from their phones while the leader drives the projector.

The curriculum content already exists and is good. This project does not rewrite
it. It gives the content a delivery mechanism, adds what the content cannot do on
its own — persistence and shared live play — and ships something a leader can
actually run on a Tuesday night.

## Goals

- A leader can prepare a session in twenty minutes and run it from a projector.
- Fifteen participants can join a group in under a minute, with no email.
- The group plays a case study together, live, and the split in the room becomes
  the discussion rather than being hidden by it.
- Participants keep a private workbook across the semester and write a rule of
  play that survives past the last meeting.
- The whole thing deploys from a clean checkout with one documented command.

## Non-goals

Deliberately excluded from v1. Each is a real feature; none is needed to run a
semester.

- In-app editing of curriculum content (no CMS).
- Discussion threads between participants between meetings.
- Notifications beyond authentication magic links.
- Native mobile applications.
- Multi-church administration, organisations, or payments.
- An offline write queue — participants need connectivity to vote.
- Playable alternate cases. Alternates and the six case-bank extras stay as
  prose the leader reads aloud.

## Stack

- **Next.js 15**, App Router, TypeScript in strict mode
- **Tailwind CSS** with **shadcn/ui**
- **Supabase** — Postgres, Auth, Realtime
- **Vercel** hosting, preview deployment per pull request
- **Vitest** for unit tests, **Playwright** for end-to-end
- **Zod** for content validation

The existing visual identity carries over: Fraunces, Karla, and IBM Plex Mono;
the violet, brass, and teal palette. That design already fits the subject and
does not need reinventing.

## Architecture

### Three surfaces

**Leader prep** (`app/(prep)`) — handbook, session plans, teaching notes, case
bank, sources. Read-heavy, server-rendered, no realtime. Substantially the
current HTML rebuilt as pages.

**Presenter** (`app/(present)`) — what appears on the projector during a meeting.
Slides, countdown timer, and the live scenario with its vote tally. Full screen,
fully keyboard-driven, one leader.

**Participant** (`app/(play)`) — a phone. Join by code, vote during scenarios,
then the workbook: reflections, take-home challenges, and the rule of play.

### Module boundaries

- `content/` — pure data and Zod schemas. No React, no database, no network.
  Importable by anything, including tests and scripts.
- `lib/db/` — typed data access, one module per aggregate (groups, meetings,
  workbook). Callers never write SQL.
- `lib/room/` — the live session protocol behind a `RoomClient` interface that
  does not name Supabase. This is the component most likely to need replacing,
  so it is the one most worth isolating.
- `app/(prep)`, `app/(present)`, `app/(play)` — route groups matching the three
  surfaces, each with its own layout.

UI components take props and render. Logic that can be a pure function is a pure
function in `lib/`, because that is what makes it testable without a network.

### Content lives in the repository

Curriculum and scenarios ship as typed TypeScript modules under `content/`,
validated by Zod at build time. They are not in the database.

Curriculum changes are authorship, not operations. They belong in version control
where they can be reviewed in a pull request and rolled back, rather than in a
content management system somebody has to build, secure, and maintain. The
database holds only what *happens*: groups, meetings, votes, and what
participants write.

This also makes migration cheap. The existing HTML already stores its curriculum
as plain JavaScript objects (`SESSIONS`, `RESOURCES`, `EXTRA_CASES`), so
extraction is a one-time script rather than a retyping job, and the content is
correct on day one.

## Data model

Nine tables. Schema ships as Supabase CLI migrations in `supabase/migrations/`,
checked into the repository and applied by CI, so a fresh environment is one
command.

```
profiles          id → auth.users, display_name
groups            id, name, leader_id, join_code (unique), archived_at
memberships       group_id, profile_id, role, unique(group_id, profile_id)
meetings          group_id, session_number, status, started_at, ended_at
scenario_runs     meeting_id, scenario_id, current_beat, state
votes             run_id, beat_index, profile_id, choice_key,
                  unique(run_id, beat_index, profile_id)
beat_results      run_id, beat_index, winning_choice, tally jsonb, decided_at
workbook_entries  profile_id, group_id, session_number, kind, body, updated_at
rule_of_play      profile_id, group_id, sections jsonb, one_sentence, shared
```

Enumerated values:

- `memberships.role` — `leader` | `participant`
- `meetings.status` — `scheduled` | `live` | `ended`
- `scenario_runs.state` — `idle` | `voting` | `tied` | `revealing` | `complete`
- `workbook_entries.kind` — `reflection` | `challenge` | `practice`, matching the
  three take-home cards each session already carries, with one row per
  (participant, group, session, kind)
- `rule_of_play.sections` — keyed by the headings on the existing Session 10
  worksheet, so the printable and the digital version stay the same document

### Identity and joining

Supabase `auth.users` backs everyone.

A leader signs up by email magic link. A participant enters a six-character join
code and a display name, and is issued an **anonymous** Supabase user — a real
UUID with no email attached. When they later attach an email by magic link, the
UUID does not change, so every reflection they have written carries over without
a data migration. That mechanism is what makes "join with a code now, keep it
forever later" a property of the schema rather than a promise it cannot keep.

Join codes use a six-character alphabet with visually ambiguous characters
removed (no `0`, `O`, `1`, `I`, `L`), are unique per active group, and can be
rotated by the leader.

**Failed** join attempts are rate-limited to ten per IP address per minute;
successful joins are not limited at all. The distinction matters: a whole group
arriving together sits behind one church wifi address, and a limit on total
attempts would lock out the back half of the room. Limiting only failures leaves
legitimate joining untouched while making code guessing impractical — which,
against roughly 887 million combinations from the six-character alphabet, it
already is.

### Design decisions

**Role lives on membership, not on profile.** The same person can lead a Tuesday
group and sit in a Thursday one. Putting `role` on the person would make that a
lie the application has to work around later.

**Tallies are persisted, not computed.** `beat_results` stores the winning choice
and the full tally at the moment the leader closes voting. Recomputing from
`votes` at read time would let a vote arriving a half-second late silently change
what the room already saw on screen. Freezing the result at close makes the
projector, the phones, and the leader's post-meeting recap agree permanently.

**A meeting is a row, not a flag.** `meetings` records each time a group actually
meets on a session, so a group can re-run a session and both runs are kept.

## Security

Row-level security is on for every table and denies by default. One
`is_member(group_id)` security-definer function carries most of the load.

Two policies are pastoral decisions rather than technical ones, and are recorded
here because they must not be quietly reversed later.

**Participants can read only their own votes.** The tally reaches the room
through `beat_results`, never through raw vote rows. Nobody can query who voted
for the option that lost.

**The leader cannot read workbook entries.** This is a curriculum where people
write about spending, compulsion, and anger — Session 6 is about four hundred
dollars and Session 4 is about a short fuse. The leader sees *that* a participant
has written, never *what* they wrote. Engagement is visible; content is not.

Rule-of-play entries are private on the same terms, with an explicit `shared`
flag a participant can set to let their group read theirs. Session 10 works
better when some people volunteer.

Policy summary:

| Table | Read | Write |
| --- | --- | --- |
| `groups`, `memberships`, `meetings` | members | leader |
| `scenario_runs` | members | leader |
| `votes` | own row only | own row, only while the run is `voting` |
| `beat_results` | members | server, on vote close |
| `workbook_entries` | own row only | own row |
| `rule_of_play` | own row, or members when `shared` | own row |

## The live session room

### Authority

The database is authoritative, not the leader's laptop. A `scenario_runs` row
holds `current_beat` and `state`. Leader controls are server actions that write
to that row, and every screen in the building — including the leader's own —
renders from what the row says. This is what prevents the projector being on beat
three while half the phones are still on beat two.

### State machine

```
idle → voting → revealing → voting → … → complete
              ↘ tied ↗
```

Transitions are guarded server-side by both "is the leader of this group" and "is
this transition legal from the current state," so a double-tap or a stale second
tab is rejected rather than applied.

### Transport

Two channels, deliberately different in reliability.

**State transitions** ride Postgres Changes on `scenario_runs`. They are derived
from committed data, so a client that reconnects and refetches gets the identical
answer.

**Live vote counts** ride a broadcast channel and are best-effort. "12 of 15
voted" being a half-second stale costs nothing, and sending every vote through
the reliable path would be slower and buy nothing.

Counts are broadcast **by the server**, and only ever as aggregates. No client is
trusted to report its own vote, and no per-person choice crosses the wire — the
same privacy line as the schema, enforced at the transport.

Realtime presence is enabled so the projector can show how many devices are
connected. A leader should not close voting while a phone is reconnecting.

### Closing a vote

One transaction, with a row lock:

```
begin
  select … from scenario_runs where id = $1 for update
  assert state = 'voting'
  aggregate votes for (run_id, beat_index) → tally

  if a single choice has the maximum count:
      insert into beat_results (winning_choice = that choice, tally)
      update scenario_runs set state = 'revealing'
  else:
      update scenario_runs set state = 'tied'
      -- no beat_results row yet; the tally is re-read from votes for display
commit
```

A tie writes no `beat_results` row. When the leader breaks the tie, a second
transaction takes the same lock, asserts `state = 'tied'`, writes
`beat_results` with the leader's chosen winner and the tally, and moves the run
to `revealing`. `beat_results` therefore always holds exactly one row per
resolved beat, whether it was resolved by vote or by the leader.

Votes arriving mid-close either land before the aggregate or are rejected by the
state check after it. There is no window in which the tally can tear.

### Ties

A room of twelve splitting evenly across four choices is not an edge case. On a
tie the run enters `tied`, the projector shows the tied options, and the leader
picks one to proceed. A split room is the most interesting thing that can happen
in a case study — Session 7's primary case is called "The Split" — so the design
hands it to the leader as a moment rather than resolving it silently.

### Reconnection and late joiners

No replay log is needed. State is in the database and results are frozen once
written, so a phone that drops and returns refetches the run and its
`beat_results` and renders from scratch, identical to the projector. A late
joiner takes the same path: current state, voting if the current beat is open,
and previous beats' results visible.

### Degradation

Church halls have bad wifi, and the meeting does not stop for an outage.

The presenter view server-renders its state on load, so a leader whose realtime
connection has died can still drive the session by refreshing — degraded but
working. If Supabase is unreachable entirely, the application says so plainly and
offers the scenario as a plain deck for a show of hands, since all scenario
content is static and already in the bundle. It never hangs on a spinner while a
room waits.

### Isolation

All of the above sits behind a small interface:

```ts
interface RoomClient {
  getState(runId: string): Promise<RunState>
  subscribe(runId: string, onChange: (s: RunState) => void): Unsubscribe
  vote(runId: string, beat: number, choice: string): Promise<VoteResult>
}
```

with a Supabase implementation and an in-memory fake, so room logic is testable
without a network and the transport is replaceable without touching a component.

## Content model

Sessions, resources, and the case bank keep their current shape, extracted from
the existing file and typed. Scenarios are the new type:

```ts
Scenario {
  id: string                    // e.g. 's4-primary'
  sessionNumber: number
  caseTitle: string
  premise: string               // on the projector before beat 1
  cast: { name: string; description: string }[]
  beats: Beat[]                 // 3–4
  closing: {
    consequence: string
    scriptureRefs: string[]
    leaderKey: string
  }
}

Beat   { index: number; situation: string; prompt: string; choices: Choice[] }
Choice { key: string; label: string; consequence: string; leaderNote: string }
```

`label` is what appears on a phone, short enough to read while twelve people
wait. `consequence` is revealed on the projector after the vote closes.
`leaderNote` never renders on the projector; it is what the leader should draw
out, and it is what makes a scenario preparable in the twenty minutes the
handbook promises.

Every beat has three or four choices.

### Authoring rules

**Converging structure.** Every choice's consequence must land the story in the
same place the next beat begins from. Paths differ in what they cost and what
they reveal about the character, not in where they arrive. This constraint is
what keeps a single leader's key valid for every group that plays.

**At least two defensible choices per beat.** This is the rule that decides
whether the whole mechanic works. If one option is obviously right, the vote is a
quiz, the room learns nothing, and the discussion afterwards is dead air. At
every beat, at least two choices must be genuinely defensible by a thoughtful
Christian. The existing cases already work this way — "The Split" puts the
disagreement inside the room, "Four Hundred Dollars" tangles four questions on
purpose — so the source material supports it. It is the acceptance criterion for
each authored scenario.

**Derived, not invented.** Each scenario is adapted from its session's existing
primary case study and leader's key, so the theology and the session's discussion
questions still land after the game is played.

### Scope

Ten scenarios ship: the primary case for each of the ten sessions. Alternate
cases and the six case-bank extras remain prose.

### Validation

A `content:check` script runs in CI and fails the build on:

- Zod schema violations
- a scenario referencing a session number that does not exist
- malformed scripture references
- a beat with fewer than three or more than four choices
- estimated play time over twelve minutes

The last check matters more than it sounds. The curriculum is built on forty
tightly-spent minutes, and the case study is one part of them; twelve minutes is
the budget a scenario has to fit inside. The estimate is derived from projected
word count at 140 words per minute of read-aloud, plus thirty seconds of voting
per beat. It is crude, but it catches the drift.

## Error handling

Failure is visible, never silent. A projector showing stale state confidently is
worse than one showing an error.

- Lost realtime raises a persistent banner on the presenter view rather than
  drifting quietly out of sync.
- Leader actions are server actions returning typed results rather than throwing,
  so "voting is already closed" reads as a message, not a crash.
- Join failures distinguish an unknown code from an archived group.
- A vote arriving after close tells the participant that voting has closed.
- Content that fails validation fails the build, not the meeting.

## Testing

Weighted toward the parts that can hurt a live session.

**Unit (Vitest).** The state machine and tally resolution are pure functions of
state and input, tested without a database. This is the reason they are isolated.
Also covers join-code generation, play-time estimation, and content schema
parsing.

**Integration (local Supabase via CLI).** The close-vote transaction against real
Postgres, because row locking is the entire point and a mock would test nothing.

**Row-level security suite.** Authenticate as participant A and assert they
cannot read B's workbook entries, cannot read raw votes, and cannot write to
`scenario_runs`. These are security claims, and a claim without a test is a hope.
They run in CI.

**End-to-end (Playwright).** The one flow that matters: two browser contexts,
leader and participant, through a full beat — open, vote, close — asserting both
screens show the same result. Plus a reconnection test that drops the
participant's realtime and asserts a refetch converges on the projector's state.

Exhaustive component tests are not written; they would cost more than they catch.

## Accessibility

The existing file already handles focus-visible styling and semantic headings
properly, and that carries over.

- The presenter view adds the read-at-distance case: large type, high contrast.
- The presenter view is fully keyboard-driven, because leaders use clickers.
- Voting works one-thumbed and with a screen reader.
- Reveal animations respect `prefers-reduced-motion`.

## Deployment

- Vercel, with a preview deployment per pull request.
- Two Supabase projects: staging and production.
- Migrations applied by CI on merge to the default branch.
- All environment variables documented in `.env.example`.
- A seed script creating a demo group with simulated participants, so a leader
  can rehearse a whole scenario alone at their kitchen table before running it in
  front of anyone. That is the difference between a leader who trusts the
  application and one who does not.

Prep pages are statically rendered or incrementally regenerated, so they cost
close to nothing to serve. Realtime is used only during meetings. The Supabase
free tier is adequate for a small number of concurrent groups; the first
constraint to watch is concurrent realtime connections during overlapping
meetings.

## Open decisions deferred to implementation

None. Every decision needed to write an implementation plan is recorded above.
