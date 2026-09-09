// Adapted from Session 3's primary case study, "The Ministry Server", and its
// leader's key. Babel is the text: brick and mortar are fine, and the problem
// is the sentence in the middle about making a name. The room is meant to
// arrive at a modified proposal rather than a verdict, so every path here is
// a design decision rather than a yes or a no.

import type { Scenario } from "../scenario-schema";

export const session03Scenario = {
  id: "s3-the-ministry-server",
  sessionNumber: 3,
  caseTitle: "The Ministry Server",

  premise:
    "Your church's youth pastor wants to run a Minecraft server for the students, open to their school friends. The elders like the idea. Two of them have used the word <i>outreach</i> in a meeting and looked pleased with themselves for knowing what it was.<br><br>As proposed, it would be always on, unmoderated between ten at night and seven in the morning because nobody is awake, with an invite link the students can share with whoever they like.<br><br>Three families are enthusiastic. One father, who has spent twenty years in IT and has read the proposal twice, has said he will resign from the youth committee if it goes ahead as described. He has not said it angrily. He has said it once, clearly, and then stopped talking.<br><br>You are the youth pastor's group. For the next six weeks, you decide what he does.",

  cast: [
    {
      name: "Ade",
      description:
        "Twenty-nine, three years in post, the first youth pastor this church has had who is any good at it. Wants this to work more than he has admitted to himself.",
    },
    {
      name: "Gareth",
      description:
        "The father from the committee. Twenty years in IT, two teenagers, and the only person in the room who has ever had to take a server down at three in the morning.",
    },
    {
      name: "Kayleigh",
      description:
        "Fifteen. Asked for the server in the first place, has invited eleven people to things at this church, and has never once been asked why she wanted it.",
    },
  ],

  beats: [
    {
      index: 0,
      situation:
        "Tuesday, twenty past eight, and the committee has been going for an hour. Gareth has just said the sentence about resigning and is now sitting with his hands flat on the table, waiting. Everybody is looking at Ade.",
      prompt: "What does Ade do in the room, tonight?",
      choices: [
        {
          key: "a",
          label: "Ask Gareth to write the rules himself, and start this week",
          consequence:
            "Gareth says yes before he has finished the sentence, which surprises everyone including Gareth. He sends four pages on Thursday. Two of them are excellent, one is unworkable, and the last one is a list of things he has watched happen to other people's children. Nothing launches for a fortnight.",
          leaderNote:
            "The move that turns an objector into an owner, and the room will like it too quickly. Ask what Ade has actually given away — editorial control of the thing he wanted, to the person who least wanted it. That is either wisdom or capitulation and the group has to say which.",
        },
        {
          key: "b",
          label:
            "Defend the proposal — the students want it now, not in a month",
          consequence:
            "He argues well and the committee votes it through, six to two. Gareth does not resign that evening; he says he will think about it, and then says nothing for eleven days. The server opens on Friday with forty-one people on it by Sunday and nobody in charge of it after ten.",
          leaderNote:
            "Ask the group to name what is genuinely good here before they name the risk — Ade is right that a delayed yes is often a no, and that fifteen-year-olds do not wait. Then ask what he has bought the speed with. The eleven days of silence are the answer.",
        },
        {
          key: "c",
          label: "Withdraw the proposal tonight and bring back a better one",
          consequence:
            "The room relaxes and Gareth thanks him. Nine days later two of the students set up their own server with no adults on it at all, and Kayleigh is on it, and that is what gets the second version approved in a fortnight rather than five weeks. It opens with better rules than the first one and three weeks late.",
          leaderNote:
            "The safe answer, and the one whose cost lands somewhere the committee will never see. Do not let the group treat this as a defeat either — a proposal that needed five weeks of work probably needed five weeks of work. Ask who carried the risk in the meantime.",
        },
        {
          key: "d",
          label:
            "Run it for four weeks with an adult on every evening, then review",
          consequence:
            "Gareth votes for it. Finding an adult for every evening turns out to mean Ade on nineteen of the first twenty-eight, which he does not mention to anyone. By the review he is exhausted, the students love it, and the honest answer to <i>can we sustain this</i> is no.",
          leaderNote:
            "The compromise, and the one that works right up until it doesn't. Ask the group what a pilot is for. A trial that only proves the thing is good while one person burns himself down running it has not tested the proposal at all.",
        },
      ],
    },
    {
      index: 1,
      situation:
        "Three weeks in. Eleven forty at night, and a mother forwards a screenshot from her son's screen — four lines of chat from an account nobody recognises, aimed at a thirteen-year-old, at an hour when the proposal says nobody is watching.",
      prompt: "What does Ade change about the night?",
      choices: [
        {
          key: "a",
          label: "Close it at ten and open it at seven, starting tonight",
          consequence:
            "It takes four minutes to configure and the complaints last nine days. Two students stop coming on entirely; one of them is the thirteen-year-old, and it takes a month to work out that he stopped because he was embarrassed, not because of the hours.",
          leaderNote:
            "The obvious fix, and it is a good one. Push on the second half: closing the door is a design decision and telling the boy why is a pastoral one, and Ade has done the first and not the second. Ask which of those the church is actually better at.",
        },
        {
          key: "b",
          label: "Keep the hours and find two adults for every night",
          consequence:
            "Six people volunteer in a week, which nobody expected. Four of them are still doing it in March. The other two discover that being on a server with teenagers at midnight is not the same as being in a room with them, and one of them says something on it he would not have said in a hall.",
          leaderNote:
            "The costly, communal answer, and the one that treats the server as a place the church is in rather than a service it runs. Then note the last sentence. Presence is not the same as safety, and an adult who is careless at midnight is a new problem rather than a solved one.",
        },
        {
          key: "c",
          label:
            "Keep the hours, log everything, and tell the students it is logged",
          consequence:
            "The chat gets noticeably duller for about a fortnight. Then it gets normal again, and quieter in a different way: the students who have something real to say have moved it to a group chat Ade is not in. He does not find out for two months.",
          leaderNote:
            "The technical answer to a human problem, and the one this session exists to interrogate. Psalm 115 is under this: we become like what we make. Ask what a logged room trains people to do, and note that the answer is not <i>behave</i> — it is <i>go elsewhere</i>.",
        },
        {
          key: "d",
          label: "Remove the account that said it and change nothing else",
          consequence:
            "It takes ninety seconds and the boy who said it is back under another name inside a week, because the invite link still works the way it always did. The mother who sent the screenshot does not send the next one.",
          leaderNote:
            "The answer that treats the incident as the problem. Ask the group what Gareth's objection was actually about — it was never Minecraft and it was never that boy, it was that an open invite link and no moderated hours will produce this every few weeks forever.",
        },
      ],
    },
    {
      index: 2,
      situation:
        "Six weeks. Forty-three accounts, thirty of whom have never been to anything at the church. An elder asks Ade, warmly and in front of two other people, whether the server numbers can go in the annual report as youth ministry attendance.",
      prompt: "What does Ade say to the elder?",
      choices: [
        {
          key: "a",
          label: "Yes — and say plainly what the number is and is not",
          consequence:
            "The number goes in with two sentences under it about what it counts. At the meeting somebody reads the number and not the sentences, and the applause is for forty-three. Ade sits with that for the rest of the evening.",
          leaderNote:
            "Honest, and it still gets misused. Ask what that tells the group about numbers in churches. The caveat did its job in the document and failed in the room, which is roughly what happens to every caveat.",
        },
        {
          key: "b",
          label: "No. Count nothing from it this year",
          consequence:
            "The elder is puzzled rather than annoyed and lets it go. Six months later the budget review asks what the youth work has to show for itself and there is no honest way to point at the thing that is working, because Ade decided it did not count.",
          leaderNote:
            "The principled refusal, and the group will admire it. Then ask who pays. Refusing to be measured protects you from being misread and also from being funded, and pretending otherwise is not humility.",
        },
        {
          key: "c",
          label:
            "Give the number with the six who have turned up in person beside it",
          consequence:
            "The elder reads both, and says <i>six</i> out loud, twice, in a tone Ade cannot read. Two weeks later the elder asks for the six names, and it turns out he wants to know whether anybody has had them round for a meal.",
          leaderNote:
            "The answer that gives the report a second, harder number. Note where it ends up — an elder asking about meals, which is the only question in this beat that Genesis 11 does not indict. Ask why the smaller number produced the better conversation.",
        },
        {
          key: "d",
          label:
            "Ask the elders to write down what the server is for, before anyone counts it",
          consequence:
            "It takes them two meetings and the sentence they land on is worse than Ade's and truer than he expected: <i>so that the young people of this church have somewhere to be good to their friends.</i> Nobody counts anything that year. Gareth reads the sentence and says it is the first sensible thing the committee has produced.",
          leaderNote:
            "The Babel move, made in the right direction. The men at Babel had the bricks and the technique and no purpose but a name; this is the same materials with the sentence rewritten. Ask the group what their own church would put in that sentence if it had to, tonight, out loud.",
        },
      ],
    },
  ],

  closing: {
    consequence:
      "Six weeks after Gareth put his hands flat on the table, there is a server with forty-three people on it, a set of hours somebody chose on purpose, and a written answer to what it is for that at least one person in the church has read.<br><br>None of that was a verdict on Minecraft. Every decision the group made was about design — who is present, when the door is open, who may be invited, and what the whole thing is supposed to produce. Babel was built out of good brick by capable people, and the sentence in the middle was the problem.<br><br>Whether this church has written a better sentence is what your group has to decide.",
    scriptureRefs: [
      "Genesis 11:4",
      "Genesis 4:20-22",
      "Deuteronomy 8:17-18",
      "Psalm 115:4-8",
    ],
    leaderKey:
      "<b>Where this should land:</b> a modified proposal, not a ruling. If your group has spent the whole scenario arguing about whether churches should run game servers, the beat went sideways — every path above assumed it launches and asked how.<br><br>The concrete fixes are moderated hours, adult presence, invite approval, a written conduct standard, and a stated purpose, and a good group will name most of them without help. The one worth pressing is the last, because it is the Babel question wearing work clothes: is this outreach, or is it a number the church would like to have? Ask it gently and then let the silence do the work. Deuteronomy 8 is the pastoral half — <i>my power and the might of my hand has gotten me this wealth</i> is exactly what a growing ministry says to itself, and it is said most often by people who are doing something genuinely good.",
  },
} satisfies Scenario;
