// Adapted from Session 5's primary case study, "Third Shift", and its leader's
// key. The group's first answer will be "go to bed", which is not wrong and is
// not enough — Daniel's need for hours that belong to him is real and biblical,
// and the problem is that he is buying them from tomorrow at a terrible rate.

import type { Scenario } from "../scenario-schema";

export const session05Scenario = {
  id: "s5-third-shift",
  sessionNumber: 5,
  caseTitle: "Third Shift",

  premise:
    "Daniel is thirty-eight. Three children under nine, a job he would describe as tolerable and dull, and a house in which every hour of the day is claimed by somebody who is not him.<br><br>From about eleven at night until two in the morning he plays. Alone, headphones on, lights off. He describes those three hours as the only part of the day that belongs to him, and he is not wrong about that.<br><br>He is also permanently tired, short with his wife before eight in the morning, and has fallen asleep twice during his daughter's bedtime story. His wife stopped mentioning the nights in March. He knows that is worse than her mentioning them, and he has not worked out what to do with knowing it.<br><br>You are his group. Over one month, you decide what he does.",

  cast: [
    {
      name: "Daniel",
      description:
        "Thirty-eight. Has three hours a day that are his and is paying for them with the other twenty-one.",
    },
    {
      name: "Katie",
      description:
        "His wife. Raised it four times between January and March, stopped, and has not raised it since. Has her own count of hours that belong to her and has never said the number out loud.",
    },
    {
      name: "Nell",
      description:
        "Their eldest, six. Has started checking whether his eyes are open before she gets to the end of a page.",
    },
  ],

  beats: [
    {
      index: 0,
      situation:
        "Tuesday, ten to eleven. The children have been down for an hour and Katie went up at half past nine. The laptop is on the kitchen table where he left it this morning, and the house is quieter than it has been since six.",
      prompt: "What does Daniel do tonight?",
      choices: [
        {
          key: "a",
          label: "Play, the way he has every night since the spring",
          consequence:
            "Three hours and ten minutes, and about two of them are good. He is in bed at ten past two and awake at half six. On Thursday morning he cannot find the car keys and says something to Katie about it in a voice he hears himself using.",
          leaderNote:
            "Do not let the room dismiss this. Ask them to name what he actually gets in those two good hours, in specifics, and to say whether a man with three children under nine is entitled to it. Then ask who is paying, and when the bill arrives.",
        },
        {
          key: "b",
          label:
            "Go up now and be in bed before eleven for the first time in a month",
          consequence:
            "He lies awake until half twelve, which he had not expected, and the thing he lies awake doing is a slow inventory of tomorrow. He is up at half six anyway. By Thursday he has done it twice, felt no better either time, and cannot see the point.",
          leaderNote:
            "The group's first instinct, and it fails on Tuesday. Ask why. Sleep is not the same as rest, and Daniel has not gone to bed early, he has removed the only hours in which nobody wanted anything from him and put nothing in their place.",
        },
        {
          key: "c",
          label:
            "Play for one hour with an alarm set on the other side of the room",
          consequence:
            "The alarm goes at midnight and he stops, which surprises him. He is in bed by twenty past and asleep by one. It works for six nights. On the seventh he turns it off before it goes and plays until two, and does not tell anyone that either.",
          leaderNote:
            "The practical answer and it holds for six days. Ask what happened on the seventh — not what he did, what was different. Usually a bad day at the tolerable-and-dull job, which is the thing this case is quietly about and which nobody in the room will name first.",
        },
        {
          key: "d",
          label: "Play in the living room, with the light on and the door open",
          consequence:
            "It is a worse evening. He can hear the house, the headphones do not quite work over the fridge, and twice he looks up at nothing. He plays for ninety minutes instead of three hours and goes up almost annoyed about it. Katie hears him come to bed and says nothing.",
          leaderNote:
            "Nothing has been given up except the dark and the door, and it halved the evening. Ask what those two details were doing. The room will usually decide that they were making it restful; press until somebody says the other word, which is <b>hidden</b>.",
        },
      ],
    },
    {
      index: 1,
      situation:
        "Thursday, twenty to eight in the morning, and the thing about the keys has just happened. Katie does not react at all — no sigh, no look. She picks up the bag and asks Nell whether she has her reading book. It is the not-reacting that stops him in the hall.",
      prompt:
        "What does Daniel do about the thing his wife has stopped saying?",
      choices: [
        {
          key: "a",
          label: "Apologise for the keys, and leave the rest of it alone",
          consequence:
            "She accepts it easily and warmly and the morning recovers. He gets to work feeling better and by eleven he cannot remember why the hall felt like that. Nothing changes and nothing gets worse, which is how it has been going since March.",
          leaderNote:
            "The most common move and the least honest one, and worth saying so without cruelty. Ask what has been apologised for. The keys were the smallest thing in the hall and the only thing either of them mentioned.",
        },
        {
          key: "b",
          label: "Ask her directly why she stopped bringing up the nights",
          consequence:
            "She tells him, in the car, with Nell in the back, in about eleven words, and they are worse than anything he had braced for. Neither of them says anything for the rest of the journey. He thinks about it every day for a fortnight and it is the most useful fortnight he has had in a year.",
          leaderNote:
            "The bravest option, and notice it makes the week worse and the month better. Ask why she stopped. Most rooms guess exhaustion; the harder possibility is that she concluded it was not going to change, and a person who has concluded that has already begun leaving in some small way.",
        },
        {
          key: "c",
          label: "Tell her about the three hours before she has to ask again",
          consequence:
            "He says the number out loud in the kitchen and it sounds far worse spoken than it does at half eleven. She is not angry. She says <i>I know</i>, and then, after a moment, that she has known since February. They talk for twenty minutes and arrive nowhere and both feel oddly lighter.",
          leaderNote:
            "Confession without a plan, and the group will want to call it insufficient. Ask what it did. Ephesians 5 is about redeeming time, and the first thing he has done is stop spending it on the maintenance of a secret, which was costing more than the games were.",
        },
        {
          key: "d",
          label: "Ask her what three hours of her own would look like",
          consequence:
            "She laughs, and then does not, and then cannot answer the question, which shocks both of them. It takes her four days to come back with something, and it is small — a Saturday morning, alone, out of the house. He is more ashamed of the four days than of anything else that month.",
          leaderNote:
            "The answer that turns his legitimate need into a shared one. Ask the room what it means that she could not answer for four days. His claim was never wrong; it was only ever half the household, and he had not noticed the other half had no claim at all.",
        },
      ],
    },
    {
      index: 2,
      situation:
        "A fortnight on, and he is tired in a way that sleeping has not been fixing. Friday night, twenty past ten. Katie says, without looking up from her book, that he can go and play if he wants to, and he cannot tell from her voice which kind of sentence it is.",
      prompt: "What does Daniel do with the three hours?",
      choices: [
        {
          key: "a",
          label: "Take tonight, with her blessing, and be in bed by one",
          consequence:
            "He plays for two hours and it is the best of it he has had in months, largely because nobody is going to come downstairs. He is in bed at one and up at half six and it costs him about a day. On Monday he wants Tuesday too.",
          leaderNote:
            "Rest, taken openly, with a limit. It is a genuinely good evening and worth saying so — Mark 6:31 is Jesus telling tired men to come away and rest, not to be more disciplined. Then ask what Monday is about, because the wanting is the part that never went anywhere.",
        },
        {
          key: "b",
          label:
            "Move them — Saturday, six until nine, while the house is asleep",
          consequence:
            "The first Saturday is strange and the third one is the best morning of his month. He is finished before Nell is up, the whole day is still there afterwards, and he is not paying for it with Monday. He loses the thing where nobody in the world wants anything from him at midnight, and misses it.",
          leaderNote:
            "The answer that changes the price rather than the amount, and the most Psalm 90 thing available — numbering the days rather than cutting them. Do not skip the last sentence. Something real was lost, and a group that cannot name it has not understood what he was buying.",
        },
        {
          key: "c",
          label:
            "Trade them: he takes Tuesday and Thursday, she takes Wednesday and Sunday",
          consequence:
            "It requires a written note on the fridge, which they both find embarrassing, and it holds for five weeks. Her Wednesdays turn out to matter more than either of them expected. Twice he covers for her when he did not want to, and both times he is glad afterwards in a way he cannot fully explain.",
          leaderNote:
            "The structural fix, and the only option here where somebody else's rest improves. Ask why the note on the fridge was embarrassing. Households run on unwritten arithmetic that always favours whoever is willing to take without asking, and writing it down is what exposes that.",
        },
        {
          key: "d",
          label: "Spend the next three weeks looking for a different job",
          consequence:
            "He updates a CV that is four years out of date and applies for two things and hears nothing from either. He is still playing at midnight. But he is different at midnight — he has something running that is his and is not a game, and by the end of the month he has an interview and has told Katie about it.",
          leaderNote:
            "The answer nobody picks, and the one the case is quietly pointing at. Ask what a tolerable and dull job costs a man over ten years, and where he would go to get the difference back. Note that nothing about the three hours has changed here and something important has.",
        },
      ],
    },
  ],

  closing: {
    consequence:
      "A month on, Daniel still plays. Fewer hours, at a time he chose rather than a time that was left over, and Katie knows the number.<br><br>Nothing here established that the games were the problem. What the month produced was an exchange rate: three hours a night bought from tomorrow, paid for in a morning voice, a bedtime story, and a wife who stopped saying anything. That last one was the most expensive and the least visible.<br><br>Whether he is resting yet, or has only made the escape tidier, is what your group has to decide.",
    scriptureRefs: [
      "Ephesians 5:15-17",
      "Mark 6:31",
      "Psalm 90:12",
      "Matthew 11:28-30",
    ],
    leaderKey:
      "<b>Where this should land:</b> the first answer in the room will be <i>go to bed</i>. Accept it, then ask what happens on Tuesday when he is lying awake at half twelve with nothing in the place where the hours were. Daniel's need for unclaimed time is real, and Scripture is on his side about it: God commands rest, and Jesus takes tired men away from the crowd. The problem is the price and the payment terms.<br><br>The three better outcomes are all structural rather than moral — negotiate protected daytime hours, move the hours to a time that costs less, and deal with the tolerable-and-dull job, which is doing more damage than the games. A group that only produces willpower has not helped him.<br><br>The sentence to keep coming back to is that his wife stopped mentioning it in March. That is the most serious line in the case, and if your group leaves talking about Daniel's sleep rather than about Katie, the beat went badly.",
  },
} satisfies Scenario;
