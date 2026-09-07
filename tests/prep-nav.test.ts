import { describe, expect, it } from "vitest";

import { sessions } from "@/content";
import {
  isCurrent,
  navGroups,
  sessionHref,
  sessionPanes,
} from "@/lib/prep-nav";
import { buildSearchIndex, slug } from "@/lib/search-index";

describe("navigation", () => {
  it("lists every session in the rail", () => {
    const group = navGroups.find((candidate) => candidate.label === "Sessions");
    expect(group?.items).toHaveLength(sessions.length);
    expect(group?.items[0]).toMatchObject({
      href: "/sessions/1",
      number: "01",
    });
    expect(group?.items[9]).toMatchObject({
      href: "/sessions/10",
      number: "10",
    });
  });

  it("builds a pane href for each of the six panes", () => {
    expect(sessionPanes).toHaveLength(6);
    expect(sessionHref(3)).toBe("/sessions/3");
    expect(sessionHref(3, "cases")).toBe("/sessions/3/cases");
  });

  it("marks a session current while any of its panes is open", () => {
    expect(isCurrent("/sessions/1", "/sessions/1")).toBe(true);
    expect(isCurrent("/sessions/1", "/sessions/1/cases")).toBe(true);
    expect(isCurrent("/sessions/1", "/sessions/10")).toBe(false);
  });

  it("does not mark the overview current on every page", () => {
    expect(isCurrent("/", "/")).toBe(true);
    expect(isCurrent("/", "/handbook")).toBe(false);
    expect(isCurrent("/", "/sessions/4/slides")).toBe(false);
  });

  it("keeps the case bank distinct from a session's own cases", () => {
    expect(isCurrent("/cases", "/sessions/1/cases")).toBe(false);
    expect(isCurrent("/cases", "/cases")).toBe(true);
  });
});

describe("search index", () => {
  const index = buildSearchIndex();

  it("covers every searchable kind of content", () => {
    const kinds = new Set(index.map((entry) => entry.context.split(" · ")[0]));
    expect(kinds).toContain("Case bank");
    expect(kinds).toContain("Sources");
    expect(kinds).toContain("Glossary");
    expect(kinds).toContain("Handbook");
    expect(
      index.filter((entry) => entry.title.startsWith("Session ")),
    ).toHaveLength(sessions.length);
  });

  it("indexes prose, not only titles", () => {
    const session = index.find(
      (entry) => entry.title === "Session 1: Press Start",
    );
    expect(session?.blob).toContain("marcus");
    expect(session?.blob).toContain("profitable");
  });

  it("lowercases the blob so matching does not have to", () => {
    for (const entry of index) {
      expect(entry.blob).toBe(entry.blob.toLowerCase());
    }
  });

  it("points every hit at a route that exists", () => {
    const known = new Set([
      "/handbook",
      "/cases",
      "/sources",
      ...sessions.map((session) => `/sessions/${session.number}`),
    ]);
    for (const entry of index) {
      expect(known.has(entry.href.split("#")[0] ?? "")).toBe(true);
    }
  });

  it("slugs a heading into an anchor", () => {
    expect(slug("Scripture and study tools")).toBe("scripture-and-study-tools");
    expect(slug("The Nine-Year-Old's Headset")).toBe(
      "the-nine-year-old-s-headset",
    );
  });
});
