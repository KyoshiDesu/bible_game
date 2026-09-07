import { type ReactNode } from "react";

import { Rail } from "@/components/prep/rail";
import { Topbar } from "@/components/prep/topbar";

/**
 * The leader's prep surface: everything read during the week.
 *
 * No auth, no database, no realtime — every page under here renders statically
 * from `content/`.
 */
export default function PrepLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[274px_minmax(0,1fr)] print:block">
      <a
        href="#main"
        className="sr-only rounded-lg bg-surface px-4 py-2 font-semibold text-ink focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>
      <Rail />
      <div className="min-w-0 pb-24 print:pb-0">
        <Topbar />
        <main
          id="main"
          className="mx-auto max-w-[860px] px-5 pt-8 md:px-[34px] print:max-w-none print:px-0"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
