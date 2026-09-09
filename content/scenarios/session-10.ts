// Adapted from Session 10's primary case study, "The Lobby", and its leader's
// key. The only scenario written in the second person, because the case is,
// and because the leader's key insists on specific sentences rather than
// principles — most of the choices below are the words themselves.

import type { Scenario } from "../scenario-schema";

export const session10Scenario = {
  id: "s10-the-lobby",
  sessionNumber: 10,
  caseTitle: "The Lobby",

  premise:
    "You are four minutes into a match you were enjoying.<br><br>One of your teammates makes a mistake. From the voice you would guess he is thirteen, maybe younger. Two of the others start on him and it escalates in about fifteen seconds: first the mistake, then his accent, then his mother, then a suggestion about what he should do to himself.<br><br>He has gone quiet. Not left — quiet.<br><br>Your microphone is on. The match is still running. Everybody is still playing.<br><br>You have about ten seconds, and this session is not going to let you answer in principles.",

  cast: [
    {
      name: "You",
      description:
        "Fifth on the team. Microphone live, four minutes in, and better at this than either of the two who are talking.",
    },
    {
      name: "The boy",
      description:
        "Thirteen at the outside. Said <i>sorry</i> once, before the second thing, and has not said anything since.",
    },
    {
      name: "Rhys",
      description:
        "Started it. Funny, quick, and going to be funnier in about four seconds if nobody says anything.",
    },
  ],

  beats: [
    {
      index: 0,
      situation:
        "The suggestion has just been made and somebody has laughed at it. There is about a second and a half of nothing. The objective marker is flashing and two of your teammates are still moving toward it.",
      prompt: "What do you say, out loud, right now?",
      choices: [
        {
          key: "a",
          label: "To them: “Leave him. He's about thirteen.”",
          consequence:
            "Rhys says <i>and?</i> and the other one laughs, and then it stops, because there is nothing after <i>and</i> that is funny. They play the rest of it in a sour silence. Afterwards Rhys puts something in the lobby chat about you, and two people who were not in the match read it.",
          leaderNote:
            "Short, aimed at the abusers, and it works. Then price it honestly: you were turned on afterwards, in writing, in front of people. The leader's key says the cost is real, and a group that pretends otherwise has made the exercise a game.",
        },
        {
          key: "b",
          label: "To him: “Mate, you're fine. Ignore them, stick with me.”",
          consequence:
            "He does not answer for about forty seconds. Then he says <i>ok</i>, very quietly, and follows you for the rest of the match, and at one point does something genuinely useful. Rhys says something about you being his dad. You lose the match by a lot.",
          leaderNote:
            "The best answer here and the one rooms reach last, because it does not win the argument. It addresses the boy rather than the two men, which is the only thing that could have reached him inside ten seconds — and note that it did not stop the abuse, it just stopped him being alone in it.",
        },
        {
          key: "c",
          label: "Nothing on the microphone. Message him privately, now",
          consequence:
            "You type six words while moving and he reads them, because he replies with a full stop. The abuse continues for another ninety seconds with nobody objecting to it. He stays to the end of the match. Nothing you did was heard by anyone except him.",
          leaderNote:
            "Real kindness at no social cost, and ask the room to notice the second half of that sentence. He now knows one person saw it and that nobody would say so out loud, which is a specific lesson about what adults do, and he will remember it.",
        },
        {
          key: "d",
          label:
            "Change the subject. Make a joke, take the heat somewhere else",
          consequence:
            "It works, which is the uncomfortable part — you are funnier than Rhys and the lobby follows you. Within thirty seconds they are talking about something else and the boy is left out of it. He says nothing for the rest of the match and does not queue with the group again.",
          leaderNote:
            "The socially skilful answer, and it is not nothing: the abuse stopped. Ask the group what was never said. Nobody told him it was wrong, and a thirteen-year-old cannot distinguish being rescued by a distraction from everyone simply losing interest.",
        },
      ],
    },
    {
      index: 1,
      situation:
        "Scoreboard. You have about two minutes before people drop out of the lobby. Rhys is already queuing for another one and has invited you. The boy is still in the party, not saying anything.",
      prompt: "What do you do in the next two minutes?",
      choices: [
        {
          key: "a",
          label:
            "Message the boy. Say the thing plainly and don't ask for anything back",
          consequence:
            "Two sentences. He replies <i>thanks</i> about four minutes later and nothing else. You never speak to him again and have no idea whether it mattered. Six months on you still think about it occasionally, which is more than you can say for anything else that happened that night.",
          leaderNote:
            "The right thing, done without any way of knowing it worked. Ask the group how much of Christian obedience looks like this — one message, no feedback, no resolution — and whether they would keep doing it for a year on those terms.",
        },
        {
          key: "b",
          label: "Report both of them, with the clip, before the lobby closes",
          consequence:
            "It takes ninety seconds. You get an automated message eleven days later saying action was taken against one account, which may or may not be Rhys and does not say. Nothing else happens. It is the only thing you did that night that the boy will never know about.",
          leaderNote:
            "The structural answer, and it is worth doing and worth being honest about — slow, invisible, and probably effective at a scale you cannot see. Ask whether an action nobody witnesses counts as loving your neighbour, and let somebody say yes.",
        },
        {
          key: "c",
          label: "Message Rhys. Say it once, without an audience",
          consequence:
            "He replies <i>lol calm down</i> and then, eight minutes later, <i>was just messing</i>, which from Rhys is an entire apology. You play with him again that week and he is fine for the whole match. He is not fine three weeks after that, with somebody else, and you are not there.",
          leaderNote:
            "The move that treats the abuser as a person who could be different. Take the small climbdown seriously — it was real. Then ask what it is worth that he was fine when you were present, and what that tells you about where the change actually was.",
        },
        {
          key: "d",
          label: "Nothing. It is over, you said something, and you are tired",
          consequence:
            "You accept the queue and play two more matches and they are fine. The boy leaves the party during the first one. By the weekend you have half forgotten it, and the part you remember is the bit where you said something, which is the part you tell people about.",
          leaderNote:
            "The most honest option on the list and the one your group is most likely to have actually chosen in real life. Do not let them be scourged for it. Ask instead what the two minutes after are for, and why they are the ones that always get skipped.",
        },
      ],
    },
    {
      index: 2,
      situation:
        "Friday. The group invites you back and Rhys is in it. Nothing has been said about Tuesday by anybody. You have played with these people twice a week for most of a year and they are, by any ordinary measure, your friends.",
      prompt: "What do you do about Friday?",
      choices: [
        {
          key: "a",
          label: "Play, and say something the first time it happens again",
          consequence:
            "It happens again in three weeks and you say it, and it is much harder the second time because there is no thirteen-year-old to point at, only somebody being unpleasant about somebody's aim. Rhys says <i>alright, alright</i>. It happens noticeably less after that, and you are noticeably less relaxed on Fridays.",
          leaderNote:
            "Staying, and paying by instalments. Ask the group what the tiredness is and whether it is sustainable for a year. This is 1 Corinthians 9 territory — remaining inside something in order to be some use in it — and it costs exactly what Paul says it costs.",
        },
        {
          key: "b",
          label: "Leave the group",
          consequence:
            "You say you have been busy, which is a small lie, and you queue alone for a month and it is much worse. You are not present the next time it happens to somebody, and neither is anyone else. Two of the six message you in November to ask where you went.",
          leaderNote:
            "Sometimes the right call, and the case does list it. Make the group weigh both halves: you have stopped underwriting it with your presence, and you have removed the only person in that lobby who was going to say anything. Neither of those is nothing.",
        },
        {
          key: "c",
          label:
            "Message Rhys before Friday and say you're not doing that again",
          consequence:
            "He takes it better in private than he ever does in a lobby, and says something almost thoughtful about his own brother. Friday is fine. So is the Friday after. In December he does it to somebody again and then, unprompted, says <i>sorry, ignore me</i>, which nobody in that lobby has ever heard him say.",
          leaderNote:
            "The most Colossians 4 answer available — wisdom toward outsiders, speech with salt, an answer fitted to this particular man. Ask what made the private version possible: no audience, and a friendship with enough weight in it to carry a correction.",
        },
        {
          key: "d",
          label:
            "Play, say nothing about Tuesday, and be the one the young ones queue with",
          consequence:
            "You do it for months without ever announcing it. Two of the regular younger players start joining your queue rather than the main one, and you never work out whether that was deliberate on their part. Rhys carries on exactly as he was, and the lobby is exactly as unpleasant, and there is now a corner of it that is not.",
          leaderNote:
            "The quietest answer and a real strategy — Matthew 5:16 is about a lamp that is visible rather than a speech that is delivered. Then ask the honest question: is this witness, or is it a way of never having to say anything to Rhys? Both are available, and only the person doing it knows which.",
        },
      ],
    },
  ],

  closing: {
    consequence:
      "The match ended half an hour after it started. The boy either kept playing or he did not, and you will almost certainly never find out.<br><br>Nothing here was about evangelising a lobby. It was about ten seconds, and then two minutes, and then a Friday — the ordinary units in which a person is either good to be matched with or is not.<br><br>This is the last scenario of the semester, and it is the only one where you were the protagonist. The rule of play you write tonight is the answer to it: not what you believe about video games, but what you have decided in advance to say when it takes ten seconds and there is nobody to ask.",
    scriptureRefs: [
      "Colossians 4:5-6",
      "Matthew 5:14-16",
      "1 Peter 3:15",
      "Micah 6:8",
    ],
    leaderKey:
      "<b>Where this should land:</b> force specific sentences and refuse everything else. Groups love to discuss this abstractly and the entire point is that abstraction is useless in ten seconds. If somebody offers a principle, ask them for the words, out loud, in the room, now.<br><br>The good answers are short, address the boy rather than the abusers, and do not try to win an argument. Something like naming him as fine and telling him to stick with you. Anything that begins by explaining to Rhys why he is wrong will be four sentences long and will arrive after the boy has left.<br><br>Afterwards there are three real actions and the group should name all three: a message to the boy, a report, and — possibly — leaving the group. And be honest about the cost, because pretending it is small makes the whole exercise dishonest. You will be turned on next. That is not a hypothetical and every person in the room who plays online already knows it.<br><br>End on the rule of play. This scenario is the reason it exists: the sentence you have already decided to say is the only kind you will manage in ten seconds.",
  },
} satisfies Scenario;
