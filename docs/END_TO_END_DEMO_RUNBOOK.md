# Harmonise end-to-end demo runbook

This runbook is the manual guide for reviewing the current hackathon journey. It separates the zero-setup prototype from the authenticated community backend so a demo never implies that local sample activity was saved to a real account.

## What this demo proves

- A visitor can open the home page, enter a fictional, private adviser conversation, and request a suggested circle.
- Muse Spark can return a supportive reflection and a likely community match. Model responses can vary, so matching examples below are expected outcomes, not fixed answers.
- A separate signed-in visitor can browse real Supabase-backed communities, propose a new one, and see it remain private until a human reviewer approves it.
- Every community receives a disclosed, community-scoped AI helper. It may provide advisory moderation triage; it cannot publish, remove, ban, or otherwise enforce actions.
- Visible member contributions can lead to private, community-scoped activity labels. Activity is not an expertise or trust score.

## Before the demo

- [ ] Open the deployed app (or the local app at `http://localhost:3000`) and confirm the home page renders.
- [x] Confirm the production Vercel project has `MODEL_API_KEY` and `META_TEXT_MODEL` configured. The key stays server-side.
- [x] Confirm Supabase migrations `0001`, `0002`, `20261102183254`, and `20261102183300` are applied. The community progress migration adds the contribution summary and optional verified-role table; the lifecycle migration adds launch review, helper provisioning, and launch status.
- [x] Confirm the production server has `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Never expose the service-role key to browser code.
- [ ] For the live proposal approval segment, configure `COMMUNITY_REVIEWER_USER_IDS` with the UUID of a real signed-in reviewer. The production role-verification flag is currently false; only turn it on for a deliberate role-verification demo.
- [ ] Have a real reviewer available who can honestly confirm the proposed space has human moderation coverage. The checkbox records an attestation; it does not schedule or staff future coverage.
- [ ] Use fictional stories only. A request sent to Muse is sent to the model provider; do not enter names, contact details, exact private messages, or identifying details.
- [ ] If testing live community changes, use consenting hackathon accounts and a newly proposed test community. Do not create test posts in an existing member community.

## Part A — Visitor to suggested circle (fictional prototype)

### Entry and sign-in

1. [ ] Open the home page and choose **Try the demo** / **Demo sign in**.
2. [ ] Sign in with the shared prototype credentials:

   - Email: `demo@harmonise.example`
   - Password: `MuseDemo2026!`
   - In-demo alias: `Quiet Fern`

3. [ ] Confirm the age and Meta AI disclosures before continuing.
4. [ ] Verify the interface reaches the adviser chat and that a wrong password is rejected.

These credentials are public demo-only credentials. They do not create a Supabase Auth user or a persisted profile.

### Prompt for the primary journey

Paste this fictional prompt into **Harmonise Adviser**:

> My family keeps pressuring me about a relationship decision. The pressure is disrupting my routine, and I want a calm way to think through what I actually want. Suggest one small step I can try this week.

Expected result:

- [ ] The adviser reflects the pressure without deciding the relationship question for the person.
- [ ] It offers one manageable next step.
- [ ] The private response does not publish the prompt to a community.
- [ ] Community matches remain hidden until **I’ve read this — show relevant communities** is selected.
- [ ] **Finding steady ground** is the expected match because it covers family pressure and disrupted routines. Review the “Why it fits” explanation.
- [ ] Choose **Join as alias “Quiet Fern”**, then **Open in My circles**. Confirm the circle, prototype label, fictional feed, and check-in appear.

This is client-side prototype state. Refreshing ends the demo sign-in and removes the local membership. No Supabase membership, message, post, or profile is created.

### Alternate synthetic prompts

Use one at a time. A specific result is not guaranteed because the adviser uses model output.

| Prompt | Expected circle | Match rationale |
| --- | --- | --- |
| “I’m rebuilding after a separation and trying to settle into a new routine. What’s one manageable thing to focus on this week?” | **Rebuilding after separation** | Starting over and routine changes after separation. |
| “I’m preparing for a conversation with a lawyer and feel overwhelmed by the questions I need to ask. Help me make a short list to bring.” | **Separation: practical clarity** | Peer support for preparing questions for a qualified legal professional. The adviser must not provide legal advice. |
| “I feel lonely and unsteady lately, and I’m trying to keep one small routine. What could make this week feel gentler?” | **Finding steady ground** | Loneliness and rebuilding steady routines. |

If the circle match is absent, clarify the support need with one of these prompts. Do not imply the match is guaranteed or reveal a circle before the visitor asks to see matches.

## Part B — Browse the real communities

1. [ ] Open **Communities** (`/communities`) in a separate browser session or after noting that this is the live backend, not the demo circle list.
2. [ ] Confirm the seeded community directory contains:

   - **Rebuilding after separation** — separation, divorce, breakup, co-parenting, identity change, and starting over.
   - **Separation: practical clarity** — peer discussion to prepare questions before speaking with a qualified legal professional.
   - **Finding steady ground** — uncertainty, grief, loneliness, family pressure, anxiety, and disrupted routines.

3. [ ] Open a community. Verify that a visitor who is not an active member cannot read its member feed or post.
4. [ ] If using a dedicated test account, join the test community using a non-identifying alias. Confirm the feed, past conversation, reply field, and report controls behave as expected.
5. [ ] If a peer replies, verify it appears in the conversation. A response from another human is not guaranteed; the product has no staffed response SLA.

These seeded communities are real database records. Seeded member samples shown in `/connect` are not Auth users and must not be described as live members.

## Part C — Propose a new community and approve it

This segment requires the applied community progress and lifecycle migrations, a real email-code account, an allowlisted reviewer, and actual human coverage for the proposed community.

### Submit a proposal

1. [ ] On `/communities`, select **Suggest a community**.
2. [ ] Complete the Supabase email-code sign-in using a consenting hackathon account.
3. [ ] Use this sample proposal (write it fresh; do not paste private chat history):

   - **Name:** `Calm co-parenting conversations`
   - **Purpose:** `A respectful peer space for sharing practical routines and emotional support while adjusting to co-parenting after separation.`
   - **Topics:** `co-parenting`, `family routines`, `starting over`

4. [ ] Submit and verify the proposal displays **Waiting for human review**.
5. [ ] Verify the proposer can see their own pending proposal but other visitors cannot discover, join, read, or post in it.
6. [ ] Verify the page discloses the provisioned AI helper and explains its advisory-only role.

### Review and approve

1. [ ] Sign in as the configured human reviewer and open `/moderation`.
2. [ ] Review the name, purpose, topics, and whether the community has an appropriate scope and real human coverage.
3. [ ] Confirm coverage only if a person has actually accepted moderation and escalation responsibilities. Leave the proposal pending if coverage is not arranged.
4. [ ] Approve. Confirm the reviewer becomes an active human moderator and the proposal changes to approved.
5. [ ] As the proposer, open the approved community, join if needed, and verify the community helper disclosure and member-only conversation.
6. [ ] Confirm the AI helper can only provide a triage signal to a human. No model result can hide a post, ban a member, or make a moderation decision.

Rejecting or leaving a proposal pending is a valid outcome when the proposed scope or coverage is not ready.

## Part D — Contribution progress and role verification

1. [ ] In the approved test community, add distinct, useful visible contributions over separate UTC calendar days. Each body must be at least 20 trimmed characters.
2. [ ] Verify the private member card reaches **Contributor** after 3 unique visible contributions on at least 2 UTC days.
3. [ ] Verify it reaches **Community regular** after 10 unique visible contributions on at least 5 UTC days.
4. [ ] Verify a duplicate body counts once across posts and replies; held or removed content does not count.
5. [ ] Verify the progress card describes activity, not skill, trust, expertise, or verified identity.
6. [ ] Keep `COMMUNITY_ROLE_VERIFICATION_ENABLED=false` for the standard demo. Optional human-reviewed role labels stay hidden while the flag is off; if enabled intentionally, a community moderator must review and assign them.

These thresholds are the current pilot parameters, not a finalized reputation system. Do not manufacture posts or change dates in the production project to force a level; use an isolated staging project for rapid progression testing.

## Part E — Voice and accessibility quick check

1. [ ] In the adviser, use the microphone control and grant browser microphone permission only if comfortable.
2. [ ] Verify a clear recording state, cancel/stop control, transcript preview, and an explicit send action.
3. [ ] Confirm the audio/transcript is sent for Meta processing only after the user chooses to submit, and review the disclosure shown in the UI.
4. [ ] Test keyboard-only use, visible focus, mobile layout, and reduced-motion preference.

Voice uses Meta Muse Voice Transcribe for speech input. Stop and do not submit if the device or app does not make the recording state clear.

## Completion checklist

- [ ] Visitor reaches the prototype chat from the home page and receives a supportive answer.
- [ ] Visitor explicitly requests circle suggestions and can join the expected fictional circle.
- [ ] The demo/live boundary is visible and no private prompt is copied to a live community.
- [ ] Signed-in visitor can browse member-only live communities and submit a new proposal.
- [ ] Pending proposal stays private; only an allowlisted reviewer can inspect and approve it.
- [ ] Reviewer confirms real coverage; approval assigns a human moderator and makes the community available.
- [ ] Community-specific helper is disclosed and advisory-only.
- [ ] Useful contribution levels are private and separate from optional verified roles.
- [ ] Loading, empty, signed-out, unauthorized, error, and success states are checked on the tested journey.
- [ ] Browser verification notes, date, deployment URL, migration state, and any blocked steps are recorded before presenting the demo.

## Current operational limits to disclose

- `/connect` is a fictional, browser-session prototype. The adviser model call can be real, but its circle joins and sample conversation are not persisted.
- `/communities` and `/moderation` are backed by Supabase and real Auth sessions.
- Community approval records the reviewer’s coverage attestation; it does not schedule a moderator or guarantee response time.
- The moderation processing route needs an operator or scheduled worker. Do not claim continuous automated monitoring until that schedule and on-call coverage exist.
- Other people may reply, but there is no guarantee that a community member or moderator will respond.
- Muse output and circle matches vary. The app is supportive peer navigation, not emergency, legal, or clinical advice.
