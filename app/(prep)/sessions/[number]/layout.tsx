import { type ReactNode } from "react";
import { notFound } from "next/navigation";
import { type Metadata } from "next";

import { Callout } from "@/components/prep/callout";
import { Prose } from "@/components/prep/prose";
import { SessionTabs } from "@/components/prep/session-tabs";
import { findSession, sessions } from "@/content";
import { sessionLabel } from "@/lib/prep-nav";

interface Params {
  params: Promise<{ number: string }>;
}

/** Ten sessions, each with six panes, all prerendered. */
export function generateStaticParams() {
  return sessions.map((session) => ({ number: String(session.number) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { number } = await params;
  const session = findSession(Number(number));
  if (!session) return {};
  return { title: session.title, description: session.subtitle };
}

export default async function SessionLayout({
  children,
  params,
}: Params & { children: ReactNode }) {
  const { number } = await params;
  const session = findSession(Number(number));
  if (!session) notFound();

  return (
    <>
      <div className="mb-1.5 flex items-start gap-4.5">
        <span className="mt-2 rounded-lg bg-violet-mid px-2.5 py-2.5 font-mono text-xs leading-none font-semibold whitespace-nowrap text-on-violet">
          {sessionLabel(session.number)}
        </span>
        <div>
          <h1 className="m-0 mb-2.5 font-serif text-[clamp(30px,4.4vw,44px)] leading-[1.04] font-semibold tracking-[-0.012em] [font-variation-settings:'SOFT'_22,'WONK'_1]">
            {session.title}
          </h1>
          <p className="max-w-[64ch] text-[18.5px] leading-[1.55] text-ink-soft">
            {session.subtitle}
          </p>
        </div>
      </div>

      <ul className="m-0 mt-3.5 mb-1 flex list-none flex-wrap gap-2 p-0">
        <li className="rounded-full border border-rule bg-surface px-2.5 py-1 text-xs text-ink-soft">
          {session.unit}
        </li>
        <li className="rounded-full border border-teal-rule bg-teal-lite px-2.5 py-1 text-xs text-teal">
          40 minutes
        </li>
        <li className="rounded-full border border-brass-rule bg-brass-lite px-2.5 py-1 text-xs text-brass-ink-soft">
          {session.anchor.ref}
        </li>
        <li className="rounded-full border border-rule bg-surface px-2.5 py-1 text-xs text-ink-soft">
          {session.slides.length} slides
        </li>
      </ul>

      <Callout>
        <p className="m-0">
          <b>Big idea.</b> <Prose as="span" html={session.bigIdea} />
        </p>
      </Callout>

      <SessionTabs number={session.number} />

      {children}
    </>
  );
}
