"use client";

import { useEffect, useState } from "react";

/**
 * The voting clock.
 *
 * Advisory, and deliberately so: it reaches zero and stops rather than closing
 * the vote. A room where three people are still reading is a room the leader
 * should be looking at, not a timer. Thirty seconds is what the play-time
 * estimate budgets per beat, so this is also the thing that keeps a twelve
 * minute case study twelve minutes long.
 */
export function Countdown({
  seconds,
  restartKey,
}: {
  seconds: number;
  /** Changing this starts the clock again — a new beat, a reopened vote. */
  restartKey: string;
}) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const timer = setInterval(() => {
      setRemaining((value) => (value <= 0 ? 0 : value - 1));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [seconds, restartKey]);

  const spent = seconds === 0 ? 1 : 1 - remaining / seconds;

  return (
    <div className="flex items-center gap-3">
      <span
        className="font-mono text-3xl text-on-violet tabular-nums"
        role="timer"
        aria-live="off"
      >
        {String(Math.floor(remaining / 60)).padStart(2, "0")}:
        {String(remaining % 60).padStart(2, "0")}
      </span>
      <span
        aria-hidden
        className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10"
      >
        <span
          className="block h-full rounded-full bg-brass transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
          style={{ width: `${Math.round(spent * 100)}%` }}
        />
      </span>
    </div>
  );
}
