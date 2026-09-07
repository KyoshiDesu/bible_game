"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { sessionHref, sessionPanes } from "@/lib/prep-nav";

/**
 * The six panes of a session. Each is a route rather than local state, so a
 * leader can send someone a link to the case studies and have them land there.
 */
export function SessionTabs({ number }: { number: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Session sections" className="print:hidden">
      <ul className="m-0 mt-6 mb-1 flex list-none flex-wrap gap-[3px] border-b border-rule p-0">
        {sessionPanes.map((pane) => {
          const href = sessionHref(number, pane.slug || undefined);
          const current = pathname === href;
          return (
            <li key={pane.slug}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`-mb-px block border-b-[3px] px-3.5 py-2.5 text-sm font-semibold no-underline ${
                  current
                    ? "border-b-brass text-ink"
                    : "border-b-transparent text-ink-faint-legible hover:text-ink"
                }`}
              >
                {pane.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
