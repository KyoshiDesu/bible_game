"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isCurrent, navGroups } from "@/lib/prep-nav";

import { Search } from "./search";

/** The violet navigation rail: brand, search, sessions, materials. */
export function Rail() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Curriculum"
      className="top-0 h-auto overflow-y-auto bg-violet-deep py-[22px] pb-10 text-on-violet-soft md:sticky md:h-screen print:hidden"
    >
      <div className="mb-3.5 border-b border-white/10 px-[22px] pb-[18px]">
        <Link href="/" className="text-on-violet no-underline">
          <span className="m-0 mb-1.5 block font-serif text-[27px] leading-[1.05] font-semibold [font-variation-settings:'SOFT'_20,'WONK'_1]">
            Press Start
          </span>
        </Link>
        <p className="m-0 text-[12.5px] leading-[1.45] text-on-violet-dim">
          Video games, technology, and the life of faith — a ten-session small
          group semester.
        </p>
      </div>

      <Search />

      {navGroups.map((group) => (
        <div key={group.label}>
          {/* A label rather than a heading: the rail sits before the page's
              own h1, and three h2s ahead of it would put the outline out of
              order for anyone reading by headings. */}
          <p
            id={`nav-${group.label}`}
            className="px-[18px] pt-3.5 pb-1 font-sans text-[11.5px] font-bold tracking-[0.06em] text-on-violet-faint-legible"
          >
            {group.label}
          </p>
          <ul
            aria-labelledby={`nav-${group.label}`}
            className="m-0 list-none p-0"
          >
            {group.items.map((item) => {
              const current = isCurrent(item.href, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-baseline gap-2.5 border-l-[3px] px-[18px] py-[7px] text-[14.5px] text-on-violet-soft no-underline hover:bg-white/[0.06] hover:text-white ${
                      current
                        ? "border-l-brass bg-brass/15 font-semibold text-on-violet"
                        : "border-l-transparent"
                    }`}
                  >
                    <span className="min-w-[18px] font-mono text-[11.5px] text-brass-on-violet">
                      {item.number ?? ""}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <p className="mt-4 border-t border-white/10 px-[18px] pt-[18px] text-xs text-on-violet-faint-legible">
        Scripture shown inline is the World English Bible (public domain), so
        this page can be copied and printed freely. Swap in your
        congregation&rsquo;s translation before you teach.
      </p>
    </nav>
  );
}
