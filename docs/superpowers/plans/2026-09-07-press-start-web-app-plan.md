# Press Start — Implementation Plan

**Date:** 2026-09-07
**Design:** [2026-09-07-press-start-web-app-design.md](../specs/2026-09-07-press-start-web-app-design.md)

## How this plan is ordered

Three principles decide the sequence.

**Deployable early, deployable often.** Phase 2 produces a complete, publicly
usable curriculum site with no backend at all. If the project stalled there, the
leader would still have something better than the current file. Every phase after
that adds capability without taking that away.

**Logic before wiring.** The room engine (Phase 5) is built and fully tested as
pure functions and database transactions before a single realtime subscription
exists. The hardest correctness problems in this project — tally tearing, tie
resolution, illegal transitions — are solved where they can be tested
deterministically, not through a browser.

**Content last, except the fixture.** Nine of the ten scenarios are authored at
the end, when the engine that plays them is proven. One is authored early, in
Phase 5, so the engine is developed against real content rather than lorem ipsum.

Phases 2 and 3 are independent and can proceed in parallel. Everything else is a
chain.

---

## Phase 0 — Foundation

Scaffold the application and the guard rails, so nothing after this is written
without tests and CI watching it.

**Tasks**

1. `create-next-app` — Next.js 15, App Router, TypeScript, `strict: true`,
   `noUncheckedIndexedAccess: true`.
2. Tailwind and shadcn/ui.
3. Port design tokens from `press-start-curriculum.html` into the Tailwind theme:
   the violet/brass/teal/clay palette, the `--ink` scale, the shadow, and the
   Fraunces / Karla / IBM Plex Mono stacks. Fonts via `next/font` rather than a
   Google Fonts link, so there is no render-blocking request.
4. ESLint, Prettier, Vitest, Playwright.
5. GitHub Actions: typecheck, lint, unit tests, build. Runs on every pull request.
6. `.env.example` with every variable named and commented.

**Done when** `npm run build`, `npm run test`, and `npm run lint` all pass, and CI
is green on a pull request.

---

## Phase 1 — Content extraction and typing

Get the curriculum out of the HTML file and into typed modules. Nothing visual
depends on a backend, so this unblocks the largest phase.

**Tasks**

1. Zod schemas in `content/schema.ts` for `Session`, `Resource`,
   `CaseBankEntry`, and their nested types (icebreaker, plan steps, teaching
   notes, slides, scripture, cases, discussion, take-home).
2. A one-time extraction script (`scripts/extract-content.ts`) that reads the
   existing HTML, evaluates the `SESSIONS`, `RESOURCES`, and `EXTRA_CASES`
   arrays in an isolated context, and emits typed modules under
   `content/sessions/`.
3. Handle the two places the source is not plain data: `BG(ref)` is a
   BibleGateway URL helper — store the bare reference string and compute the URL
   at render; and slide `body` fields contain HTML fragments — keep them as
   strings, render with a sanitiser, and note them in the schema as trusted
   authored HTML.
4. Extract the leader's handbook prose and the Session 10 worksheet headings.
5. `content:check` script running Zod validation over everything. Wire into CI.
6. Delete the extraction script once its output is committed. It is a migration,
   not a build step.

**Done when** `content:check` passes, and the extracted content contains ten
sessions, six case-bank extras, and every resource group present in the original,
verified by a test asserting those counts.

**Risk:** the extraction may silently drop a field, and a missing teaching note
would not fail schema validation if the field is optional. Mitigate by making
every field the original always populates non-optional in the schema, so absence
is a build failure rather than a blank page discovered in a meeting.

---

## Phase 2 — Prep surface

A complete curriculum site, no auth, no database. Independent of Phase 3.

**Tasks**

1. App shell: the sidebar rail, brand, and navigation, as a route group layout.
2. Session route rendering the six panes — lesson plan, slides, scripture, case
   studies, discussion, take-home — with the tab state in the URL so a leader can
   link to a specific pane.
3. Handbook, case bank, sources, and the printable rule-of-play worksheet.
4. Search across sessions, cases, and handbook content. Client-side over the
   static content index; no server needed.
5. Print stylesheet for the worksheet and the session plan.
6. Static rendering for all of it.

**Done when** all ten sessions render with content matching the original file,
the site deploys to a Vercel preview, and an accessibility audit passes with
keyboard navigation working throughout.

---

## Phase 3 — Identity, groups, and joining

**Tasks**

1. Supabase local development via the CLI; `supabase/migrations/` in the repo.
2. Migration: `profiles`, `groups`, `memberships`, and the `is_member(group_id)`
   security-definer function. RLS on, deny by default, policies per the design.
3. Leader authentication by email magic link.
4. Participant flow: join code entry, display name, anonymous Supabase user.
5. Join-code generation over the 31-character unambiguous alphabet, unique per
   active group, rotatable by the leader.
6. Rate limiting on **failed** join attempts — ten per IP per minute, successes
   uncapped.
7. Email upgrade for participants: attach an identity by magic link, same UUID.
8. Leader group management: create, rename, archive, view roster, rotate code.
9. **RLS test suite** — authenticate as participant A and assert they cannot read
   another group's rows, cannot write to `groups`, and cannot promote themselves.
   Runs in CI against local Supabase.

**Done when** the RLS suite passes, and an end-to-end test creates a group in one
browser context and joins it from another using only a code and a name.

**Risk:** Supabase anonymous users must be enabled and their retention understood
before Phase 4 stores anything against them. Confirm the identity-linking path
preserves the UUID with a test in this phase, not by reading documentation —
every workbook entry depends on it.

---

## Phase 4 — Workbook

**Tasks**

1. Migration: `workbook_entries`, `rule_of_play`, with RLS restricting both to
   the owning participant.
2. Participant workbook: one entry per session per kind (reflection, challenge,
   practice), with debounced autosave and a visible saved state.
3. Rule-of-play editor keyed to the Session 10 worksheet headings, plus the
   one-sentence field and the `shared` flag.
4. A group view of shared rules of play, visible to members only.
5. Leader engagement view: per session, who has written and who has not. Counts
   and names, never bodies.
6. **RLS tests asserting the leader cannot read entry bodies**, including through
   the group view and the engagement view. This is the policy most likely to be
   broken accidentally by a later convenience query, so the test is the
   safeguard.

**Done when** the RLS suite proves both directions — a participant reads their own
entries, a leader reading the same rows gets nothing — and autosave survives a
page reload.

---

## Phase 5 — Room engine, headless

No UI and no realtime in this phase. The goal is a proven engine.

**Tasks**

1. Scenario Zod schema, and **the Session 1 scenario authored as the fixture** —
   real content, derived from "Delete the Library?", so everything below is
   exercised against what will actually ship.
2. Pure functions in `lib/room/machine.ts`: legal transitions, tally resolution,
   tie detection. Exhaustive unit tests, including every illegal transition.
3. Migration: `meetings`, `scenario_runs`, `votes`, `beat_results`, with the
   unique constraint on `(run_id, beat_index, profile_id)` and RLS per the design.
4. `close_vote` as a Postgres function: lock the run row, assert `voting`,
   aggregate, then either write `beat_results` and move to `revealing`, or move to
   `tied` and write nothing.
5. `break_tie` as a Postgres function: take the same lock, assert `tied`, write
   `beat_results` with the leader's choice, move to `revealing`.
6. Integration tests against local Postgres, including the one that matters: a
   vote committing concurrently with `close_vote`, asserting it either counts or
   is rejected, and never produces a tally that disagrees with `beat_results`.
7. `RoomClient` interface, an in-memory fake, and the Supabase implementation.

**Done when** unit and integration tests are green, including the concurrent-vote
test, and a scripted run drives a scenario end to end through the fake with no UI.

**Risk:** this is the phase where being wrong is most expensive, because the
failure appears in front of a room. Budget for it accordingly and do not compress
it to reach the visible phases faster.

---

## Phase 6 — Live surfaces

**Tasks**

1. Presenter view: slides, the countdown timer, and the scenario runner —
   premise, beat situation, choices, live count, reveal, tie prompt. Large type,
   full keyboard control including clicker keys.
2. Participant room view: join, wait, vote, locked-in state, reveal.
3. Realtime wiring — Postgres Changes on `scenario_runs` for state, a broadcast
   channel for aggregate counts, presence for the connected-device count.
4. Server-side broadcast of counts. No client reports its own vote, and no
   per-person choice crosses the wire.
5. Degradation: a persistent banner when realtime is lost; server-rendered state
   on load so a refresh recovers; and an explicit show-of-hands mode when
   Supabase is unreachable, since scenario content is already in the bundle.
6. `prefers-reduced-motion` honoured in reveal transitions.

**Done when** a Playwright test with two browser contexts runs a full beat —
open, vote, close, reveal — and asserts both screens agree; a second test drops
the participant's realtime connection and asserts a refetch converges on the
presenter's state; and a third asserts the show-of-hands fallback renders when the
backend is unreachable.

---

## Phase 7 — The remaining nine scenarios

The largest content item in the project, and the one that decides whether any of
the rest was worth building.

**Tasks**

1. Extend `content:check`: three or four choices per beat, valid session
   reference, scripture references parse, estimated play time at or under twelve
   minutes (140 words per minute read-aloud, plus thirty seconds of voting per
   beat).
2. Author sessions 2 through 10, each derived from its primary case study and
   leader's key.
3. Review each against the two acceptance criteria from the design:
   - every choice's consequence lands the story where the next beat begins;
   - at least two choices per beat are genuinely defensible by a thoughtful
     Christian.
4. Author review pass by the project owner, with revisions.

**Done when** `content:check` passes for all ten, and each scenario has been read
against both criteria and approved.

**Risk:** ten scenarios written in one stretch tend to drift into one voice and
one kind of dilemma. Mitigate by writing them in the curriculum's own order and
re-reading the source case immediately before each, so each scenario inherits its
session's particular question rather than the previous scenario's rhythm.

---

## Phase 8 — Rehearsal and production

**Tasks**

1. Seed script: a demo group with simulated participants, so a leader can
   rehearse an entire scenario alone before running it in front of anyone.
2. Staging and production Supabase projects; CI applies migrations on merge.
3. Vercel production deployment with environment variables documented.
4. Full accessibility pass: screen-reader voting, keyboard presenter, contrast at
   projector distance, reduced motion.
5. A complete rehearsal — one person, one session, start to finish — and fix what
   it surfaces.
6. `README` covering local setup, the one command from clean checkout to running
   application, and how a leader gets started.

**Done when** a fresh clone reaches a running local application in one documented
command, and a full session has been rehearsed end to end against staging.

---

## Critical path

```
0 → 1 → ┬→ 2 ─────────────────────────┐
        └→ 3 → 4 → 5 → 6 → 7 → 8 ─────┘
```

Phase 5 is the schedule risk and Phase 7 is the effort risk. Neither compresses
well. Phases 2 and 4 are the most parallelisable if more than one person is
working.

## What is explicitly not built

Carried from the design, restated so it does not creep back in during
implementation: no in-app content editing, no participant discussion threads, no
notifications beyond magic links, no native applications, no multi-church
administration, no payments, no offline write queue, and alternate cases stay as
prose rather than becoming playable.
