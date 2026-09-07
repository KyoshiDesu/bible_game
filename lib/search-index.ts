import {
  caseBank,
  glossary,
  handbook,
  resourceGroups,
  sessions,
} from "@/content";

import { sessionHref } from "./prep-nav";

export interface SearchEntry {
  /** Where the hit goes. */
  href: string;
  title: string;
  /** What kind of thing it is, shown under the title. */
  context: string;
  /** Everything searchable about the entry, lowercased. */
  blob: string;
}

function blob(...parts: string[]): string {
  return parts.join(" ").toLowerCase();
}

/**
 * The whole curriculum, flattened for search.
 *
 * This is served as a static JSON file rather than bundled, because it is the
 * one artefact in the prep surface that would otherwise put the entire
 * curriculum into every page's JavaScript. The client fetches it on the first
 * keystroke and not before.
 */
export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const session of sessions) {
    entries.push({
      href: sessionHref(session.number),
      title: `Session ${session.number}: ${session.title}`,
      context: session.subtitle,
      blob: blob(
        session.title,
        session.subtitle,
        session.bigIdea,
        session.anchor.ref,
        session.anchor.text,
        session.icebreaker.title,
        session.icebreaker.how,
        ...session.support.map((verse) => `${verse.ref} ${verse.gist}`),
        ...session.teaching.flatMap((note) => [note.heading, ...note.points]),
        ...session.cases.flatMap((study) => [study.title, study.story]),
        ...session.discussion,
      ),
    });
  }

  for (const study of caseBank) {
    entries.push({
      href: `/cases#${slug(study.title)}`,
      title: study.title,
      context: `Case bank · ${study.tagline}`,
      blob: blob(study.title, study.tagline, study.story, ...study.questions),
    });
  }

  for (const group of resourceGroups) {
    for (const item of group.items) {
      entries.push({
        href: `/sources#${slug(group.group)}`,
        title: item.title,
        context: `Sources · ${item.where}`,
        blob: blob(item.title, item.where, item.leanLabel, item.description),
      });
    }
  }

  for (const term of glossary) {
    entries.push({
      href: sessionHref(6),
      title: term.term,
      context: "Glossary · Session 6",
      blob: blob(term.term, term.definition),
    });
  }

  for (const section of handbook) {
    for (const entry of section.entries) {
      entries.push({
        href: `/handbook#${section.key}`,
        title: entry.heading,
        context: `Handbook · ${section.title}`,
        blob: blob(entry.heading, entry.body),
      });
    }
  }

  return entries;
}

/** A stable anchor for a heading, so a search hit can land on it. */
export function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
