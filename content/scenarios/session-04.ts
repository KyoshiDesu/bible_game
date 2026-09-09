// Adapted from Session 4's primary case study, "Ella's Short Fuse", and its
// leader's key. The session's claim is that you are formed by what you repeat,
// so this scenario is built to make the room look for a mechanism rather than
// a culprit: what, specifically, is ranked asking her to practise every night?

import type { Scenario } from "../scenario-schema";

export const session04Scenario = {
  id: "s4-ellas-short-fuse",
  sessionNumber: 4,
  caseTitle: "Ella's Short Fuse",

  premise:
    "Ella is seventeen and plays a competitive team game most evenings. She is good at it — better than anyone else she knows — and during ranked season she plays about four hours a night.<br><br>Her mother has noticed something she has not said out loud yet. During the season Ella is short with her two younger brothers, quick to say whose fault a thing was, and visibly impatient with anyone who is slow at anything. Out of season she is her old self, and her mother has watched this happen twice now.<br><br>Ella says the game is how she handles the stress, and that if her mother is worried about her temper she might look at the exams instead. Both of them are partly right, and neither of them has said so.<br><br>You are her group. Over one ranked season, you decide what she does.",

  cast: [
    {
      name: "Ella",
      description:
        "Seventeen. Better at this than at anything else, which is a harder fact about a person than it sounds.",
    },
    {
      name: "Ruth",
      description:
        "Her mother. Has noticed the pattern twice, has said nothing twice, and is running out of ways to raise it that would not sound like an accusation.",
    },
    {
      name: "Sol",
      description:
        "Her younger brother, nine. Waits outside her door when she is playing and has recently stopped knocking.",
    },
  ],

  beats: [
    {
      index: 0,
      situation:
        "Wednesday, quarter past eight, and the match is close. Sol opens the door to ask whether she has seen his reading book, and Ella says something to him — fast, over the top of the headset — that she would not say to a friend. He shuts the door very carefully.",
      prompt: "What does Ella do in the next ten minutes?",
      choices: [
        {
          key: "a",
          label: "Finish the match. Go and find him after",
          consequence:
            "The match takes eleven more minutes and they win it. She finds him on the landing and apologises properly, and he says <i>it's fine</i> in the voice nine-year-olds use when it is not. By Saturday he has not come to her door again.",
          leaderNote:
            "The answer nearly every room picks, and it is not wrong. Ask what the eleven minutes taught, though — not what they cost Sol, what they taught Ella. Hebrews 5:14 is about senses trained by practice, and she has just practised finishing first.",
        },
        {
          key: "b",
          label: "Leave the match and go to him now",
          consequence:
            "She takes the headset off mid-round, which costs her the rank she has been climbing for a fortnight, and finds him on the stairs. It takes four minutes. Her team says something about her when she gets back and she reads it later and it stings for two days. By Saturday Sol has knocked twice.",
          leaderNote:
            "The costly answer and the one the group will admire. Make them price it honestly: she has lost something real, and a rule that says always leave the match will not survive a season. Ask what would have to be true for her to do this on a Wednesday in March.",
        },
        {
          key: "c",
          label: "Say sorry over her shoulder without taking the headset off",
          consequence:
            "He says nothing and goes downstairs. She means it and it does not land, because he cannot see her face and she does not stop. By Saturday she has forgotten it happened and he has not, and neither of them knows that.",
          leaderNote:
            "The most common thing that actually happens, and worth naming without contempt. Ask the group what the difference is between an apology and a thing said in the direction of somebody. The headset is doing the work here, not the words.",
        },
        {
          key: "d",
          label:
            "Tell him she'll play something with him tomorrow, and mean it",
          consequence:
            "She says it and he brightens, and on Thursday she does it, for forty minutes, badly, at a game she is not good at. It is the best evening either of them has had that week. By Saturday neither of them has said anything about Wednesday, and it is sitting exactly where it was.",
          leaderNote:
            "The generous answer that substitutes for the harder one. Ask whether repair and replacement are the same thing. Both of them are better off and nothing has been said about what happened, and the group should sit with whether that is enough.",
        },
      ],
    },
    {
      index: 1,
      situation:
        "Saturday morning. Her mother has clearly been working out how to say this since Wednesday and gets it about half right: <i>I don't think this game is good for you.</i> Ella has an answer ready, because she has had one ready for a year.",
      prompt: "What does Ella say back?",
      choices: [
        {
          key: "a",
          label: "Point at the exams — which is also true",
          consequence:
            "Her mother stops, because it is true and because she had not thought of it, and the conversation ends with an apology from the wrong person. Ella feels the win for about an hour. By the following Wednesday nothing has changed and her mother has gone back to not saying anything.",
          leaderNote:
            "The strongest argument in the room and it is genuinely true. That is what makes it dangerous. Ask the group how you tell the difference between a real point and a real point used to end a conversation — Ella cannot, and neither can most of them.",
        },
        {
          key: "b",
          label:
            "Ask her mother to say exactly what she has noticed, in specifics",
          consequence:
            "Her mother has three and gives them, and the third one — that Sol has stopped knocking — is the one Ella did not know. Nobody wins the conversation. It goes on for forty minutes and ends badly and both of them are still thinking about it on Monday.",
          leaderNote:
            "The bravest available answer, and notice that it makes the conversation worse rather than better. Ask what specifics do that generalities cannot. <i>This game is bad for you</i> can be argued with; <i>he has stopped knocking</i> cannot.",
        },
        {
          key: "c",
          label: "Agree to stop during ranked season, starting now",
          consequence:
            "She means it on Saturday. She holds it for nine days, which is longer than her mother expected, and then a friend is one win off a promotion and it lapses without either of them saying so. Nobody mentions that it has lapsed, which is how they both know it has.",
          leaderNote:
            "The concession, and it is offered too early to be worth much. Ask the room what has been diagnosed here. Nothing, and a cure with no diagnosis behind it is a truce. 1 Timothy 4:7 is about training, and a nine-day abstinence is not training.",
        },
        {
          key: "d",
          label:
            "Offer a limit she chooses herself: she stops after two losses",
          consequence:
            "Her mother is unimpressed and agrees to it anyway. It turns out to be far harder than Ella expected — she hits it on the first Tuesday and sits on her bed genuinely angry about a rule she wrote. She keeps it for five weeks. Her mother notices in week three and says nothing, on purpose.",
          leaderNote:
            "The answer that produces the most information. Ask why a self-imposed limit is harder to keep than an imposed one, and what the anger on the first Tuesday was actually about. That anger is the session's whole thesis arriving in a bedroom.",
        },
      ],
    },
    {
      index: 2,
      situation:
        "Mid-season, three weeks later. She is in a match with someone nine ranks below her who is playing badly, and she can hear what she is about to say before she says it, and it is exactly the voice she used on Sol.",
      prompt: "What does Ella do with that?",
      choices: [
        {
          key: "a",
          label: "Mute the team and keep playing",
          consequence:
            "It works. She plays better and says nothing to anyone for two hours and the evening is calmer than it has been in a month. She does it again the next night, and the night after, and by the end of the season she has played eleven hours with the voice chat off and has stopped noticing what she thinks about people.",
          leaderNote:
            "The effective answer, and worth taking seriously — she has removed the occasion for the sin. Then ask the harder thing: has anything been unlearned, or has it been silenced? Proverbs 4:23 is about the spring, not the tap.",
        },
        {
          key: "b",
          label: "Stop ranked for the rest of the season",
          consequence:
            "She is bored and irritable for four days and better by the second week, and by the end of the month she has read two books and is sleeping properly and misses it constantly. In March she goes back, because she is seventeen and she is good at it, and nobody has told her what to do differently this time.",
          leaderNote:
            "The clean break, and the room will call it repentance. Ask what happens in March. A fast that teaches you what a thing was doing to you is training; a fast that just stops the clock is a pause, and Ella has had one of those before.",
        },
        {
          key: "c",
          label:
            "Keep playing, and say one genuinely encouraging thing per match",
          consequence:
            "It is unbearable for about a week. The fourth time she does it the person says thanks and plays better, which she was not expecting and cannot stop thinking about. By the end of the season she does it without deciding to, and her rank is very slightly lower than last year.",
          leaderNote:
            "The most Romans 12 answer here — not conformed, but transformed, and by practice rather than by removal. Ask what the slightly lower rank is worth and make the group say a number. Then ask what she has been training instead.",
        },
        {
          key: "d",
          label: "Come off, and tell her mother she was right",
          consequence:
            "It costs her more than the match did. Her mother does not say <i>I told you so</i>, which Ella had braced for, and instead asks what she noticed. They talk for an hour and land on nothing practical at all. By the end of the week Ella has been better with Sol and is still playing four hours a night.",
          leaderNote:
            "The relational answer with no plan attached. Ask whether it is enough. Something real has happened — she has stopped defending — and nothing has changed about the four hours, which is either the beginning of change or a substitute for it.",
        },
      ],
    },
  ],

  closing: {
    consequence:
      "At the end of the season Ella still plays. Sol knocks about half the time. Her mother has said one true specific thing out loud and has not had to say it twice.<br><br>Nothing here established that the game was to blame. What the fortnight produced was a mechanism: ranked asks her, every night, to decide fast whose fault a thing is and to have very little patience with people who are slow. She has been practising that for two years, and she is extremely good at it now, which is what practice does.<br><br>Whether that is a reason to stop, or a reason to practise something else alongside it, is what your group has to decide.",
    scriptureRefs: [
      "Romans 12:1-2",
      "Hebrews 5:14",
      "Proverbs 4:23",
      "1 Timothy 4:7-8",
    ],
    leaderKey:
      "<b>Where this should land:</b> the room will want a culprit and the two obvious ones are the game and the exams. Refuse both, and refuse them the same way — by asking for a mechanism. What does ranked specifically ask her to practise? Blame allocation, a low tolerance threshold, and hostility toward incompetence, four hours a night, with a number at the end that tells her whether she did it well.<br><br>Hold on to the fact that Ella is right. It does relieve her stress, and any adult who denies that has lost her. The question is not whether the relief is real; it is what the relief costs and who it is billed to, and in this case the invoice arrives at a nine-year-old's door.<br><br>If your group leaves having decided whether the game is bad, the beat went badly. If they leave able to name one thing they personally practise for four hours a week without having chosen to, it went well.",
  },
} satisfies Scenario;
