// Adapted from Session 2's primary case study, "The Hobby Developer", and its
// leader's key. Bezalel is the text under this one: the first person Scripture
// calls Spirit-filled is a craftsman, and the parents' question is a good
// question badly aimed rather than a faithless one.

import type { Scenario } from "../scenario-schema";

export const session02Scenario = {
  id: "s2-the-hobby-developer",
  sessionNumber: 2,
  caseTitle: "The Hobby Developer",

  premise:
    "Priya is nineteen. Since she was fifteen she has been building small puzzle games, and for the last eleven months she has been building one with two people she met online and has never met anywhere else. She is good at it. Good enough that strangers finish it and write to her about level nine.<br><br>Her parents are devout and proud of her and have started asking, gently and often, when she is going to do something that actually helps people. Her mother has left a nursing prospectus on her desk twice. Neither time did she say anything about it.<br><br>Priya has begun to feel that the hours she loves most are the hours she should be repenting of. She has not told anyone that, including the two people she builds with.<br><br>You are her group. Over the next three weeks, you decide what she does.",

  cast: [
    {
      name: "Priya",
      description:
        "Nineteen. Builds puzzles at weekends and cannot tell whether that is a calling, a hobby, or a way of hiding.",
    },
    {
      name: "Anil",
      description:
        "Her father. Proud of her in a way he says out loud, and frightened for her in a way he does not.",
    },
    {
      name: "Fen",
      description:
        "One of the two she builds with. Eight time zones away, eighteen months of work together, and has never once asked her what any of it is for.",
    },
  ],

  beats: [
    {
      index: 0,
      situation:
        "Sunday lunch, and the plates are still on the table. Her father asks the question he has been circling for a month, and he asks it kindly: <i>what's it for, though?</i> Her mother does not look up.",
      prompt: "What does Priya say to her father?",
      choices: [
        {
          key: "a",
          label: "The truth: she doesn't know what it's for, and she loves it",
          consequence:
            "Her father nods slowly and says, <i>alright</i>, and means about half of it. Nobody says anything for a moment and then her mother asks about the drive home. By Thursday Priya has replayed the conversation eleven times and cannot decide whether she won it.",
          leaderNote:
            "The honest answer, and the one that leaves the question open. Ask whether <b>I don't know and I love it</b> is a Christian sentence. Genesis 1 commissions world-shaping long before there is any temple to build, and Priya has just described that without the vocabulary for it.",
        },
        {
          key: "b",
          label: "Defend it on his terms — a portfolio, a route to a real job",
          consequence:
            "It works. He asks two follow-up questions about salaries and seems easier by the time the plates are cleared. She feels the relief and then, on the stairs, the cost of it: she has just agreed that the work is only worth doing if it turns into something else. By Thursday she has not corrected it.",
          leaderNote:
            "The most effective answer and the one that concedes the argument. Ask what she has just handed over. Most rooms will not notice until you say it: she has accepted her parents' premise that craft is justified by its output, which is the premise Exodus 35 does not share.",
        },
        {
          key: "c",
          label: "Show him the game, right there, on her phone",
          consequence:
            "He takes the phone and holds it at arm's length and does not solve the first puzzle. He does not solve the second one either. Then he laughs, once, genuinely, and hands it back and says he is too old. By Thursday he has not mentioned it again and neither has she.",
          leaderNote:
            "The answer that changes the category — from an argument about vocation to a thing on a table. Ask why she did not think of this first. Usually because she assumed he was asking a question, when he was mostly expressing a fear.",
        },
        {
          key: "d",
          label: "Not much. Say it's just a hobby and let the subject move on",
          consequence:
            "It moves on easily, which is the problem. <i>Just a hobby</i> is the first time she has said it out loud and it turns out to be surprisingly load-bearing: by Wednesday she has skipped two evenings she would have worked, and told herself she was tired. By Thursday she is behind.",
          leaderNote:
            "Not a lie. Ask the group what it cost anyway — a word she used to end a conversation has started doing work on her. This is the session's own claim about repetition arriving early, which is worth pointing at.",
        },
      ],
    },
    {
      index: 1,
      situation:
        "Thursday. Fen sends a build with the last three puzzles in it and a one-line message: <i>store page needs your name by sunday, what do you want on it</i>. The nursing application closes on Friday at five. Her mother has not mentioned it once, which is how Priya knows.",
      prompt: "What does Priya do with the week?",
      choices: [
        {
          key: "a",
          label: "Submit the nursing application, and ask Fen for a fortnight",
          consequence:
            "The application takes ninety minutes and she is relieved when it is gone. Fen replies <i>sure</i> and does not say anything else for six days, which is not like him. By the end of the fortnight the build is finished anyway — the other two did the last three puzzles between them.",
          leaderNote:
            "The sensible answer, and it costs her the thing she was best at. Do not let the room treat that as obviously wrong: keeping a door open at nineteen is not faithlessness. Ask what it costs to be the one who asked for the fortnight, twice.",
        },
        {
          key: "b",
          label: "Let the deadline pass and finish the game",
          consequence:
            "She works four late nights and the last puzzle is the best thing she has made. On Friday at ten past five she feels something she was not expecting, which is not regret exactly but is next to it. By Sunday the page is up with her name on it and her mother has not asked about the application.",
          leaderNote:
            "The brave answer or the reckless one, and the group will split. Push on the detail that her mother did not ask — a thing has been decided in that house without anyone saying anything, which is worth more discussion than the deadline.",
        },
        {
          key: "c",
          label:
            "Submit it, finish the game, and tell nobody she is doing both",
          consequence:
            "She does both and sleeps about five hours a night for nine days. Both are finished on time and both are slightly worse than they would have been. By Sunday nobody has been told anything and she has a place to start nursing and a game with her name on it.",
          leaderNote:
            "The answer most rooms admire and few would advise. Ask what has been protected here — usually the answer is that she has protected everyone else from having to hold the tension, by holding all of it herself.",
        },
        {
          key: "d",
          label: "Ask her parents for one year to try this properly",
          consequence:
            "She asks on Thursday evening and it goes worse than she feared for about ten minutes and better than she hoped after that. Her father says he wants to see the numbers. She does not have numbers. He says, <i>then get some, and we'll talk in a month</i>, which is the first time anyone has treated it as a thing that could be true.",
          leaderNote:
            "The costly answer, and the one that makes her freedom answerable to somebody. Ask the group whether they would actually advise this or only admire it, and what it means that her father's demand for numbers is both a hurdle and a form of taking her seriously.",
        },
      ],
    },
    {
      index: 2,
      situation:
        "Three weeks later. Six hundred and forty people have played it. Priya finds out by accident that her father installed it a fortnight ago, has said nothing, and has been stuck on level nine since Tuesday.",
      prompt: "What does Priya do about that?",
      choices: [
        {
          key: "a",
          label: "Sit down next to him and watch him play it",
          consequence:
            "It takes him nineteen minutes and she says almost nothing and it is one of the hardest nineteen minutes of her life. When he solves it he does not celebrate, he just says <i>oh</i>, very quietly, the way people do when they see how something was built. Neither of them mentions nursing.",
          leaderNote:
            "The best available outcome and it changes nothing about the application. Say so. Groups expect the reconciliation scene to settle the vocational question; this is what it actually does instead, which is smaller and better.",
        },
        {
          key: "b",
          label: "Send him the solution so he can finish it and stop",
          consequence:
            "He thanks her, finishes it that evening, and tells her it was very clever. It is the same sentence he uses about the boy at church who fixes computers. By the following week the game has become a thing she does rather than a thing they have both been inside.",
          leaderNote:
            "Kind, efficient, and it hands back the only shared ground either of them had found. Ask what the difference is between being admired and being joined. Most of the group will recognise the sentence about the boy who fixes computers.",
        },
        {
          key: "c",
          label: "Say nothing and let him come to her when he is ready",
          consequence:
            "He does, eventually — nine days later, in the car, without preamble: <i>is level nine meant to be like that?</i> She says yes. He says <i>right</i>, and then, after a mile, that he does not understand what she does and that he has stopped needing to. It is the nicest thing he has said to her in a year.",
          leaderNote:
            "The slow answer, and the one that lets him arrive rather than be brought. Ask what nine days of silence cost her, and whether the room would have the nerve. Note that he has conceded something without conceding the argument, which is how most fathers do it.",
        },
        {
          key: "d",
          label: "Ask him to be the one who tests the next one before it ships",
          consequence:
            "He says yes immediately, then spends a week worrying that he is not qualified, then produces two pages of notes, four of which are useful and one of which is better than anything the other two testers found. He asks when the next one starts. He has never asked her that before.",
          leaderNote:
            "The most Exodus 35 answer available: the craft acquires a body of people it is answerable to. Ask what Priya gives up here — she has just made her work slower and more accountable, and it is not obvious that is a gain until you have said why it is.",
        },
      ],
    },
  ],

  closing: {
    consequence:
      "Three weeks after the question at the table, Priya has made something six hundred people have finished, a father who has been inside it, and no answer at all about nursing.<br><br>Nothing here decided whether making games is a life. What changed is that the work stopped being a private thing she felt guilty about and became a thing with other people in it — which is the only condition under which anyone can tell whether it is good.<br><br>Whether that counts as an answer is what your group has to decide.",
    scriptureRefs: [
      "Exodus 35:30-35",
      "Genesis 1:27-28",
      "Zechariah 8:5",
      "Proverbs 8:30-31",
    ],
    leaderKey:
      "<b>Where this should land:</b> the two failure modes are a room that tells Priya to follow her heart and a room that tells her to get a real job, and both are available in about ninety seconds. Refuse them the same way.<br><br>Somebody will argue that Bezalel's gifting was for a tabernacle, so craft is only sanctified in religious use. Push back gently — Genesis 1 commissions world-shaping before there is any temple, and Zechariah's healed city has children playing in the streets of it. Then honour the parents out loud: a devout family's worry about a nineteen-year-old's direction is love, badly aimed, not faithlessness. If the group leaves having scored the paths, the beat went badly. If they leave able to say what the parents' question was actually asking, it went well.",
  },
} satisfies Scenario;
