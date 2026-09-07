import { type ReactNode } from "react";
import Link from "next/link";

/**
 * The participant's surface: a phone, in a room, with the lights down.
 *
 * One column, large targets, no navigation rail — everything a participant
 * needs here they were told about out loud a moment ago.
 */
export default function PlayLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pt-10 pb-16">
      <header>
        <Link href="/" className="no-underline">
          <span className="font-serif text-2xl font-semibold [font-variation-settings:'SOFT'_20,'WONK'_1]">
            Press Start
          </span>
        </Link>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
    </div>
  );
}
