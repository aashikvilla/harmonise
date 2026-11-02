# Harmonise demo journey

For the complete visitor-to-community walkthrough, live review steps, exact prompts, and verification checklist, see [END_TO_END_DEMO_RUNBOOK.md](END_TO_END_DEMO_RUNBOOK.md).

This guide describes the click-through demo from the homepage to a joined sample circle. The demo login is a client-side convenience, not authentication. It creates no Supabase account, private session, live membership, or community post. The adviser request is sent to Meta Muse Spark when the model key is configured, so use fictional details only.

## Demo sign-in

- Email: `demo@harmonise.example`
- Password: `MuseDemo2026!`
- Alias after sign-in: `Quiet Fern`

Confirm that you are 18 or older and that your message will be sent to Meta Muse Spark. These credentials are shared and public by design; do not reuse them anywhere else.

## Primary journey: family pressure → Finding steady ground

1. Open the homepage and select **Try the demo** or **Demo sign in**.
2. Sign in with the credentials above.
3. Confirm the age and Meta AI disclosures.
4. In **Harmonise Adviser**, submit this fictional prompt:

   > My family keeps pressuring me about a relationship decision. The pressure is disrupting my routine, and I want a calm way to think through what I actually want. Suggest one small step I can try this week.

5. Read the reflection and suggested steps. They should address the pressure without making the decision for you. The model may phrase its response differently on each run.
6. Select **I’ve read this — show relevant communities**. Matching stays hidden until this action.
7. The expected match is **Finding steady ground**, because the prompt describes family pressure and disrupted routines. Read its “Why it fits” note, then select **Join as alias “Quiet Fern”**.
8. Select **Open in My circles**. Verify the circle name, its “Prototype circle” label, the sample feed, and the gentle check-in prompt.

The result is a local demo membership shown in the current browser session. It does not create a live community membership or publish the private prompt.

## Observed live model run

In the local browser check, Muse Spark first answered this general routine prompt but did not return a strong community match:

> I want to make my morning routine more consistent. Suggest one small change that could make it easier this week.

The follow-up made the support topic clearer. Muse Spark then returned **Finding steady ground** after the user selected **I’ve read this — show relevant communities**:

> For a fictional adult, family pressure about a relationship decision is disrupting their routine. Suggest one calm small step they could try this week and the kind of peer community that may understand.

That is one observed run, not a guarantee; matching can change with model output.

## Alternate prompts

Use one prompt at a time. These prompts are synthetic; do not add names, locations, contact details, or real private messages.

| Prompt | Expected community | Why |
| --- | --- | --- |
| “I’m rebuilding after a separation and trying to settle into a new routine. What’s one manageable thing to focus on this week?” | **Rebuilding after separation** | Starting over and disrupted routines after separation. |
| “I’m preparing for a conversation with a lawyer and feel overwhelmed by the questions I need to ask. Help me make a short list to bring.” | **Separation: practical clarity** | Preparing questions for a qualified legal professional; the adviser should not give legal advice. |
| “I feel lonely and unsteady lately, and I’m trying to keep one small routine. What could make this week feel gentler?” | **Finding steady ground** | Loneliness and rebuilding steady routines. |

Community matching is model-generated, so these are expected results rather than guarantees. The model should offer guidance first and never name a community in its private reflection. If no match appears, try the clearer alternate prompt; do not reveal a match until you choose to.

## What to verify

- The homepage links open the demo sign-in screen.
- Wrong demo credentials are rejected; the displayed credentials continue to chat.
- The age and Meta-transfer confirmations are required.
- The chat shows a response and never posts the private prompt to the circle.
- Community matches stay hidden until you ask to see them.
- Joining shows the sample circle under **My circles**.
- A refresh ends the in-memory demo sign-in and local membership.

The sample members, posts, counts, and circle agent are fictional. This flow does not test live Supabase memberships or real community moderation.

## Live community proposal and activity examples

This is a separate authenticated flow, not part of the shared `/connect` demo account. It needs the Supabase community progress/lifecycle migrations and a real email-code account. A human reviewer account must be present in `COMMUNITY_REVIEWER_USER_IDS` to approve a proposal. Do not paste private chat text into the purpose field; write a fresh summary instead.

1. Open **Communities** and select **Suggest a community**.
2. Sign in with the email-code flow and suggest a name, a purpose of at least 20 characters, and optional topics. The form does not import chat history.
3. Verify the result is marked **Waiting for human review** and names a provisioned AI community helper. Open **View your proposal** to confirm no one else can join or post before approval.
4. Sign in as an allowlisted reviewer at `/moderation`. Review the purpose/topics, confirm a named person will cover moderation and escalation, then approve. The reviewer becomes a human moderator for that community.
5. Reopen the community to verify its helper disclosure and personal activity panel. Activity levels count unique, visible post/reply bodies of at least 20 trimmed characters: Contributor at 3 contributions on 2+ UTC days, Community regular at 10 on 5+ UTC days. They describe activity, not trust or expertise.
6. To see fictional level examples without creating test members, enter the `/connect` demo, open **My circles**, and look for **DEMO EXAMPLES · NOT LIVE MEMBERS**. These aliases are source fixtures only and never appear in live member counts.

The reviewer attestation is not proof of a staffed schedule. The AI helper only triages queued community content; the worker still needs an operator/schedule, and human response is not guaranteed. In browser automation, this journey uses stubbed API responses and does not write to Supabase; for a real backend check, apply both migrations and use dedicated consenting test accounts.
