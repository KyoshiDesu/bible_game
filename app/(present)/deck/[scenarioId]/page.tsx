import { notFound } from "next/navigation";
import { type Metadata } from "next";

import { Deck } from "@/components/present/deck";
import { findScenario, scenarios } from "@/content";

/**
 * Every deck is prerendered.
 *
 * That is the whole point of this route: it is the surface that has to work
 * when nothing else does, so it must not depend on a session, a database, or a
 * request. If this page ever needs a cookie, the fallback has stopped being a
 * fallback.
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return scenarios.map((scenario) => ({ scenarioId: scenario.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}): Promise<Metadata> {
  const { scenarioId } = await params;
  const scenario = findScenario(scenarioId);
  return { title: scenario ? `${scenario.caseTitle} — show of hands` : "Deck" };
}

export default async function DeckPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const scenario = findScenario(scenarioId);
  if (!scenario) notFound();

  return <Deck scenario={scenario} />;
}
