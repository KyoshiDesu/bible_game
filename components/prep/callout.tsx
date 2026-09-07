import { type ReactNode } from "react";

import { cn } from "cn";

const TONES = {
  teal: "border-l-teal bg-teal-lite",
  brass: "border-l-brass bg-brass-lite",
  clay: "border-l-clay bg-clay-lite",
} as const;

interface CalloutProps {
  tone?: keyof typeof TONES;
  className?: string;
  children: ReactNode;
}

export function Callout({ tone = "teal", className, children }: CalloutProps) {
  return (
    <div
      className={cn(
        "my-5 rounded-r-[10px] border-l-4 px-[18px] py-3.5 [&>p]:max-w-[66ch] [&>p+p]:mt-2",
        TONES[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
