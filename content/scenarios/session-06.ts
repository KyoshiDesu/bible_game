// Adapted from Session 6's primary case study, "Four Hundred Dollars", and its
// leader's key. Four beats rather than three, because the case has four
// tangled threads in it — the money, the concealment, the compulsion, and the
// parents' disagreement — and separating them is the work.

import type { Scenario } from "../scenario-schema";

export const session06Scenario = {
  id: "s6-four-hundred-dollars",
  sessionNumber: 6,
  caseTitle: "Four Hundred Dollars",

  premise:
    "Josh is sixteen. Over five weeks he spent four hundred and twelve dollars on a mobile game, chasing one limited character, using money from a summer job his parents had encouraged him to take.<br><br>He turned email receipts off in week two. That is the part nobody has quite dealt with.<br><br>When his mother found out she cried. His father said the money was his to lose and that the crying was manipulative, and said it in front of him. They have not spoken properly since.<br><br>Josh says he knows it was stupid. He also says he would do it again if the same character came back, and that he does not understand why everyone is treating a bad purchase as a moral failure.<br><br>You are his group. Over the next month, you decide what he does.",

  cast: [
    {
      name: "Josh",
      description:
        "Sixteen. Not ashamed of the money and not lying about that, which is the part the adults keep mistaking for defiance.",
    },
    {
      name: "Fiona",
      description:
        "His mother. Cried in the kitchen and has been humiliated about it twice since, once by her husband and once by herself.",
    },
    {
      name: "Ray",
      description:
        "His father. Holds a real principle about a young man's own money, and picked the worst evening of the year to hold it out loud.",
    },
  ],

  beats: [
    {
      index: 0,
      situation:
        "Wednesday evening, the kitchen, about four minutes after the number came out. His mother is at the table. His father is standing by the door and has just finished the sentence about the crying. Both of them are now looking at Josh.",
      prompt: "What does Josh say in the kitchen?",
      choices: [
        {
          key: "a",
          label: "That he is sorry, and he will pay it back out of his wages",
          consequence:
            "His mother relaxes and his father says that is not the point, and for about ninety seconds the room is nearly all right. He pays back sixty dollars over the next month and then stops, and nobody chases it, and by March it has become a thing the family does not bring up.",
          leaderNote:
            "The answer that buys the room and settles nothing. Ask what Ray meant by <i>that is not the point</i>, because he is right and cannot say why. Restitution is a real category and it addresses the smallest of the four problems in this kitchen.",
        },
        {
          key: "b",
          label: "That it was his money and he earned it",
          consequence:
            "His father cannot argue with it, having just said it himself, and his mother leaves the room. It ends the conversation cleanly and creates a permanent alliance between Josh and his father that neither of them wanted and both use for a fortnight.",
          leaderNote:
            "Josh has just used his father's principle as a weapon against his mother, and Ray handed him the loaded version of it. Ask the group what is true in the principle — it is genuinely true — and then ask what it is good for at nine o'clock on the worst evening of the year.",
        },
        {
          key: "c",
          label: "The true thing: that he would do it again",
          consequence:
            "The kitchen goes properly silent. His mother stops crying, which is not the same as feeling better. His father says <i>what?</i> in a voice with no anger in it at all. It is the first sentence anyone has said all evening that is about the actual problem, and nobody sleeps well.",
          leaderNote:
            "The most damaging thing he could say and the most useful. This is 1 Corinthians 6:12 in a sixteen-year-old's own words — not <i>was it allowed</i> but <i>who is in charge</i> — and he has answered it honestly. Ask the room whether they would rather have the apology or the truth.",
        },
        {
          key: "d",
          label: "Nothing. Go upstairs and let it be about the two of them",
          consequence:
            "He is upstairs in about forty seconds and it becomes about the two of them within a minute, and stays that way for two days. Nothing is asked of him and nothing is decided, and he plays that night, and does not spend anything, and counts that as evidence.",
          leaderNote:
            "Ask what the not-spending proved. He has taken one night's abstinence as a verdict on a five-week pattern, which is exactly what the rest of the room does about its own habits, and worth naming as such rather than as a teenager's excuse.",
        },
      ],
    },
    {
      index: 1,
      situation:
        "Sunday. The same character is back in the store for forty-eight hours, with a countdown on the front of it. His phone is face down on the counter. The receipts are still switched off, and nobody has mentioned that once.",
      prompt: "What does Josh do about the forty-eight hours?",
      choices: [
        {
          key: "a",
          label: "Turn receipts back on and tell his mother the banner is up",
          consequence:
            "She thanks him and does not ask anything else, and then checks her email three times that evening, which he notices. He does not spend. On Monday the countdown says nine hours and he sits with the phone face down for most of the afternoon, and does not spend, and it is the hardest afternoon of his month.",
          leaderNote:
            "The best outcome here and it is not comfortable. Ask what the receipts are for — not surveillance, but the removal of the conditions under which the last five weeks were possible. Then honour the afternoon. He did something difficult and nobody in the house saw it.",
        },
        {
          key: "b",
          label: "Turn the receipts on and say nothing about the countdown",
          consequence:
            "It is a real decision made privately and it half works: he spends nothing, and his mother finds out about the banner from an advert on Tuesday and cannot tell whether he knew. She does not ask. He can feel her not asking.",
          leaderNote:
            "Half of the right thing. Ask the group what the missing half costs. His mother now has a fact she cannot use and a question she is not allowed to ask, and that is the same house he was living in during the five weeks.",
        },
        {
          key: "c",
          label: "Delete the game",
          consequence:
            "It is gone in under a minute and he feels genuinely good for two days. By Monday he has installed a different one from the same publisher, and the loop is the same loop with different art, and nobody in the house knows to ask about it because it is not the game anyone was worried about.",
          leaderNote:
            "The dramatic answer, and the group will want to applaud it. Ask what was deleted. The mechanism moved house in four days, which is the difference between removing a game and understanding what it was doing.",
        },
        {
          key: "d",
          label: "Nothing. Spend nothing, tell nobody, and get through it",
          consequence:
            "He gets through it. Forty-eight hours, four hundred and twelve dollars still unspent, and not one person knows it happened. At dinner on Tuesday his father makes a joke about the money and Josh says nothing about the weekend, and something in him closes a little further.",
          leaderNote:
            "He succeeded, and it cost him something. Ask the room why. A private victory in a house where the problem was privacy has reinforced the thing that made it possible — and note that the father's joke is what shut the door, not the temptation.",
        },
      ],
    },
    {
      index: 2,
      situation:
        "Tuesday night. He can hear his parents downstairs and it stopped being about him some time ago. His mother says the word <i>manipulative</i> back to his father, and it is not a question.",
      prompt: "What does Josh do about his parents?",
      choices: [
        {
          key: "a",
          label: "Go down and say his father is right about the money",
          consequence:
            "It ends the argument in about twenty seconds and his mother goes to bed. His father is grateful and it is the closest they have been in a month. In the morning his mother is completely normal with him, and he would rather she was not.",
          leaderNote:
            "Ask what he has just bought and what with. A sixteen-year-old has ended his parents' argument by taking a side, which children have always been able to do and should not have to. The principle he defended is even true, which makes it worse.",
        },
        {
          key: "b",
          label: "Go down and say his mother was not being manipulative",
          consequence:
            "It does not end the argument; it moves it. His father says <i>this is not your conversation</i> and is right, and his mother says <i>let him talk</i> and is also right. It goes on for another twenty minutes and is the first twenty minutes in which anyone says anything true.",
          leaderNote:
            "The costly answer and the one that risks the relationship he currently has the most of. Ask the group whether it was his to say. It was not, and it needed saying, and both of those are the case.",
        },
        {
          key: "c",
          label:
            "Go down, say the whole thing is his fault, and ask them to stop",
          consequence:
            "They stop, and both reassure him, and he goes back upstairs having taken responsibility for something that is no longer about him. The argument resumes on Thursday about a different subject. He notices that, and files it, and does not know what to do with it.",
          leaderNote:
            "The most generous-looking answer and a false one — the argument was not his fault and he cannot end it by confessing to it. Ask what happens to a young person who learns that the way to stop a house being unhappy is to accept the blame for it.",
        },
        {
          key: "d",
          label: "Stay upstairs. It is not his to fix",
          consequence:
            "He puts headphones on and plays something free for two hours and it works. They are still going when he takes them off at half eleven, quieter now. In the morning nobody mentions it, and he is the only person in the house who knows what he did with those two hours.",
          leaderNote:
            "Defensible, and look where he went. Ask the room to notice the mechanism without moralising about it: the thing he reached for when the house got loud is the thing this session is about. That is not a character flaw, it is a design that works.",
        },
      ],
    },
    {
      index: 3,
      situation:
        "Two weeks later, and it is his father who suggests it: the three of them at the table, writing down what happens next, before the next banner rather than after it. Ray asks Josh what should be in it.",
      prompt: "What does Josh put in the plan?",
      choices: [
        {
          key: "a",
          label:
            "A number he decides in advance, each month, before he opens anything",
          consequence:
            "They land on twenty dollars, which Josh proposes and his father thinks is too high and his mother thinks is too low. He keeps it for three months. In February he goes twelve dollars over and tells them the same evening, unprompted, which nobody remarks on and everybody notices.",
          leaderNote:
            "The core of it. Ask why a pre-decided number works when willpower in the moment does not — the whole design of the store is aimed at the person deciding while the countdown is running. Then ask what February means. He reported an overspend, which is the plan working, not failing.",
        },
        {
          key: "b",
          label: "One adult he tells before he spends anything at all",
          consequence:
            "He picks his father, which surprises his mother and hurts her a little. It works twice and fails once, when he spends nine dollars on a Sunday and mentions it on Wednesday. Ray says <i>Wednesday's not before</i>, and lets it go, and Josh does not do it again.",
          leaderNote:
            "The relational half of the plan and the harder one to keep. Ask who Josh should have picked and whether it should be his choice. Then look at Ray's four words — a correction with no scene attached, which is the version of his principle that was needed a month ago.",
        },
        {
          key: "c",
          label: "No spending on any game until he is eighteen",
          consequence:
            "Everyone agrees to it in the room, and his mother is visibly relieved, and it is broken inside five weeks — for four dollars, on something small, in a way he does not tell anyone about. It is the first thing he has hidden since October.",
          leaderNote:
            "The rule the room will like most, and it manufactures the exact failure it was written to prevent. Ask why. A limit a person cannot keep does not produce obedience, it produces concealment, and concealment is the thread that actually hurt this family.",
        },
        {
          key: "d",
          label: "Nothing about money — a limit on how long he plays instead",
          consequence:
            "Ninety minutes on a school night, and he keeps it well. The spending is untouched by it: the store does not care how long he was there, only that he was there when the countdown was running. In January there is another banner and there is nothing in the plan about it.",
          leaderNote:
            "A good rule aimed at the wrong mechanism, and it is the misdiagnosis this session exists to correct. Ask the group what the game is actually selling and what it is measuring. Time was never the resource under attack.",
        },
      ],
    },
  ],

  closing: {
    consequence:
      "A month later, Josh still plays the game. There is a number on the fridge that he chose, receipts arriving in his mother's inbox, and one adult in the house who hears about a purchase before it happens rather than five weeks after.<br><br>The four hundred and twelve dollars is the least interesting thing in this story. The concealment mattered more, and <i>I would do it again</i> mattered more than both, because it was the only sentence anyone said that was an honest answer to Paul's question — not whether the thing was permitted, but who is in charge.<br><br>Whether Josh is in charge yet is what your group has to decide.",
    scriptureRefs: [
      "1 Corinthians 6:12",
      "Proverbs 23:4-5",
      "2 Peter 2:19",
      "Galatians 5:1",
    ],
    leaderKey:
      "<b>Where this should land:</b> guard against the pile-on before anything else. Josh is sixteen, he is in the room, and the fastest way to lose him is a group that agrees with his parents in unison.<br><br>Three things in order of weight. The concealment is worse than the amount, because turning off receipts in week two is the decision that made weeks three to five possible. <i>I would do it again</i> is worse than both, and it is not defiance — it is an accurate report from someone who has noticed he is not the one deciding. And Ray's principle is genuinely true: a young man's own money is his to lose, and saying so across his crying wife is the same sentence doing damage instead of work.<br><br>The outcome to aim at is a plan Josh helps write, with a pre-decided number, receipts switched back on, and one adult he tells before he spends. If the group produces a ban, ask them what happens in week five, and who he will tell.",
  },
} satisfies Scenario;
