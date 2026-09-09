// Adapted from Session 7's primary case study, "The Split", and its leader's
// key. The disagreement in this one is in the room rather than in the story,
// and the goal is not a verdict: it is that each side can state the other's
// position in a way the other would accept. Every path here is written so that
// a group which reaches consensus too quickly has missed something.

import type { Scenario } from "../scenario-schema";

export const session07Scenario = {
  id: "s7-the-split",
  sessionNumber: 7,
  caseTitle: "The Split",

  premise:
    "Six people in your small group play a military shooter together on Thursday nights. They have done it for two years. Two of them will tell you, without being asked, that it is the closest thing they have to a men's group, and they are not exaggerating.<br><br>One member believes the game is straightforwardly wrong. He says the point of it is to enjoy killing, and that calling it fellowship makes it worse rather than better. He has stopped coming on Thursdays and is now working out whether he can stay in the small group at all.<br><br>Nobody has been rude. Everyone is upset. The person who has to do something about it also plays on Thursdays.<br><br>You are Owen's group. Over the next three weeks, you decide what he does.",

  cast: [
    {
      name: "Owen",
      description:
        "Leads the small group and plays on Thursdays. Has not yet said out loud that those two facts are a problem.",
    },
    {
      name: "Nathan",
      description:
        "The objector. Careful, unangry, has thought about this more than anyone else has, and is now the loneliest person in the group.",
    },
    {
      name: "Femi",
      description:
        "Plays on Thursdays. Lost his brother four years ago and has said more to these five men in two years than to anyone at church.",
    },
  ],

  beats: [
    {
      index: 0,
      situation:
        "Tuesday, twenty past ten at night. A message from Nathan — three paragraphs, clearly rewritten more than once, with no anger anywhere in it. The last line asks whether Owen thinks he should look for a different group.",
      prompt: "What does Owen do first?",
      choices: [
        {
          key: "a",
          label: "Ring him tonight and listen without defending anything",
          consequence:
            "It takes fifty minutes and Owen says almost nothing, which is harder than he expected. Twice he starts a sentence beginning <i>but</i> and stops. At the end Nathan says <i>thanks for not arguing</i>, and nothing has been agreed, and Nathan comes on Sunday.",
          leaderNote:
            "The best available first move, and it resolves nothing on purpose. Ask what the two abandoned sentences were. Owen is a Thursday player being asked to hear a case against Thursday, and the discipline of not defending is the only reason Nathan is still in the group on Sunday.",
        },
        {
          key: "b",
          label: "Reply asking him to bring it to the whole group on Thursday",
          consequence:
            "Nathan agrees, because he is the kind of person who agrees to things like that. He spends four days dreading it and arrives having written it out. Owen prepares nobody else at all, which does not occur to him until he is unlocking the door.",
          leaderNote:
            "The transparent answer, and it puts one man in front of six. Ask the room whether that is courage or a failure of pastoral care. Both readings are available, and the detail that decides it is that nobody prepared the six.",
        },
        {
          key: "c",
          label: "Cancel this Thursday and tell the other five why",
          consequence:
            "Four of them take it well. Femi does not — he says almost nothing in the group chat, which from Femi is very loud, and does not come to the small group the following week. Nathan finds out that Thursday was cancelled because of him, is mortified, and comes the following week to say so.",
          leaderNote:
            "Decisive, and it costs the wrong person. Ask what Owen has communicated by cancelling before anyone has spoken. He has treated a conscience objection as a ruling, and the man who lost a brother has just been told the room where he talks about it is provisional.",
        },
        {
          key: "d",
          label: "Reply that he takes it seriously and needs a week to think",
          consequence:
            "Nathan replies <i>of course</i> within a minute and means it. Owen thinks about it properly for two days and then has a busy week, and on the following Tuesday he has not come back to it. Nathan does not chase him. By the Sunday after that they have not spoken about it at all.",
          leaderNote:
            "Reasonable, honest, and the most common way this ends. Ask the group what a week costs when the other person has already decided you might not want them. Not every failure of care is a bad decision; some of them are a Thursday that got away.",
        },
      ],
    },
    {
      index: 1,
      situation:
        "The following week, and Nathan has come. He puts it as carefully as he can and Femi answers before Owen can: <i>so we're murderers on Thursdays and Christians on Sundays, is that it?</i> Nobody speaks. Nathan opens his mouth and closes it again.",
      prompt: "What does Owen do in the room?",
      choices: [
        {
          key: "a",
          label:
            "Ask Femi to state Nathan's objection back, in terms Nathan would accept",
          consequence:
            "Femi cannot, on the first attempt, and says so, and that admission changes the temperature of the room more than anything else that evening. The second attempt is close. Nathan corrects one word and Femi accepts the correction. Nothing is decided and everybody stays for coffee.",
          leaderNote:
            "This is the whole session's method in one move, and it is worth telling your group so afterwards. The goal was never agreement — it was that each side can state the other's position in a way the other would sign. Note that Femi's <i>I can't</i> did more work than any argument.",
        },
        {
          key: "b",
          label: "Read Romans 14:22-23 aloud and leave it there",
          consequence:
            "The room goes quiet in the useful way. Then two of them read it as a rebuke to Nathan for judging, and Nathan reads it as permission to leave, and the same verses have just been used to reach opposite conclusions in the same eleven minutes. Owen does not correct either reading.",
          leaderNote:
            "The text is exactly right and dropping it unframed lets everyone take the half they wanted. Ask what Romans 14 requires of each side here, and make the group say both halves: the doubter must not be pushed past his conscience, and he must not make his conscience a rule for other men.",
        },
        {
          key: "c",
          label:
            "Stop the discussion — it is too hot to have in front of nine people",
          consequence:
            "He does it kindly and the group moves on to something else, visibly relieved. Nathan leaves at the end without staying for coffee. Three separate conversations happen about it that week in twos, and by the following Sunday there are two versions of what was said and neither is accurate.",
          leaderNote:
            "Sometimes the right call. Ask what it cost this time. The discussion did not stop, it went underground and multiplied, and the person with no allies is the one who cannot compete in that format.",
        },
        {
          key: "d",
          label:
            "Say plainly where he stands himself, since he plays on Thursdays too",
          consequence:
            "It lands well with everyone and badly for Nathan, who now knows the man adjudicating is on the other side. Nathan says <i>that's fair</i> and it is the first thing he has said all evening that is not true. He stays another six weeks and is careful in all of them.",
          leaderNote:
            "Honesty about the conflict of interest, offered at the moment it does the most damage. Ask when Owen should have said it — the answer is almost certainly before the meeting and to Nathan alone, and the group should notice that timing turned a good disclosure into a verdict.",
        },
      ],
    },
    {
      index: 2,
      situation:
        "A fortnight on. Nobody has left and nothing has been settled. Thursday is still happening, two more men have joined it, and one of them has never been to the small group at all.",
      prompt: "What does Owen do about Thursday?",
      choices: [
        {
          key: "a",
          label:
            "Keep it, and stop describing it as anything to do with the group",
          consequence:
            "It takes one sentence in the group chat and almost nothing changes on Thursdays. What changes is Sunday: Nathan comes back to everything, and the two men who joined stay on Thursday and never come to a small group, and by spring there are two circles of friends with a heavy overlap and one of them prays.",
          leaderNote:
            "The move the leader's key points at — the friction was rarely the game and usually the second, unofficial membership. Ask what has been solved and what has been conceded. Nathan is back, and eight men now have a fellowship the church has stopped claiming any responsibility for.",
        },
        {
          key: "b",
          label: "End it",
          consequence:
            "They stop, without much argument, because Owen asks them to. Two of them find another group to play with inside a month. Femi does not play anything for a while and is noticeably flatter at the small group, and in June he mentions his brother for the first time in a year and then does not finish the sentence.",
          leaderNote:
            "The decisive answer, and the group will need to be walked slowly through the last sentence. Whatever was wrong with Thursday, something real was carried on it. 1 Corinthians 8 asks the strong to give things up for the weak; it does not promise the cost will be small or land where you expect.",
        },
        {
          key: "c",
          label: "Keep it and open it — ask Nathan to come and not play",
          consequence:
            "He comes twice. The first time is excruciating for everyone. The second time he watches for an hour and asks Femi a question about why he likes it, and Femi answers for eleven minutes, and Nathan says at the end that he still thinks it is wrong and that he understands something he did not. He does not come a third time.",
          leaderNote:
            "The most interesting outcome and the one nobody proposes. Ask whether two evenings that ended in the same disagreement were worth it. Then ask what Nathan now has that a correct argument would not have given him.",
        },
        {
          key: "d",
          label:
            "Move it — same six men, a different game everyone could be in",
          consequence:
            "They try it for three weeks and it is fine and nobody loves it. Two drift. Nathan comes to one and is welcome and does not come again, because it turns out he did not want to play anything. By May Thursday has quietly reverted, and nobody announces that either.",
          leaderNote:
            "The compromise that assumes the problem was the content. Ask what the three weeks proved. Nathan's objection was never that he was excluded, and the group solved a problem he did not have while the one he did have carried on underneath it.",
        },
      ],
    },
  ],

  closing: {
    consequence:
      "Three weeks on, everybody is still in the group. Thursday is still Thursday. Nobody has changed their mind about whether the game is wrong.<br><br>What has changed, if the group did its work, is that Femi can say Nathan's objection in Nathan's own terms and Nathan can say what those two years have been for Femi. That is not agreement and it was never going to be. It is the condition under which two Christians can hold opposite convictions in one room without one of them having to leave.<br><br>Whether that is enough to keep them in one group is what your group has to decide.",
    scriptureRefs: [
      "Philippians 4:8",
      "Romans 14:22-23",
      "1 Corinthians 8:9-13",
      "Psalm 11:5",
    ],
    leaderKey:
      "<b>Where this should land:</b> not a verdict, and your group will try very hard to give you one. The test of a good beat here is whether each side can state the other's position in words the other would sign, and that is worth asking for explicitly before you close.<br><br>Philippians 4:8 will be quoted as a content filter within about four minutes. It is not one — Lamentations is true, Judges is true, and the cross is not lovely to look at. The narrower and harder question is what this particular story asks a person to enjoy, and it is a question the Thursday players can answer better than the objector can, if anybody asks them.<br><br>Then the structural question the case is actually about: does Thursday need to be a group activity, or can it be a private friendship? Most of the heat in rooms like this is not the game. It is that something has become a second, unofficial membership inside the group, with its own hours and its own insiders, and the man who cannot join it has correctly noticed that he is now outside something.",
  },
} satisfies Scenario;
