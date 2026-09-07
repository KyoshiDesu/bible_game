// Overview copy, lifted verbatim from the landing view of
// press-start-curriculum.html. It is curriculum prose, so it lives here
// rather than inside a component.

import type { Overview } from "./schema";

export const overview = {
  lede: "Ten sessions on what video games are doing to our faith — and what our faith has to say back. Twice a month, forty minutes each. Everything you need to teach is on this page.",
  units: [
    {
      span: 3,
      label: "Foundations · what games are",
    },
    {
      span: 3,
      label: "Formation · what they do to us",
    },
    {
      span: 2,
      label: "Content and character",
    },
    {
      span: 2,
      label: "Community and mission",
    },
  ],
  argument: {
    heading: "The argument of the semester",
    body: "The series moves in one direction, and each unit depends on the one before it. Unit One establishes that making, playing and building tools are goods rooted in creation — so that the critique which follows is not suspicion dressed up as holiness. Unit Two turns to formation: what a thousand hours a year actually trains, why rest and escape are different things, and how compulsion is engineered rather than accidental. Unit Three narrows to content and character. Unit Four widens back out to other people, and ends with each member writing a rule they can keep.",
  },
  protect:
    "<b>The one thing to protect:</b> this is not a series about quitting. If the group finishes feeling only guilt, it has failed. If it finishes having changed nothing, it has also failed. The target is a group that can name what their play is forming in them and has decided, out loud, what to do about it.",
  shape: {
    heading: "How the forty minutes are spent",
    rows: [
      {
        minutes: "0:00–0:05",
        segment: "Welcome and icebreaker",
        purpose:
          "Every session opens with an activity tied to that night's idea, not a generic warm-up.",
      },
      {
        minutes: "0:05–0:08",
        segment: "Anchor reading and prayer",
        purpose:
          "The passage is read before it is explained. One observation from the room first.",
      },
      {
        minutes: "0:08–0:18",
        segment: "Teaching",
        purpose: "Three points. Slides are provided but optional.",
      },
      {
        minutes: "0:18–0:30",
        segment: "Case study",
        purpose: "The centre of the session. Two cases are supplied; use one.",
      },
      {
        minutes: "0:30–0:36",
        segment: "Application",
        purpose: "Something written, decided, or assigned. Never merely felt.",
      },
      {
        minutes: "0:36–0:40",
        segment: "Close and preview",
        purpose: "Prayer, and a hook into the next session.",
      },
    ],
    note: "Session 10 shifts the balance — shorter teaching, ten silent minutes for writing a rule of play, and a closing commission.",
  },
  startHere: {
    heading: "Start here",
    cards: [
      {
        heading: "New to leading this",
        body: "Read the leader's handbook first — it covers ground rules, timing, what will surface pastorally, and how to cut the series to eight sessions.",
        linkHref: "/handbook",
        linkLabel: "Open the handbook",
      },
      {
        heading: "Preparing tonight's session",
        body: "Open the session, read the plan, skim the leader's key on the case study, and start the timer when people sit down. Twenty minutes of preparation is enough.",
        linkHref: "/sessions/1",
        linkLabel: "Go to Session 1",
      },
    ],
  },
} satisfies Overview;
