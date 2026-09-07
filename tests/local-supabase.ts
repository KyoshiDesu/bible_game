import { execFileSync } from "node:child_process";

/**
 * Where the local Supabase stack is, and the keys to reach it.
 *
 * Nothing here is written down in the repository. The local keys are derived
 * from the JWT secret in `supabase/config.toml` and printed by the CLI, so the
 * suites ask for them at run time rather than carrying a copy that looks, to
 * every secret scanner in the world, exactly like a real service-role key.
 */
export interface LocalSupabase {
  url: string;
  publishableKey: string;
  secretKey: string;
}

const OVERRIDES = [
  "--override-name",
  "api.url=NEXT_PUBLIC_SUPABASE_URL",
  "--override-name",
  "auth.publishable_key=NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "--override-name",
  "auth.secret_key=SUPABASE_SECRET_KEY",
];

let cached: LocalSupabase | undefined;

function fromEnvironment(): LocalSupabase | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishableKey || !secretKey) return undefined;
  return { url, publishableKey, secretKey };
}

function fromCli(): LocalSupabase {
  let output: string;
  try {
    output = execFileSync(
      "npx",
      ["supabase", "status", "-o", "env", ...OVERRIDES],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch {
    throw new Error(
      "No local Supabase. Start one with `npx supabase start`, or set " +
        "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and " +
        "SUPABASE_SECRET_KEY to point somewhere else.",
    );
  }

  const values = new Map<string, string>();
  for (const line of output.split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match?.[1] && match[2] !== undefined) {
      values.set(match[1], match[2].replace(/^"|"$/g, ""));
    }
  }

  const url = values.get("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = values.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const secretKey = values.get("SUPABASE_SECRET_KEY");
  if (!url || !publishableKey || !secretKey) {
    throw new Error(
      "`supabase status` did not report the keys the suites need.",
    );
  }
  return { url, publishableKey, secretKey };
}

export function localSupabase(): LocalSupabase {
  cached ??= fromEnvironment() ?? fromCli();
  return cached;
}
