# Press Start

_A Semester on Video Games and Faith_ — the curriculum, as an application.

Three surfaces share one set of content: a **prep** site the leader reads
during the week, a **presenter** view that drives the projector during the
meeting, and a **participant** view on a phone for voting and the private
workbook.

Design: [`docs/superpowers/specs/2026-09-07-press-start-web-app-design.md`](docs/superpowers/specs/2026-09-07-press-start-web-app-design.md)
Plan: [`docs/superpowers/plans/2026-09-07-press-start-web-app-plan.md`](docs/superpowers/plans/2026-09-07-press-start-web-app-plan.md)

## Status

**Phase 2 — prep surface.** The leader's site is complete and static: the
overview, ten sessions across six panes each, the handbook, the case bank,
sources, and the printable rule-of-play worksheet, with client-side search over
the whole curriculum. Seventy pages, no auth and no database — phase 3 adds
identity and groups, and phase 6 adds the presenter view that projects the
slides this surface only lays out.

## Getting started

Requires Node 22.

```bash
npm install
cp .env.example .env         # fill in the two NEXT_PUBLIC_SUPABASE_ values
npm run dev
```

Then <http://localhost:3000>.

The application renders without a Supabase project — the prep surface is
static, and the middleware skips session refresh when the variables are
absent. Anything that actually reads or writes throws instead, naming the
variable it wanted.

## Scripts

| Command                 | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Development server                            |
| `npm run build`         | Production build                              |
| `npm run typecheck`     | `tsc --noEmit`                                |
| `npm run lint`          | ESLint                                        |
| `npm run content:check` | Validates `content/` against its schemas      |
| `npm run format`        | Prettier, writing in place                    |
| `npm run test`          | Vitest, once                                  |
| `npm run test:watch`    | Vitest, watching                              |
| `npm run test:e2e`      | Playwright (builds and serves the app itself) |

Playwright needs its browser once: `npx playwright install chromium`.

CI runs typecheck, lint, format check, content validation, unit tests, and
build on every pull request, with end-to-end tests in a second job. The
end-to-end suite includes a content-parity check that asserts every field of
every session reaches the DOM, and an axe pass over one page of each kind.

## Layout

```
app/
  globals.css        the design tokens — the palette lives here, not in components
  fonts.ts           Fraunces, Karla, IBM Plex Mono via next/font
  (prep)/            the leader's surface: overview, sessions, handbook, materials
    sessions/[number]/  a route per pane, so a pane can be linked to
  search-index.json/ the search index, prerendered to a static file
content/             the curriculum as typed data — no React, no formatting
  schema.ts          Zod schemas and the types every surface renders against
  sessions/          one module per session, plus the ordered index
components/prep/     the prep surface's own components
components/ui/       shadcn/ui components
lib/supabase/        client factories: browser, server, and session refresh
lib/                 typed logic; no React, no SQL at the call site
middleware.ts        refreshes the auth token on every rendering request
tests/               unit tests that are not colocated with a module
e2e/                 Playwright specs
docs/                design and plan
```

The presenter (`app/(present)`) and participant (`app/(play)`) route groups
arrive in phases 6 and 3.

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
- Never create a Supabase client at module scope on the server. It carries the
  caller's session, and a shared one would carry it between people.
- Prettier owns formatting, ESLint owns everything else, and `docs/` and
  `.env*` are left alone by both.
