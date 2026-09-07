// Page-level copy — ledes, callouts, and section headings — lifted verbatim
// from press-start-curriculum.html. Authored prose belongs here rather than
// inside a component.

import type { PageCopy } from "./schema";

export const pages = {
  caseBank: {
    lede: "Twelve additional scenarios, beyond the two attached to each session. Use them when a case doesn't fit your room, when a session runs short, or when something in the group's own life needs a story to talk through at one remove.",
    callout:
      "All cases in this curriculum are composites written for teaching. None describes a real identifiable person. If a case lands too close to someone in the room, name that risk to yourself before you read it aloud — and if it lands on you mid-session, stop and be a pastor rather than a teacher.",
  },
  sources: {
    lede: "Everything below is labelled by what it is, so you can weigh it rather than take it. Reference tools carry no argument. Christian authors have their tradition named. Research sources are here for facts, not for theology.",
    callout:
      "<b>On the word neutral.</b> There is no theology written from nowhere, and a resource list that claims otherwise is misleading you. What this page does instead is label. Where Christians genuinely disagree — loot boxes and gambling, violent content, what the screen-time research actually shows — the entries say so and point you to both sides.",
    closing: {
      heading: "Using a source honestly",
      body: "Three habits worth keeping across the semester. Check a quotation against its own source rather than a quotation site, because attributions circulate faster than they are verified. Say how old a statistic is when you use it, since this field moves quickly and a figure from 2016 describes a different industry. And when you cite research that supports your point, know what the strongest study against it found — if you don't, the first group member who looks it up will discount everything else you said that night.",
    },
  },
  handbook: {
    lede: "Read this once before Session 1. It takes about six minutes and covers the things that go wrong.",
    anchorTableHeading: "Anchor passages at a glance",
  },
  ruleOfPlay: {
    lede: "The closing exercise of Session 10. Print one per person. Ten minutes of silence is the right amount of time — long enough that people stop writing what sounds good and start writing what is true.",
    callout:
      "<b>Tell them three things before they start.</b> Specific beats aspirational. Small beats impressive. Keepable beats either. A rule that says “play less” is not a rule; a rule that says “nothing after 10:30 on a work night” is.",
    worksheetHeading: "My rule of play",
    dated:
      "Written on ______________________ · to be reviewed on ______________________ with ______________________",
    promptsHeading: "Two weeks of daily prompts",
    promptsNote:
      "Optional, for groups that want something between meetings. One question a day, answered in a sentence.",
  },
} satisfies PageCopy;
