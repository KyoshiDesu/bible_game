// Adapted from Session 1's primary case study, "Delete the Library?", and its
// leader's key. The theology and the discussion questions still land after the
// room has played it, which is the point of deriving rather than inventing.

import type { Scenario } from "../scenario-schema";

export const session01Scenario = {
  id: "s1-delete-the-library",
  sessionNumber: 1,
  caseTitle: "Delete the Library?",

  premise:
    "Marcus is twenty-four. He works nights at a distribution centre, came to faith eight months ago, and has about two hundred games in a library he has been building since he was fourteen. Most of them are harmless. A handful he has started to feel uneasy about, though he could not tell you when that began.<br><br>Last Sunday an older man at church named Dennis told him that if he were serious about Jesus he would delete the whole account and not look back. Dennis was kind about it. He was also completely certain.<br><br>Marcus is genuinely willing. He is also quietly grieving, because the three friendships he would call close all live in that library, and two of those friends have never been inside a church.<br><br>You are his group. For the next fortnight, you decide what he does.",

  cast: [
    {
      name: "Marcus",
      description:
        "Twenty-four, eight months in Christ, works nights. Wants to do the right thing and has no idea what it is.",
    },
    {
      name: "Dennis",
      description:
        "Sixty-one. Watched his own son disappear into a screen for three years. Everything he says about this comes from somewhere true.",
    },
    {
      name: "Ravi",
      description:
        "Marcus's closest friend, four years running, entirely through a headset. They have never met. He has no interest in church.",
    },
  ],

  beats: [
    {
      index: 0,
      situation:
        "Sunday night, just after nine. The house is quiet and his shift does not start until eleven. He opens the laptop and the launcher opens with it, the way it has every night for ten years. Dennis's sentence is still sitting where he left it.",
      prompt: "What does Marcus do tonight?",
      choices: [
        {
          key: "a",
          label:
            "Start deleting the account, before he can talk himself out of it",
          consequence:
            "He finds the button and works through three confirmation screens. The last one stops him: the account will be permanently deleted in thirty days, and signing in even once cancels it. He signs out and closes the lid. By Thursday the clock is still running and he has told nobody.",
          leaderNote:
            "Most rooms will feel this is the brave answer. Ask what he has actually decided — the grace period means he has bought a fortnight, not obeyed. Whether that is cowardice or wisdom is exactly the question, and both readings are available.",
        },
        {
          key: "b",
          label:
            "Uninstall the handful he is uneasy about, keep the rest, say nothing",
          consequence:
            "It takes eleven minutes. Eleven games, most of them barely played and one of them not. He feels better than he expected and worse than he wants to admit, because Dennis did not say <b>some</b>. By Thursday he has not mentioned it to anyone.",
          leaderNote:
            "The answer most rooms are quietly hoping for, and not a bad one — it is the only option where he acts on his own conscience rather than on Dennis's. Press hard on <b>say nothing</b>. That is where it goes wrong, not in what he kept.",
        },
        {
          key: "c",
          label: "Message Ravi and the others and tell them what Dennis said",
          consequence:
            "Ravi replies in four minutes: <i>so we're done?</i> The other two say nothing for an hour, then one of them sends <i>are you serious though</i>. Marcus does not answer either. By Thursday all three know something has changed and none of them knows what.",
          leaderNote:
            "Ask what the group thinks this costs him. Telling two people outside the church that his church has an opinion about their friendship is a kind of witness, and it is also a threat to the friendship. Both are true at once, which is the whole session in miniature.",
        },
        {
          key: "d",
          label: "Nothing tonight — take it to the group on Thursday first",
          consequence:
            "He plays for an hour he had not planned on and enjoys about forty minutes of it. Afterwards he writes down two questions for Thursday and by morning has forgotten one. By Thursday nothing has changed, and he is embarrassed about that.",
          leaderNote:
            "The slowest option, and the one that looks like avoidance. Ask whether taking a fortnight over a decision like this is faithlessness or ordinary wisdom — and what would have to be true to make it one rather than the other.",
        },
      ],
    },
    {
      index: 1,
      situation:
        "Thursday, ten past four in the afternoon. He is awake before his shift and there is a message from last night: <i>you've been weird all week. are we playing or not</i>. They have played on Thursdays for four years.",
      prompt: "What does Marcus say back to Ravi?",
      choices: [
        {
          key: "a",
          label:
            "The truth — someone at church told him to give it up and he doesn't know yet",
          consequence:
            "Ravi reads it twice. <i>ok. tell me when you know.</i> Then nothing, for two days, which from Ravi is loud. By Sunday Marcus has checked the conversation eleven times.",
          leaderNote:
            "The honest answer, and it costs him the thing he was trying to protect. Ask the group whether the silence that follows is Ravi being hurt or Ravi being patient — they cannot tell, and neither can Marcus, which is the point.",
        },
        {
          key: "b",
          label: "That he's busy for a while, and leave the reason out",
          consequence:
            "<i>no worries</i>, says Ravi, and means it. They do not play. Nothing is wrong and nothing is right either, and the not-saying sits in the middle of it. By Sunday Marcus has decided twice to explain and twice not to.",
          leaderNote:
            "Not a lie, and not the truth. Worth naming that most of us live here most of the time. Ask what it is costing — usually the answer is that it costs nothing now and everything later.",
        },
        {
          key: "c",
          label: "Nothing. Play tonight as normal and work it out afterwards",
          consequence:
            "They play for three hours and it is the best evening he has had in a fortnight. He laughs twice at something Ravi says. He feels sick about it at four in the morning, on the floor of the warehouse, in a way he cannot separate from the tiredness. By Sunday he has not decided anything.",
          leaderNote:
            "Notice the group's discomfort that the evening was genuinely good. Do not let them resolve it too quickly: a thing can be a delay and a real friendship at the same time, and Session 1 is about refusing to answer that with a rule.",
        },
        {
          key: "d",
          label:
            "Ask if they can meet somewhere — in person, for the first time",
          consequence:
            "There is a long pause, and then <i>yeah alright. saturday?</i> They meet at a coffee place neither of them would have chosen and talk for two hours, forty minutes of it about something else entirely. Marcus never quite says the thing he came to say. By Sunday they have a plan to do it again.",
          leaderNote:
            "The answer nobody expects, and the one that changes the category: the friendship stops being a thing inside a game. Ask what it would take for the group to suggest this to a real person, and why nobody thinks of it first.",
        },
      ],
    },
    {
      index: 2,
      situation:
        "Sunday. Dennis finds him by the door before he can reach the car, puts a hand on his shoulder, and asks how he got on.",
      prompt: "What does Marcus say to Dennis?",
      choices: [
        {
          key: "a",
          label: "The truth: he's keeping most of it, and here is why",
          consequence:
            "Dennis listens all the way to the end, which Marcus had not expected. Then he says, <i>I hope you're right</i>, and means both halves of it. They stand there for a moment not knowing how to finish, and then Dennis asks about his shifts.",
          leaderNote:
            "The best available outcome and it still ends awkwardly. Say so. Groups expect faithfulness to feel resolved; this is what it usually feels like instead.",
        },
        {
          key: "b",
          label: "That it's sorted — and sort it out privately",
          consequence:
            "Dennis is visibly relieved, and says he will pray for him, and does. Marcus gets to the car and sits in it for a while. Nothing he said was exactly false and he cannot work out why he feels like it was.",
          leaderNote:
            "The concealment option, and the one Session 4 comes back for. Ask what has been trained here — not what has been done, what has been trained. Once is a decision; twice is a habit.",
        },
        {
          key: "c",
          label: "Ask Dennis what he is actually afraid of",
          consequence:
            "Dennis does not answer for long enough that Marcus starts to apologise. Then he tells him about his son, and about three years, and about the sound of a door that did not open. It takes four minutes. Neither of them mentions the account again that morning.",
          leaderNote:
            "The question that turns a ruling into a person. Ask whether Marcus is now more or less free to keep his library — the honest answer is that he is less free and more loved, and the group should sit with that rather than fix it.",
        },
        {
          key: "d",
          label: "Ask Dennis to sit down with him and go through what to keep",
          consequence:
            "Dennis says yes so quickly that it is obvious nobody has asked him for anything in a long time. They arrange Tuesday. Marcus spends Monday night dreading it and turns up anyway, and it takes an hour and a half, and they disagree about four of them.",
          leaderNote:
            "The most costly answer and the most Corinthian one — he has made his freedom answerable to someone. Ask what Marcus gives up by doing this, and whether the group would actually advise it or only admire it.",
        },
      ],
    },
  ],

  closing: {
    consequence:
      "A fortnight after Dennis's sentence, Marcus still has an account. He has eleven fewer games, one friend who knows what is going on, and one older man in the church who has been let closer than he was.<br><br>Nothing about that is a verdict. What he has that he did not have a fortnight ago is a set of questions he can carry, and one person who has agreed to ask him about it in a month.<br><br>Whether that is enough is what your group has to decide.",
    scriptureRefs: [
      "1 Corinthians 10:23-24, 31",
      "1 Corinthians 6:12",
      "Romans 12:2",
    ],
    leaderKey:
      "<b>Where this should land:</b> the room will want to score the paths. Refuse that. The two failure modes are the same as the written case — a blanket permission that skips past <i>a handful he has started to feel uneasy about</i>, and a blanket prohibition that treats three real friendships as disposable.<br><br>The strongest thing to draw out is that no path here removed the question. Every ending leaves Marcus with the same three tests from 1 Corinthians 10 and a decision he has to keep making. If your group leaves with a verdict for Marcus, the beat went badly. If they leave with the questions they would want him asking, and the name of someone who will ask them, it went well.",
  },
} satisfies Scenario;
