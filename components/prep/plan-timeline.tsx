import { type PlanStep } from "@/content";

import { Prose } from "./prose";

interface PlanTimelineProps {
  steps: readonly PlanStep[];
}

/** The forty minutes, as a timeline: clock, heading, script, and prompts. */
export function PlanTimeline({ steps }: PlanTimelineProps) {
  return (
    <ol className="my-4 list-none p-0">
      {steps.map((step) => (
        <li
          key={step.clock}
          className="grid break-inside-avoid grid-cols-[78px_1fr] gap-4 border-t border-rule py-4"
        >
          <div className="pt-0.5 font-mono text-[12.5px] font-semibold text-teal">
            {step.clock}
            <span className="mt-[3px] block text-[11px] text-ink-faint-legible">
              {step.minutes} min
            </span>
          </div>
          <div>
            <h4 className="m-0 mb-1 text-[15.5px] font-extrabold">
              {step.heading}
            </h4>
            <Prose
              className="mt-2 mb-0 rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-ink-soft [&_b]:text-ink"
              html={step.script}
            />
            {step.bullets.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-[14.5px]">
                {step.bullets.map((bullet) => (
                  <li key={bullet} className="py-[3px]">
                    <Prose as="span" html={bullet} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
