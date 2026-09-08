# Press Start

_A Semester on Video Games and Faith_ — the curriculum, as an application.

Three surfaces share one set of content: a **prep** site the leader reads
during the week, a **presenter** view that drives the projector during the
meeting, and a **participant** view on a phone for voting and the private
workbook.

Design: [`docs/superpowers/specs/2026-09-07-press-start-web-app-design.md`](docs/superpowers/specs/2026-09-07-press-start-web-app-design.md)
Plan: [`docs/superpowers/plans/2026-09-07-press-start-web-app-plan.md`](docs/superpowers/plans/2026-09-07-press-start-web-app-plan.md)

## Status

**Phase 6 — the live surfaces.** The projector and the phone, on top of phase
5's engine. A leader starts a meeting, drives it from a clicker, and the room
votes; state rides Postgres Changes and live counts are broadcast by the
database itself. When the wifi goes, it says so and keeps working: every screen
renders from the database on load, the leader's controls are server actions
rather than socket traffic, and the same case study runs as a show-of-hands
deck that needs no network at all. On top of phase 4's workbook, phase 3's
groups, and phase 2's static curriculum.

## Getting started

Requires Node 22.

```bash
npm install
npm run dev
```

Then <http://localhost:3000>. The curriculum needs nothing else: the prep
surface is static, the middleware skips session refresh when Supabase is not
configured, and anything that reads or writes throws instead, naming the
variable it wanted.

For anything with an account behind it — groups, joining, the workbook — run the
database too. It needs Docker.

```bash
npx supabase start
{ echo "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000"; npm run --silent supabase:env; } > .env.local
npm run test:rls            # the policies, against a real database
```

`.env.local` takes precedence over `.env`, so development points at the local
stack; delete it to go back to a hosted project. No key is written into this
repository — `supabase:env` asks the CLI for them, and the test suites do the
same when the environment does not already say. Magic links do not leave the
machine: read them at <http://127.0.0.1:54324>.

## Scripts

| Command                     | What it does                                                |
| --------------------------- | ----------------------------------------------------------- |
| `npm run dev`               | Development server                                          |
| `npm run build`             | Production build                                            |
| `npm run typecheck`         | `tsc --noEmit`                                              |
| `npm run lint`              | ESLint                                                      |
| `npm run content:check`     | Validates `content/` against its schemas                    |
| `npm run format`            | Prettier, writing in place                                  |
| `npm run test`              | Vitest, once                                                |
| `npm run test:watch`        | Vitest, watching                                            |
| `npm run test:rls`          | Row-level security, against local Supabase                  |
| `npm run test:e2e`          | Playwright (builds and serves the app itself)               |
| `npm run test:e2e:supabase` | Joining, the workbook, and the room, against local Supabase |
| `npm run supabase:env`      | Prints the local stack's settings, for `.env.local`         |

Playwright needs its browser once: `npx playwright install chromium`.

CI runs typecheck, lint, format check, content validation, unit tests, and
build on every pull request; end-to-end tests in a second job; and the
row-level-security suite and the Supabase-backed end-to-end tests in a third,
against a Supabase that job starts itself. The end-to-end suite includes a
content-parity check that asserts every field of every session reaches the DOM,
and an axe pass over one page of each kind — including the projector's own
palette, through the show-of-hands deck, which renders statically and so can be
checked without a database.

## Layout

```
app/
  globals.css        the design tokens — the palette lives here, not in components
  fonts.ts           Fraunces, Karla, IBM Plex Mono via next/font
  (prep)/            the leader's surface: overview, sessions, handbook, materials
    sessions/[number]/  a route per pane, so a pane can be linked to
  search-index.json/ the search index, prerendered to a static file
  (present)/         the projector: one leader, large type, driven by a clicker
    present/[runId]/    a live run
    deck/[scenarioId]/  the same case study on a show of hands, prerendered
  (play)/            the participant's surface: joining, the room, the workbook
    room/[runId]/       a phone during a live scenario
  auth/confirm/      where a magic link lands
content/             the curriculum as typed data — no React, no formatting
  schema.ts          Zod schemas and the types every surface renders against
  sessions/          one module per session, plus the ordered index
  scenarios/         the playable form of a session's case study
components/prep/     the prep surface's own components
components/present/  the projector and the show-of-hands deck
components/play/     the participant's room
components/account/  sign-in, joining, and group management forms
components/workbook/ the autosaving fields and the rule-of-play editor
components/ui/       shadcn/ui components
lib/supabase/        client factories: browser, server, admin, session refresh
lib/db/              typed data access, one module per aggregate
lib/room/            the live session: state machine, transports, the hook
lib/actions/         server actions; typed results, never thrown errors
lib/                 typed logic; no React, no SQL at the call site
supabase/            migrations, local config, and the email templates
middleware.ts        refreshes the auth token on every rendering request
tests/               unit tests that are not colocated with a module
e2e/                 Playwright specs
docs/                design and plan
```

## Hosted projects

Three settings do not travel in `supabase/config.toml` and have to be set in the
dashboard of each hosted project:

- **Anonymous sign-ins on.** The whole participant flow is anonymous users.
- **The two email templates** under Authentication → Emails, matching
  `supabase/templates/`. The stock templates link to Supabase's own verify
  endpoint, which returns tokens in a URL fragment the server never sees.
- **The anonymous sign-in rate limit raised.** The default is 30 per hour per
  IP address, and a group joins from one church wifi address in two minutes.

## The source file

`press-start-curriculum.html` is the original single-file curriculum. Its
content now lives in `content/`, extracted verbatim — every authored string in
those modules appears character-for-character in the HTML. The file stays in
the repository for two reasons: it is the reference the design tokens are
tested against, so `tests/design-tokens.test.ts` fails if the palette in
`app/globals.css` drifts from it; and it is the record the extraction can be
re-derived from.

`content/` is the source of truth from here on. Edit those modules directly.
The extraction was a one-time migration, not a build step, so
`scripts/extract-content.ts` was deleted once its output was committed; it is
in the history of this repository if it is ever needed again.

## Conventions

- TypeScript is strict, with `noUncheckedIndexedAccess`. An index access is
  possibly-undefined and the code has to say what it does about that.
- Colour, type, and shadow come from tokens in `app/globals.css`. A hex code in
  a component is a bug.
- Three ported tokens — `--ink-faint`, `--brass`, `--on-violet-faint` — do not
  reach WCAG AA as text at the sizes this curriculum sets small print. They are
  left exactly as the original authored them and are used for rules, borders,
  the focus ring, and the semester-track gradient, where the 3:1 non-text
  threshold applies and they pass. Text uses the `-legible` siblings and
  `--brass-on-violet` instead. `tests/contrast.test.ts` holds the ratios;
  `e2e/prep-a11y.spec.ts` runs axe over the rendered pages.
- Every page under `app/(prep)` renders statically. Search reads a prerendered
  `/search-index.json` fetched on the first keystroke, rather than bundling the
  curriculum into every page's JavaScript.
- Dark mode is deliberately not implemented. The curriculum has one palette;
  the presenter view gets its dark surfaces from the violet tokens.
- Import Radix primitives from their own packages (`@radix-ui/react-slot`),
  never from the `radix-ui` umbrella. The umbrella does not tree-shake: one
  button imported through it costs 77 kB of first-load JavaScript instead of
  120 B. Components generated by `npx shadcn add` use the umbrella and need
  the import rewritten.
- Curriculum prose carries a little authored markup, and it is rendered as
  HTML. `lib/trusted-html.ts` holds the allowlist — eight tags, `class` on
  `div` only — and `content:check` runs it over every prose field, so a
  fragment outside the allowlist fails the build rather than reaching a
  browser. Widening that list is a decision, not a convenience.
- Scripture references are stored bare, and the lookup URL is computed at
  render by `lib/bible-gateway.ts`. The reference stays readable, stays
  searchable, and is not tied to one Bible site.
- Row-level security is on for every table and denies by default, so a table
  with no matching policy is unreadable rather than public. Four conventions
  hold it together, and each is there because the obvious alternative fails
  quietly:
  - Write `(select auth.uid())`, never bare `auth.uid()`. Postgres evaluates
    the bare call once per row.
  - Never write `auth.role() = 'authenticated'`. Anonymous participants carry
    the `authenticated` role exactly like a signed-in leader, so that test
    passes for everyone. Name an owner or a membership; use
    `private.is_identified()` when a leader is genuinely required.
  - Helpers that a policy needs live in the `private` schema, which is not
    exposed through the Data API. A policy may call them; the role holding the
    session may not.
  - A `GRANT` is a separate gate from a policy. Without one, PostgREST refuses
    a request before any policy is consulted.
- `insert ... returning` runs the SELECT policy against the new row, and
  Postgres reports the refusal as a `WITH CHECK` violation. If an insert fails
  for no reason you can see, check whether the writer can read what they wrote.
- Route handlers that sign someone in must write cookies onto the response they
  return, not through the request-scoped store, and must redirect with a
  relative path — `request.nextUrl` reports the canonical host rather than the
  one the browser used, and a cookie set for one host is not sent to the other.
- Two policies in `supabase/migrations/` are pastoral decisions rather than
  technical ones, and the migration says so at the top of the file. A
  participant reads only their own workbook entries, and **the leader cannot
  read a body at all** — not through the table, not through a join from the
  roster, not through the engagement view, which is a `SECURITY DEFINER`
  function returning counts and names and nothing else. `tests/rls/workbook.test.ts`
  holds both to it, and `e2e/workbook.spec.ts` searches the rendered engagement
  page for the words a participant actually wrote. Widening either is a change
  to that migration, not a convenience query somewhere else.
- The database is authoritative for a live session, not the leader's laptop.
  Every screen renders from the `scenario_runs` row, and every transition goes
  through a function that takes the row lock before it looks at anything. The
  same rules exist twice on purpose: as pure functions in `lib/room/machine.ts`,
  where every illegal transition is enumerated in a test, and in SQL, where two
  requests can arrive at once.
- A vote is written by `cast_vote`, never by an insert. The function takes a
  shared lock on the run first, so a vote arriving mid-close either lands before
  the tally is taken or is refused after it — there is no outcome where a vote
  exists but is missing from what the room was shown.
- Scenario content stays in the repository, so the database functions do not
  know what a beat contains. Choice keys and beat counts are parameters, and the
  functions verify what they can rather than pretending to know the rest.
- Two realtime channels, deliberately different in reliability. State rides
  Postgres Changes on `scenario_runs` and `beat_results`, and a message on it is
  a **nudge to refetch, never the new state**: a screen that renders a payload
  it received is a screen that disagrees with every other screen the moment one
  message goes missing. Live vote counts ride a private broadcast topic and are
  best effort — losing them costs a number, not the meeting.
- Counts are written by a database trigger, and `realtime.messages` has a read
  policy for the counts topic and no write policy at all. No client can put a
  number on the projector. Presence is the exception and lives on its own topic,
  because Realtime authorises presence as a write — announcing that you are here
  is saying something — so members may write there and nothing listens for
  broadcast events on it.
- The socket needs the caller's token before either channel joins, not after.
  `realtime.setAuth()` is awaited in `lib/room/use-live-room.ts`; subscribing
  first joins as nobody, the private channel is refused, and the room silently
  hears nothing at all.
- Leader controls and votes are server actions, not calls from the browser to
  Supabase. That is what makes a dead socket survivable: an action is an
  ordinary request to the application, so the meeting can be driven the whole
  way through with the "live updates have stopped" banner on screen.
- The degradation ladder, in order, and each rung is tested: realtime dies →
  banner, and controls still work; the page is reloaded → the database is
  authoritative and the screen is correct again; the network is gone entirely →
  `/deck/[scenarioId]` is prerendered, imports nothing from Supabase, and runs
  the same case study on a show of hands. The middleware gives its token refresh
  a four-second deadline and swallows a failure, so a hall with associated wifi
  and no internet cannot hang the pages that need no network.
- Never create a Supabase client at module scope on the server. It carries the
  caller's session, and a shared one would carry it between people.
- Prettier owns formatting, ESLint owns everything else, and `docs/` and
  `.env*` are left alone by both.
