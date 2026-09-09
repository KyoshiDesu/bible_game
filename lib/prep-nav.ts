import { sessionIndex } from "@/content/session-index";

export interface NavItem {
  href: string;
  label: string;
  /** Zero-padded session number, shown in the rail's mono column. */
  number?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export function sessionHref(number: number, pane?: string): string {
  return pane ? `/sessions/${number}/${pane}` : `/sessions/${number}`;
}

export function sessionLabel(number: number): string {
  return String(number).padStart(2, "0");
}

/**
 * The six panes of a session, each its own route so a leader can send someone a
 * link to the case studies rather than to the session.
 */
export const sessionPanes = [
  { slug: "", label: "Lesson plan" },
  { slug: "slides", label: "Slides" },
  { slug: "scripture", label: "Scripture" },
  { slug: "cases", label: "Case studies" },
  { slug: "discussion", label: "Discussion" },
  { slug: "take-home", label: "Take-home" },
] as const;

export const navGroups: NavGroup[] = [
  {
    label: "Start",
    items: [
      { href: "/", label: "Overview" },
      { href: "/handbook", label: "Leader's handbook" },
    ],
  },
  {
    label: "Sessions",
    items: sessionIndex.map((session) => ({
      href: sessionHref(session.number),
      label: session.title,
      number: sessionLabel(session.number),
    })),
  },
  {
    label: "Materials",
    items: [
      { href: "/cases", label: "Case bank" },
      { href: "/sources", label: "Sources" },
      { href: "/rule-of-play", label: "Rule of play" },
    ],
  },
  {
    label: "Leading",
    items: [
      { href: "/groups", label: "My groups" },
      { href: "/join", label: "Join a group" },
    ],
  },
];

/** True when `href` is the page currently shown, or an ancestor of it. */
export function isCurrent(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
