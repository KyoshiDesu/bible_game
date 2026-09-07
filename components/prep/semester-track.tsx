import Link from "next/link";

import { overview, sessions } from "@/content";
import { sessionHref, sessionLabel } from "@/lib/prep-nav";

/** The ten sessions as a timeline, with the four units banded underneath. */
export function SemesterTrack() {
  return (
    <div className="relative mt-[30px] mb-2 pt-[26px] pb-1.5">
      <div
        aria-hidden
        className="absolute inset-x-0 top-[47px] hidden h-0.5 bg-gradient-to-r from-brass-lite via-brass to-teal md:block"
      />
      <ol className="relative m-0 grid list-none grid-cols-5 gap-y-2.5 p-0 md:grid-cols-10 md:gap-0">
        {sessions.map((session) => (
          <li key={session.number}>
            <Link
              href={sessionHref(session.number)}
              className="group block text-left text-inherit no-underline"
            >
              <span className="font-mono text-[11px] font-semibold text-brass-legible">
                {sessionLabel(session.number)}
              </span>
              <span className="my-2 block h-[19px] w-[19px] rounded-full border-[2.5px] border-brass bg-surface transition-transform group-hover:scale-135 group-hover:bg-brass md:mt-3" />
              <span className="block pr-2 text-[11.5px] leading-[1.25] text-ink-soft group-hover:text-ink">
                {session.title}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="mt-3.5 hidden grid-cols-10 text-[11px] text-ink-faint-legible md:grid">
        {overview.units.map((unit) => (
          <span
            key={unit.label}
            className="border-t border-rule pt-1.5"
            style={{ gridColumn: `span ${unit.span}` }}
          >
            {unit.label}
          </span>
        ))}
      </div>
    </div>
  );
}
