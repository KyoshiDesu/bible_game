// Adapted from Session 8's primary case study, "Two Names", and its leader's
// key. The temptation in the room is to decide that the church version of Sam
// is the fake one. Both are real; that is the problem, and the scenario is
// built so that no path lets the group off that.

import type { Scenario } from "../scenario-schema";

export const session08Scenario = {
  id: "s8-two-names",
  sessionNumber: 8,
  caseTitle: "Two Names",

  premise:
    "Sam is on the welcome team. He has been for six years. People describe him as gentle, and as unusually good at remembering names — he learns them the first Sunday and uses them the second, and several people have said it is the reason they came back.<br><br>In ranked voice chat he is somebody his teammates report and mute. Sarcastic, contemptuous, and every so often genuinely vicious, usually about somebody's mother.<br><br>He does not think of these as the same man doing both things. If you pressed him he would say the lobby version is not real.<br><br>Last month a seventeen-year-old from the youth group joined his lobby by accident and heard all of it. He has not told anyone at church.<br><br>You are Sam's group. Over the next three weeks, you decide what he does.",

  cast: [
    {
      name: "Sam",
      description:
        "Thirty-four. Two names, one of which he would defend in public and one of which he would say does not count.",
    },
    {
      name: "Callum",
      description:
        "Seventeen. Recognised the voice inside about four seconds and has been carrying it on his own for a month.",
    },
    {
      name: "Dee",
      description:
        "Runs the welcome team. Would tell you Sam is the best person on it and would be telling the truth.",
    },
  ],

  beats: [
    {
      index: 0,
      situation:
        "Thursday, eleven at night, two rounds into a bad game. Somebody on the team says <i>my bad</i> and the voice is Callum's, from the youth group, unmistakable. Sam has already said three things this match that he would not want repeated.",
      prompt: "What does Sam do in the lobby, right now?",
      choices: [
        {
          key: "a",
          label: "Say nothing and hope the name on screen means nothing to him",
          consequence:
            "He plays the rest of it almost silently, which the others notice and one of them jokes about. Callum says nothing either. They lose. Sam sits in the dark afterwards for a while working out how likely it is, and decides it is about fifty-fifty, and does not sleep well.",
          leaderNote:
            "Ask what the fifty-fifty is doing to him. He has not repented, he has calculated exposure, and Psalm 139 is precisely the text that removes that arithmetic — there is no lobby in which he was unobserved, and the boy is a smaller problem than the one he has just discovered he can live with.",
        },
        {
          key: "b",
          label: "Use his name. Say hello, in front of everyone",
          consequence:
            "There is a pause of about two seconds and then Callum says <i>oh — hi Sam</i>, in a voice that has decided to be normal. Nobody else understands what just happened. The rest of the match is polite and strange and Sam does not say another unkind thing, and neither of them mentions it afterwards.",
          leaderNote:
            "The bravest thing available inside four seconds, and it does not undo the three things already said. Ask the group what changed the moment the name was used. It is the same man in both places and he has just made that fact audible, which is the whole session.",
        },
        {
          key: "c",
          label: "Leave the game",
          consequence:
            "He is gone inside a minute and takes the penalty. It removes him from the room and it also leaves Callum on a team that is now a man down, with the same two people still in it, for another twenty minutes. Sam does not think about that part until Sunday.",
          leaderNote:
            "Flight, and it is not nothing — he has stopped. Then ask who he left behind. The instinct to remove himself from the scene of the thing is real repentance in embryo and it is also, here, the second time this evening he has treated the boy as scenery.",
        },
        {
          key: "d",
          label: "Apologise to the whole lobby, without naming anything",
          consequence:
            "He says <i>sorry lads, I've been out of order tonight</i>, and one of them says something derisive and the other two say nothing. It is genuinely humiliating. Callum types <i>it's ok</i> into the team chat where only Sam can see it, which is somehow the worst part of the evening.",
          leaderNote:
            "A real cost, publicly paid, and aimed slightly to the left of the person who needed it. Ask what Callum's two words in the private channel are doing. A seventeen-year-old has just started managing an adult's shame, and that is a job he should not have.",
        },
      ],
    },
    {
      index: 1,
      situation:
        "Sunday morning, ten to ten, and Sam is on the door. Callum comes in behind his mother, catches his eye, and says <i>morning</i> exactly the way he always does. His mother says something about the weather and they go in.",
      prompt: "What does Sam do about Callum?",
      choices: [
        {
          key: "a",
          label: "Take the cue. Say morning back and let it be nothing",
          consequence:
            "It is a good service and he is good on the door, and he remembers two new names. Over the following fortnight he greets Callum four times and Callum greets him back four times, and the two of them build something small and completely false that will hold for years.",
          leaderNote:
            "The path of least resistance, taken by a genuinely kind man, and it is the one that most of the room will recognise. Ask what has been made here — not concealed, made. Luke 12:2-3 is worth reading aloud at this point rather than earlier.",
        },
        {
          key: "b",
          label: "Find him after and ask what he heard",
          consequence:
            "Callum tells him, accurately, in about a minute, including one sentence Sam had forgotten saying and does not recognise as his. Then he says <i>I haven't told anyone</i>, as though offering something. Sam thanks him for that, and hears himself do it, and it is the worst moment of his month.",
          leaderNote:
            "The information-gathering answer, and watch where it ends. He has accepted a seventeen-year-old's silence as a gift. Ask the group what has just been agreed between them and who is now protecting whom.",
        },
        {
          key: "c",
          label: "Find him after and apologise, before he is asked anything",
          consequence:
            "It takes ninety seconds in the car park and Sam does not explain, qualify, or ask him not to tell anyone. Callum is visibly relieved and says almost nothing. Three weeks later Callum asks him a question about something else entirely, which he had not done before.",
          leaderNote:
            "The best available answer and notice what is absent from it — no explanation, no request for silence. Ask the room why the second one matters so much. An apology with a condition attached is a transaction, and the boy would have accepted it and learned the wrong thing.",
        },
        {
          key: "d",
          label: "Tell Dee about it himself, before anyone else does",
          consequence:
            "Dee listens, is quiet for a moment, and then says the thing he was not braced for: <i>does Callum know you've told me?</i> He has not thought about that. She asks him to go and say so before the end of the day, and he does, and it is a harder conversation than telling her was.",
          leaderNote:
            "Self-disclosure to the right person, and Dee's question is the one worth stealing. Ask the group who owns this story. Sam has confessed something that has another person inside it, and doing that without telling them is a second small act of the same kind.",
        },
      ],
    },
    {
      index: 2,
      situation:
        "Two weeks later. Ranked, a bad game, and he can feel the sentence assembling before he has decided anything. Nobody in his life has raised any of this since Sunday. The mute button is under his thumb and so is the microphone.",
      prompt: "What does Sam do with the second name?",
      choices: [
        {
          key: "a",
          label: "Delete the account and start again under his own name",
          consequence:
            "He loses six years of rank, which matters more than he wants to admit, and plays for a fortnight as somebody with nothing to defend. It is quieter and much less fun. In the second week he says something unpleasant under the new name and stops mid-sentence, appalled, because it turns out the name was not the mechanism.",
          leaderNote:
            "The dramatic answer and the most instructive failure in the scenario. Ask what he expected the deletion to remove. Colossians 3 tells the Colossians to put off the old man and put on the new — that is not a rename, and Sam has just found that out in public.",
        },
        {
          key: "b",
          label: "Keep the account, and never turn the microphone on again",
          consequence:
            "It works completely. He plays for months without saying an unkind word because he does not say anything, and he is a slightly worse teammate and a considerably better man on Thursdays. He also stops enjoying it, and about once a fortnight he types something he would not want read out.",
          leaderNote:
            "Removing the occasion, and it is a genuine and ancient strategy — do not let the room sneer at it. Then ask about the typing. Ask whether a fence around a mouth reaches a heart, and what the honest answer is at the end of a losing game.",
        },
        {
          key: "c",
          label: "Keep both, and tell one person at church that both exist",
          consequence:
            "He tells Dee properly, which takes an hour and is worse than the first version. She asks him twice more over the next three months, at inconvenient moments, without warning. He is furious about it once. He is also, by March, someone his teammates have stopped muting, and he could not tell you which month that changed.",
          leaderNote:
            "The slowest answer and the only one where somebody else can see the pattern. Ask why the inconvenient timing matters. A question you can prepare for is one you can pass, and he has just given somebody permission to ask him when he is not ready.",
        },
        {
          key: "d",
          label: "Nothing. It was one boy, one bad night, and it has passed",
          consequence:
            "It has passed. The lobby is the same, the door is the same, and Callum is still coming on Sundays. In November another young man from the church joins a lobby by accident, and it is not Sam's, and hears somebody else, and tells nobody either.",
          leaderNote:
            "Ask the room to sit with the last sentence rather than explaining it. The scenario has stopped being about Sam. Several people in your group are Sam to some degree, and the tone you take in the next two minutes decides whether any of them ever says so.",
        },
      ],
    },
  ],

  closing: {
    consequence:
      "Three weeks on, Sam is still on the welcome team and still good at it, and still remembers names on the first Sunday.<br><br>Nothing here settled which of the two men was the real one. That was always the wrong question: the gentleness on the door is not a performance and the contempt in the lobby is not a costume, and a person who can do both is not two people, he is one person with a room he thought nobody could see into.<br><br>Whether that room has anyone in it now besides him is what your group has to decide.",
    scriptureRefs: [
      "Psalm 139:1-3",
      "Luke 12:2-3",
      "Colossians 3:8-10",
      "2 Corinthians 5:17",
    ],
    leaderKey:
      "<b>Where this should land:</b> read Luke 12:2-3 out loud during the discussion rather than before it, and read it after somebody has already said that the lobby version does not count.<br><br>Refuse the easy conclusion in both directions. The room will want to decide either that the church Sam is a hypocrite's mask or that the lobby Sam is a harmless release valve, and both let everyone go home. Both are real, and one man is doing both, and Psalm 139 has already removed the category of the unobserved room that the whole arrangement depends on.<br><br>Watch your group rather than the case. Several of them are Sam to some degree and they know it by about the third minute, and the tone you take here — dismay, or contempt, or the plain assumption that this is ordinary and dealable-with — decides whether anybody in the room ever admits it. If the group leaves having condemned Sam, the beat went badly. If one person says <i>I do that</i>, it went well, and the only right response is to thank them and move on quickly.",
  },
} satisfies Scenario;
