# Live product film · V2 extended cut

**Target runtime:** exactly 3:00. The 177-second narration has a 1.2-second pause between sentences and a short quiet end hold. Narration is mixed into the final H.264/AAC MP4; captions are burned in, included as a selectable subtitle track, and supplied as SRT. 1920×1080 at 25 fps. All app footage is captured from the working production application.

## Story promise

Show the need before the interface: difficult decisions can be hard to explain and risky to share too soon. Harmonise offers private reflection, a small practical step, then optional peer connection. Meta models assist in narrow roles; members and human reviewers keep control.

## Timed edit and screen direction

| Time | Picture / action | Narration topic |
| --- | --- | --- |
| 0:00–0:20 | Start on the real animated homepage. Hold the exact headline, loop mark, and window illustration; scroll through the problem and member-led journey. | The problem, who Harmonise serves, and why the first step can stay private. |
| 0:20–0:30 | Click **See how it feels** and use **Continue with demo account**. | Peer connection is optional; this is not clinical care. Sign in to the live product. |
| 0:30–1:14 | Hold the live Adviser. Send two different prompts, wait for each real Meta answer, and show model attribution. Reveal relevant communities only after the member asks. | Two real conversations, Muse Wonder as first choice, possible Muse Spark fallback, and the member’s control. |
| 1:14–1:23 | Open `/communities`; wait until the live Supabase directory is fully rendered and show actual names/counts. | Real community records and aggregate activity; member-only stories stay private. |
| 1:23–1:41 | Open **Suggest a community**, enter the caregiving idea, click **Draft with Meta**, and show the returned editable scope. Leave it unsubmitted. | Meta’s setup draft, editable boundaries, and human review before a new community opens. |
| 1:41–1:57 | Open `/app`; send one message in a real saved private chat and show the live reply, actual model label, and tentative themes. | Muse Spark’s saved private chat and member review of suggested themes. |
| 1:57–2:14 | Record the supplied phrase, stop, and leave the full transcript visible in the composer. Do not send it. | Meta Muse Voice Transcribe as speech-to-text, with an edit/review step before sharing. |
| 2:14–2:48 | Return to the homepage AI section; hold the three model-role cards and the peer-support boundary. | Muse Wonder, Muse Spark, Voice Transcribe, scoped guide and advisory moderation uses, human decisions, supporter roles, and technology. |
| 2:48–3:00 | Scroll to the impact close and let the final CTA sit for a clear pause. | Intended impact, no measured-outcome claim, and the member’s next-step choice. |

The capture script uses fixed scene slots and explicit per-call deadlines. It waits for real output, then uses the remainder of that slot as a readable hold. If a response misses its deadline, it fails the capture rather than showing a partial answer or substituting prepared text. Finalization pads the last frame and silence to exactly 180 seconds.

## Voiceover script

| Cue | Narration |
| --- | --- |
| 0:00 | You don't need the right words to begin. |
| 0:04 | A family decision or major life change can be hard to name, harder to share before you feel ready. |
| 0:13 | Harmonise offers adults facing pressure a private place to reflect and find one practical next step. |
| 0:22 | Peer connection is optional; the product is not therapy, diagnosis, or emergency care. |
| 0:30 | The shared demo account enters the same real authentication flow and running product. |
| 0:38 | Here, a live Meta Muse response reflects the member's question and offers language for asking family for time. |
| 0:47 | A second live prompt adds the realities of coordinating care between siblings in different cities. |
| 0:55 | Muse Wonder is the first choice for reflection and setup, with Spark as fallback; the label identifies which model replied. |
| 1:06 | If Wonder's output fails checks, the server retries with Spark. Private reflection never posts automatically. |
| 1:16 | Only when the member chooses do matches appear; the directory's real names and counts come from Supabase. |
| 1:25 | When no space fits, Meta can draft a proposed community scope from the member's idea. |
| 1:33 | Purpose, topics, boundaries, norms, and starter prompts stay editable; a human reviews before launch. |
| 1:43 | In saved private chat, Meta Muse Spark gives a live reply and suggests tentative support themes. |
| 1:52 | The member can review or correct those themes before exploring communities. |
| 1:59 | Muse Voice Transcribe turns a spoken thought into text the member can review and edit. |
| 2:06 | Here the transcript stays in the composer, unsent. No speech is shared without the member's next choice. |
| 2:16 | Spark also powers scoped community guidance and advisory moderation triage. People make consequential decisions. |
| 2:27 | Volunteer and verified-supporter roles require human review; they are peer support, not a therapist directory. |
| 2:37 | Next.js connects the interface and server routes; Supabase handles identity and product data; Meta models power member-chosen features. |
| 2:49 | Our intended impact is a gentler first step and clearer choices. We have not measured outcomes. |

## Exact prompts

**Adviser turn 1:** “I feel pressured to decide for my family before I am ready. How can I ask for more time without shutting anyone out?”

**Adviser turn 2:** “My siblings and I share caregiving from different cities. What is one practical question we could ask each other this week?”

**Community name:** “Coordinating family caregiving”

**Purpose:** “Adults sharing practical ways to coordinate support for an aging parent across siblings and different cities. This is for routines and communication, not medical or legal advice.”

**Topics:** “family communication, caregiving routines, shared responsibilities”

**Private chat:** “I keep changing my mind about what my family needs. Can you help me find a way to ask for one more day?”

**Voice input:** “I feel pressured to decide for my family. I need more time.”

## Model map shown in the story

- **Meta Muse Wonder**: first choice for live private Adviser reflections and editable new-community setup drafts, with Muse Spark fallback. The UI attributes the model that actually answered.
- **Meta Muse Spark**: saved private chat, scoped community guidance, and moderation triage for human reviewers. Triage is advisory and cannot decide, publish, hide, ban, or contact members.
- **Meta Muse Voice Transcribe**: turns spoken audio into an editable draft. It is not sent until the member chooses to submit it.
- **Supabase Auth and Postgres**: sign-in, private saved chat, and real public community names and aggregate activity.
- **Next.js**: application UI, server routes, authentication boundaries, model calls, and data access.

## Audio/caption review

- Confirm the exact 180-second MP4 has audible AAC narration; also provide standalone MP3/WAV for inline preview compatibility.
- Check the first, middle, and final captions for timing, safe areas, and legibility over light and dark sections.
- Confirm both Adviser turns and the saved-chat turn are live AI outputs with their serving model labels.
- Ensure the complete voice transcript appears, with no repeated speech, and stays unsent.
- Never show member-only posts, email addresses, or private identifiers.
