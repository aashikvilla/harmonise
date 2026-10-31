/** Fictional community history used while live services are being built. */
export type HistoricalDay = "Day 4" | "Day 9" | "Day 16";

export const historicalThread = {
  label: "Fictional story · fictional participants · written content",
  days: [
    {
      day: "Day 4" as const,
      title: "Naming the pressure",
      posts: [
        { role: "Arjun · fictional member", text: "I wasn't talking about separating. It's my parents. I can't say no without feeling ungrateful." },
        { role: "Ravi · fictional member", text: "I felt pulled between caring about my family and needing time to decide what I thought." },
        { role: "Nisha · fictional member", text: "I try to listen first. What feels hardest for you today?" },
      ],
    },
    {
      day: "Day 9" as const,
      title: "A conversation that stayed difficult",
      posts: [
        { role: "Arjun · fictional member", text: "I asked Dad for time. We argued. I'm still unsure what I want." },
        { role: "Ravi · fictional member", text: "For me, asking for a pause helped me finish a thought. It didn't settle the bigger question." },
      ],
    },
    {
      day: "Day 16" as const,
      title: "Keeping the question open",
      posts: [
        { role: "Arjun · fictional member", text: "It helped me realize I want a conversation without someone deciding for me." },
        { role: "Dev · fictional member", text: "I still don't know how to tell my family what I want. What helped you start?" },
      ],
    },
  ],
} satisfies { label: string; days: { day: HistoricalDay; title: string; posts: { role: string; text: string }[] }[] };
