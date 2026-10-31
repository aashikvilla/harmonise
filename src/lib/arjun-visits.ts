export type VisitTurn = { id: string; role: "you" | "harmonise"; text: string };

export type ArjunVisit = {
  id: string;
  day: string;
  title: string;
  intention: string;
  turns: VisitTurn[];
};

/** Fictional conversation history. These are fictional transcripts, not model outputs. */
export const arjunVisits: ArjunVisit[] = [
  {
    id: "day-1",
    day: "Day 1",
    title: "Something feels strange",
    intention: "Leave the question open",
    turns: [
      { id: "d1-u1", role: "you", text: "Things at home feel strange. I don't even know how to explain it." },
      { id: "d1-a1", role: "harmonise", text: "You don't have to make it neat first. Would it feel easier to say what changed, or just stay with the feeling for a moment?" },
      { id: "d1-u2", role: "you", text: "I keep getting asked if I'm happy. I say yes because I don't want to start something." },
      { id: "d1-a2", role: "harmonise", text: "It sounds tiring to answer before you know what you think. I won't assume what the question is about." },
      { id: "d1-u3", role: "you", text: "Maybe it is nothing. Everyone is kind to me." },
      { id: "d1-a3", role: "harmonise", text: "Kindness and pressure can sit beside each other. You can decide whether that fits, or leave it aside." },
      { id: "d1-u4", role: "you", text: "I don't want advice tonight." },
      { id: "d1-a4", role: "harmonise", text: "Okay. No advice. We can pause here, and you can come back if you want." },
      { id: "d1-u5", role: "you", text: "I'll leave it for now." },
      { id: "d1-a5", role: "harmonise", text: "That's fine. Nothing needs to be decided tonight." },
      { id: "d1-u6", role: "you", text: "Actually, can I keep this somewhere and return later?" },
      { id: "d1-a6", role: "harmonise", text: "This conversation stays in this browser session. In a real service, storage and deletion choices would need to be clear before you rely on them." },
    ],
  },
  {
    id: "day-4",
    day: "Day 4",
    title: "Correcting the assumption",
    intention: "Voice transcript is editable",
    turns: [
      { id: "d4-u1", role: "you", text: "I wasn't talking about separating. It's my parents. I can't say no without feeling ungrateful." },
      { id: "d4-a1", role: "harmonise", text: "Thank you for correcting me. I had framed it as a marriage decision, and that was wrong. You're talking about your parents and the guilt around saying no." },
      { id: "d4-u2", role: "you", text: "Yes. I love them. I also want some choices to be mine." },
      { id: "d4-a2", role: "harmonise", text: "Both can be true. Would it help to hear how others handled family expectations, without anyone telling you what to do?" },
      { id: "d4-u3", role: "you", text: "Maybe. Please don't show me legal advice. That came up when I searched." },
      { id: "d4-a3", role: "harmonise", text: "I can set that aside. I'll keep the focus on family pressure and personal choice, if that still feels right to you." },
      { id: "d4-u4", role: "you", text: "That is closer. I still don't want a big group knowing all this." },
      { id: "d4-a4", role: "harmonise", text: "You can read quietly. A private conversation doesn't become a group post unless you review and approve the exact text and audience." },
      { id: "d4-u5", role: "you", text: "Could I say one sentence out loud? Typing feels strange." },
      { id: "d4-a5", role: "harmonise", text: "Voice transcription is not connected yet. You can review and edit the words before using them." },
      { id: "d4-u6", role: "you", text: "I tried saying: I want to ask Dad for a little time before I answer." },
      { id: "d4-a6", role: "harmonise", text: "You can change that sentence, keep it, or discard it. It doesn't need to be sent anywhere." },
      { id: "d4-u7", role: "you", text: "Keep the first part. Maybe not 'a little time'—I need a week." },
      { id: "d4-a7", role: "harmonise", text: "A week is your wording. Would you like to keep exploring, or stop here?" },
      { id: "d4-u8", role: "you", text: "I'll read first. I'm not ready to ask anyone." },
      { id: "d4-a8", role: "harmonise", text: "That's completely okay. Quiet reading doesn't commit you to joining or replying." },
    ],
  },
  {
    id: "day-9",
    day: "Day 9",
    title: "A conversation that didn't go smoothly",
    intention: "Practical preparation, no victory lap",
    turns: [
      { id: "d9-u1", role: "you", text: "I might try talking to Dad, but I lose my words when he gets disappointed." },
      { id: "d9-a1", role: "harmonise", text: "Would a small opening sentence help? It can be a draft for you, not a promise to use it." },
      { id: "d9-u2", role: "you", text: "Maybe: I need you to trust me. That sounds too sharp." },
      { id: "d9-a2", role: "harmonise", text: "What would sound more like you? You can also leave the draft unfinished." },
      { id: "d9-u3", role: "you", text: "Could I try saying: I need until next weekend to think?" },
      { id: "d9-a3", role: "harmonise", text: "That is your draft. You can keep it, change it, or not use it." },
      { id: "d9-u4", role: "you", text: "I want to prepare before I try anything. I don't need to send it to anyone." },
      { id: "d9-a4", role: "harmonise", text: "We can leave it as a draft. Nothing here commits you to act." },
      { id: "d9-u5", role: "you", text: "Maybe I'll come back after I've talked to Dad." },
      { id: "d9-a5", role: "harmonise", text: "You choose when to return, and what you want to talk about then." },
      { id: "d9-u6", role: "you", text: "I'll try when there's a quieter time." },
      { id: "d9-a6", role: "harmonise", text: "Nothing to prove. You can change the plan or leave it." },
    ],
  },
  {
    id: "day-16",
    day: "Day 16",
    title: "A question with clear boundaries",
    intention: "Ask Ravi in the group only",
    turns: [
      { id: "d16-u0", role: "you", text: "I tried talking to Dad. He listened, but we argued." },
      { id: "d16-a0", role: "harmonise", text: "That sounds disappointing. Being heard for part of it doesn't erase the argument. What do you need right now?" },
      { id: "d16-u0b", role: "you", text: "I don't want to call it a success. I also don't want to start over." },
      { id: "d16-a0b", role: "harmonise", text: "We don't have to label it. We can keep the parts you want and leave the rest unresolved." },
      { id: "d16-u1", role: "you", text: "I read Ravi's story. It sounds familiar, but his family is different from mine." },
      { id: "d16-a1", role: "harmonise", text: "That's a useful difference to keep in view. His story is one person's experience, not a template." },
      { id: "d16-u2", role: "you", text: "Can I ask if he ever found a way to pause a conversation?" },
      { id: "d16-a2", role: "harmonise", text: "Ravi's story allows a question in the group only. You can review the exact alias, audience and wording first." },
      { id: "d16-u3", role: "you", text: "Use QuietRiver. Just ask about pausing, no details from my chat." },
      { id: "d16-a3", role: "harmonise", text: "Your private conversation is excluded. Only the question you approve will appear in the group story." },
      { id: "d16-u4", role: "you", text: "Okay. Show me the exact share before I decide." },
      { id: "d16-a4", role: "harmonise", text: "This fictional response is not live. You can close it or keep reading." },
      { id: "d16-u5", role: "you", text: "His answer sounds imperfect. I don't think it solves anything for me." },
      { id: "d16-a5", role: "harmonise", text: "It doesn't have to solve it. You can take one small idea, disagree, or leave it." },
      { id: "d16-u6", role: "you", text: "I'll leave it open. Maybe I'll return after some time." },
      { id: "d16-a6", role: "harmonise", text: "You can come back without deciding what the conversation means." },
      { id: "d16-u7", role: "you", text: "I'm still a seeker here. But if someone asks the same question, maybe I can say what I tried." },
      { id: "d16-a7", role: "harmonise", text: "Only if you choose. You can review a separate contribution and audience, and keep your own support private." },
    ],
  },
];

export const arjunTurnCount = arjunVisits.reduce((count, visit) => count + visit.turns.filter((turn) => turn.role === "you").length, 0);
