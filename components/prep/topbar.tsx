"use client";

import { usePathname } from "next/navigation";

import { sessionIndex } from "@/content/session-index";
import { navGroups, sessionPanes } from "@/lib/prep-nav";

function crumbFor(pathname: string): string {
  const session = sessionIndex.find(
    (candidate) =>
      pathname === `/sessions/${candidate.number}` ||
      pathname.startsWith(`/sessions/${candidate.number}/`),
  );

  if (session) {
    const rest = pathname
      .slice(`/sessions/${session.number}`.length)
      .replace(/^\//, "");
    const pane = sessionPanes.find((candidate) => candidate.slug === rest);
    const label = `Session ${session.number} · ${session.title}`;
    return pane && pane.slug !== "" ? `${label} · ${pane.label}` : label;
  }

  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.href === pathname) return item.label;
    }
  }
  return "Press Start";
}

/** Sticky bar over the reading column: where you are, and how to print it. */
export function Topbar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-40 border-b border-rule bg-page/95 backdrop-blur-[8px] print:hidden">
      <div className="mx-auto flex max-w-[860px] items-center gap-3 px-[34px] py-2.5">
        <span className="min-w-0 flex-1 overflow-hidden text-[13px] text-ellipsis whitespace-nowrap text-ink-faint-legible">
          {crumbFor(pathname)}
        </span>
        <button
          type="button"
          className="rounded-lg border border-rule bg-surface px-3 py-1.5 text-[13.5px] font-semibold text-ink shadow-press hover:border-ink-faint"
          onClick={() => window.print()}
        >
          Print this page
        </button>
      </div>
    </div>
  );
}
