// Adapted from Session 9's primary case study, "He Isn't Wrong", and its
// leader's key. The group has to concede the factual claim before it offers
// anything, so the first beat is written to make a premature correction feel
// exactly as bad as it is.

import type { Scenario } from "../scenario-schema";

export const session09Scenario = {
  id: "s9-he-isnt-wrong",
  sessionNumber: 9,
  caseTitle: "He Isn't Wrong",

  premise:
    "Tom is twenty-six and has been at your church for four years. In February he was diagnosed with something that is going to be part of the rest of his life.<br><br>Eleven people in his guild noticed within a day that he had gone quiet. Two of them rang him. One of them got on a plane.<br><br>Three people from church sent him a message. Nobody visited.<br><br>He tells the group this on a Tuesday night, without heat, in about ninety seconds. He is not angry and he is not leaving. He says he would just like somebody to admit that he is describing something true.<br><br>You are Hannah's group. She sent one of the three messages. Over the next three months, you decide what she does.",

  cast: [
    {
      name: "Tom",
      description:
        "Twenty-six, four years in the church, diagnosed in February. Has said the true thing out loud once and will not say it twice.",
    },
    {
      name: "Hannah",
      description:
        "Sent one of the three messages. Meant it, was genuinely busy, and has known since about March that neither of those is the point.",
    },
    {
      name: "Ola",
      description:
        "Tom's guild. Nine years of playing together, four thousand miles, and the only person who has been inside his flat since the diagnosis.",
    },
  ],

  beats: [
    {
      index: 0,
      situation:
        "Tuesday night, and Tom has just stopped talking. Nine people are looking at the carpet. Hannah is the one who sent a message and everybody in the room knows which three they were, including her.",
      prompt: "What does Hannah say first?",
      choices: [
        {
          key: "a",
          label: "That he is right, and then stop talking",
          consequence:
            "It is four words and the silence afterwards is about six seconds long and feels much longer. Then somebody else says <i>yeah</i>, quietly, and then a third person does. Nobody offers anything for a while. Tom says <i>thank you</i> and means it, and the meeting is different for the rest of the evening.",
          leaderNote:
            "Model this one yourself before you ask the group to do it. The whole session turns on conceding a factual claim without a clause after it, and the six seconds of silence are what makes it a concession rather than a preamble.",
        },
        {
          key: "b",
          label: "Explain what she had on that fortnight — which is all true",
          consequence:
            "It is true, and two people nod, and Tom says <i>no, of course</i>, and the room relaxes about forty per cent. The subject changes within three minutes. Hannah drives home feeling better than she did at eight o'clock, and she is still thinking about it in June.",
          leaderNote:
            "The most human answer in the scenario and the one that ends the conversation. Ask what was actually being asked for. He did not accuse anybody, so a defence answers a charge nobody made — and the effect is that the room is now discussing Hannah's February rather than Tom's.",
        },
        {
          key: "c",
          label: "Ask him what a visit would have looked like",
          consequence:
            "He does not have an answer ready and takes a moment, and then says something very small — that somebody would have had to see the flat. Two people in the room understand immediately what that means and two do not. It is the most information anyone gets all evening.",
          leaderNote:
            "A good question asked slightly too early, and it still works. Ask why <i>somebody would have had to see the flat</i> is the sentence that lands. Presence is not a warmer version of a message; it is a different category, and it costs the person being visited something too.",
        },
        {
          key: "d",
          label:
            "Say what the church can offer that a guild structurally cannot",
          consequence:
            "Everything she says is correct. Tom agrees with all of it, immediately and warmly, and the group moves on to prayer feeling that something has been resolved. In August he is still in the church, and he has not brought anything like this to the group again.",
          leaderNote:
            "The correct answer at the wrong moment, and the group will need help seeing why it fails. He asked for one thing and was given a different, better thing instead. Ask what a person learns about a room when the room upgrades their request rather than granting it.",
        },
      ],
    },
    {
      index: 1,
      situation:
        "The following Tuesday, and the group wants to do something. Somebody proposes a rota, somebody else says a rota is not friendship, and it goes round for eleven minutes. Hannah has been quiet and everyone is now waiting on her.",
      prompt: "What does Hannah push for?",
      choices: [
        {
          key: "a",
          label: "A rota. Names and dates, written down, starting this week",
          consequence:
            "Two people find it faintly embarrassing and agree to it anyway. It holds for seven weeks and then a name is missed and nobody notices for a fortnight. By month three, four of the nine are still doing it, and Tom has had eleven visits he would not otherwise have had.",
          leaderNote:
            "Unromantic, and it moved four thousand miles' worth of the guild's advantage into a church living room. Ask what the embarrassment was about. Guilds have rotas and roles and nobody finds that demeaning, and the discomfort is worth naming rather than honouring.",
        },
        {
          key: "b",
          label:
            "Nothing formal. She just goes, this week, and says so to nobody",
          consequence:
            "She goes on Thursday and stays two hours and it is the best thing anybody does all month. She goes again three weeks later and then it is May, and she has been twice, and Tom has had two visits and eight people have had a clear conscience about a decision nobody made.",
          leaderNote:
            "The purest answer and it does not scale past one person. Ask the group whether that is a criticism. Hebrews 10 is not a command to organise; it is a command to gather in order to do something to each other, and a rota is one way of remembering and a very good friend is another.",
        },
        {
          key: "c",
          label:
            "Ask Tom to design it, since he is the one who knows what works",
          consequence:
            "He is uncomfortable being asked and does it anyway, and what he produces is startlingly specific: a named person each fortnight, permission to turn up without checking first, and one line saying that if he does not reply for a week somebody should just come. Four of those things had never occurred to anybody in the room.",
          leaderNote:
            "The move that treats him as a member rather than a project. Ask which of his four items the group would have thought of. The last one — come anyway — is the structural feature the guild had all along, and it is the one nobody in a church proposes because it feels intrusive.",
        },
        {
          key: "d",
          label:
            "One change only: somebody says out loud when anyone misses two weeks",
          consequence:
            "It is small enough that everybody agrees and it survives. In June it catches somebody who is not Tom — a woman who had missed three Tuesdays and had assumed nobody had counted. She cries in the car park, which nobody expected, least of all her.",
          leaderNote:
            "The smallest possible structural change and the one with the widest reach. Ask what the guild does that this imitates: low-friction visibility of absence, automatic, requiring nobody to be heroic. Then ask why churches almost never have it.",
        },
      ],
    },
    {
      index: 2,
      situation:
        "Three months on. Hannah goes round on a Saturday and Ola is there — he has flown again, for four days, and is doing the washing-up. The three of them in one small kitchen, and it is the first time the two halves of Tom's life have been in the same room.",
      prompt: "What does Hannah do with that?",
      choices: [
        {
          key: "a",
          label: "Ask Ola what the guild does when somebody goes quiet",
          consequence:
            "He explains it in about two minutes and it is entirely unmagical — a channel, a habit, and a rule that if somebody has not posted in three days you ask. Hannah writes it on the back of a receipt in the car. She brings it to the group on Tuesday and two things from it are still running at Christmas.",
          leaderNote:
            "The unglamorous answer and the most useful. Ask the room to notice that nothing Ola describes requires more love than a church has — it requires a habit, and it is written down somewhere, and it does not depend on anybody feeling moved.",
        },
        {
          key: "b",
          label: "Say thank you, and leave the two of them to the afternoon",
          consequence:
            "She stays twenty minutes and goes, and it is generous and correct and Tom is glad she came. In the car she works out that she has now been three times and that Ola has now flown twice, and does the arithmetic on the cost of each, and cannot make it come out in her favour.",
          leaderNote:
            "Tact, properly exercised. Then take the arithmetic seriously rather than reassuring her out of it. Ask the group to say out loud what one four-thousand-mile flight costs and what one Saturday afternoon costs, and to sit with the ratio for a moment before anybody softens it.",
        },
        {
          key: "c",
          label: "Invite Ola to church on Sunday",
          consequence:
            "He says yes, mostly out of politeness, and comes. Three people are notably kind to him and one asks him twice how he knows Tom. He tells Hannah afterwards, without any edge, that he could see why Tom stayed and also why it had taken four years for anybody to be in his kitchen.",
          leaderNote:
            "Hospitable, and it produces the most honest sentence in the scenario from the person with the least reason to be careful. Ask what Ola saw in ninety minutes that the group has not managed to say to itself in three months.",
        },
        {
          key: "d",
          label:
            "Ask Tom, in front of Ola, what the church has that the guild does not",
          consequence:
            "It is a risky thing to ask with Ola holding a tea towel. Tom takes it seriously and answers slowly, and what he lands on is bread and water and the fact that nobody at church can drop him for playing badly. Ola says, without irony, that the guild absolutely would. All three of them laugh and it is not really funny.",
          leaderNote:
            "The best answer in the scenario and the one most likely to go wrong. Note what Tom names: sacraments, bodies, and a membership that survives underperformance. A guild's belonging is real and it is conditional on contribution, and Ola is the one who says so.",
        },
      ],
    },
  ],

  closing: {
    consequence:
      "Three months on, Tom is still in the church and still in the guild. He has had eleven visits he would not have had, and one friend who has flown twice, and a group that has stopped arguing about whether his criticism was fair.<br><br>Nothing here established that online friendship is a lesser thing. It established what it is: real, and structured, and better at noticing an absence than most churches are — and unable, by its own design, to feed anybody bread or to keep somebody who has stopped being useful.<br><br>Which of those a person needs in February is what your group has to decide.",
    scriptureRefs: [
      "Hebrews 10:24-25",
      "Acts 2:42-47",
      "1 Thessalonians 2:8",
      "3 John 13-14",
    ],
    leaderKey:
      "<b>Where this should land:</b> the group must concede the factual claim before it offers anything, and you should do it first and without a clause on the end. If anybody in the room says <i>but</i> in the first two minutes, stop and go back.<br><br>Then get structural, because that is where the help is. What the guild has: a clear membership, a role for everybody, reliable rhythms, and low-friction visibility of absence — nobody has to be heroic for somebody's silence to be noticed. Every one of those is available to a church that is willing to write something down, and the reason churches do not is that a rota feels like an admission that love needs scaffolding.<br><br>What a church has that a guild structurally cannot: bread, water, bodies in a room, a covenant that survives you being unpleasant, and a membership you cannot be dropped from for underperforming. Make the group say those concretely; <i>Jesus</i> is not an answer here, it is a way of avoiding one.<br><br>End with one change the group will actually make this month, with a name attached to it. If they leave having agreed that community is important, the beat went badly.",
  },
} satisfies Scenario;
