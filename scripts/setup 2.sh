#!/usr/bin/env bash
#
# From a clean checkout to a running application.
#
#   npm run setup
#
# Everything here is safe to run again: an already-installed node_modules, an
# already-running Supabase, and an existing .env.local are all left alone.
set -euo pipefail

cd "$(dirname "$0")/.."

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

if [ ! -d node_modules ]; then
  say "Installing dependencies"
  npm install
fi

say "Starting Supabase (this needs Docker, and takes a minute the first time)"
npx supabase start

if [ -f .env.local ]; then
  say "Keeping the .env.local you already have"
else
  say "Writing .env.local"
  # Asked for rather than written down: no key belongs in this repository, and
  # the local ones are derived from the JWT secret in supabase/config.toml.
  {
    echo "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000"
    npm run --silent supabase:env
  } >.env.local
fi

if [ ! -d node_modules/.cache/ms-playwright ] && [ ! -d "${HOME}/Library/Caches/ms-playwright" ] && [ ! -d "${HOME}/.cache/ms-playwright" ]; then
  say "Installing the browser Playwright needs"
  npx playwright install chromium
fi

say "Ready"
cat <<'NEXT'
  Curriculum      http://127.0.0.1:3000
  Projector       http://127.0.0.1:3000/present
  Magic links     http://127.0.0.1:54324   (they never leave this machine)

  npm run rehearse    a group of twelve who vote when you open one
  npm run test        unit tests
  npm run test:rls    the security policies, against the database
NEXT

say "Starting the application"
exec npm run dev
