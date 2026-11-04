# Harmonise end-to-end demo runbook

> **Current-state correction (2026-11-04):** Older instructions in this file were incorrect. `/connect` uses real email/password Supabase authentication and has a one-tap shared demo account. `/app` is the separate fictional, local-session prototype. The shared demo account persists activity; use fictional details only. The current cinematic script is [`END_TO_END_DEMO_SCRIPT.md`](END_TO_END_DEMO_SCRIPT.md).

## Release status

Production is deployed and healthy on the main commit `edbed0b`. The production readiness endpoint reported the database reachable and model configured. A stale preview build had occupied Vercel Hobby's single build slot; the Vercel project also had unsupported Node `26.x`. The project was changed to Node `24.x`, the stale preview was canceled, and the production deployment completed. `META_WONDER_ROUTES=setup,advice` is configured in production; Wonder is primary for those routes, with Spark fallback. This does not route every AI feature to Wonder.

The current production Supabase migration ledger includes the community engagement and server-only access migrations. Earlier statements that these were still unapplied were incorrect. No production content was seeded or mutated for this demo plan.

## Recording gates

- Use an isolated staging Supabase/Vercel environment and synthetic identities and content for write-heavy scenes. Do not seed posts, reports, reactions, featured journeys, or promotions into production for filming.
- `supabase/seed.sql` provides the three approved community records but does not supply a ready member journey: memberships and posts/replies are not populated by that seed. Provision a demo inbox, OTP-capable synthetic member, second alias for replies, synthetic reviewer, and fixture activity in staging before recording.
- Never use shared or example credentials from old guides. Sign in with a real staging Auth OTP account. The scripted story intentionally contains no identifying details.
- Production reviewer allowlisting is not configured. Proposals can be shown honestly as **pending human review**; do not show approval as available in production. Any approval scene belongs in staging with a designated reviewer and real coverage process.
- The consent text in `/connect` names Muse Spark, while production advice/setup routing is Wonder-first with Spark fallback. Correct and deploy that disclosure before recording the real AI flow. The member shell also labels authenticated pages “Prototype”; correct or clearly frame that UI label before public presentation.
- The old architecture note, older runbook content, and some UI labels are stale. Source code and current deployment configuration are the demo authority until the docs are reconciled.
- Verify production has readable community sample content only if a deliberate read-only check can confirm it is synthetic and approved for public display. Otherwise use staging fixtures. Do not expose private member narratives on camera.

## Scope boundaries to say aloud

- Real: email/password authentication, a one-tap shared demo account, private adviser requests, consent-gated community matching, joins, member-only feeds and community actions, proposal submission, moderation review flows, contribution summaries, and supporter applications, backed by Supabase routes.
- AI is assistive: adviser, optional proposal copilot, scoped community guide, and moderation triage/scope recommendations. Human actions remain required for moderation, launch, scope changes, and supporter-role decisions.
- `Muse Spark` is the default text model. `Muse Wonder` is enabled first for `advice` and `setup`; failures and invalid structured output can fall back to Spark. Chat, triage, guide, and stewardship remain Spark-based unless their route is explicitly changed. Voice transcription is a separate Muse Voice Transcribe endpoint inside the fictional `/app` experience, not the real `/connect` adviser.
- The fictional `/app` journey has richer scripted story beats and local-only interactions. Label it as a prototype; do not present its fixtures as real accounts, community activity, or persisted outcomes.
- No clinical, legal, financial, or emergency service, guaranteed peer reply, staffed monitoring SLA, booking, payment, or live coach directory is provided. Moderator decisions and human coverage are not automated.

## Technical walkthrough map

| Surface | Technology and behavior | What the audience should see |
| --- | --- | --- |
| Public homepage | Next.js App Router; responsive Harmonise visual system | Need, value proposition, entry point |
| `/connect` | Email/password through Supabase Auth; one-tap shared demo account | Age and AI processing disclosures at signup, authenticated alias |
| Adviser | `/api/advice`; Wonder first in production, Spark fallback; structured validation and rate limits | Reflection, one practical step, optional match shown only after an explicit reveal |
| Communities | Supabase-backed directory, membership, posts, replies, reactions, reports, blocks, delete-own, feature-own-journey | Real persisted actions using staged synthetic data |
| Proposal copilot | `/api/communities/propose/assist`; Wonder first, Spark fallback; user can edit before submission | Editable draft; submit remains private and pending human review |
| Community guide | Scoped to approved community scope and public metadata; Spark; no private posts/replies passed to model | Ask one bounded question; show scope disclosure and advisory response |
| Moderation | Spark advisory triage, Supabase queue and human reviewer decisions/appeals | AI signal separated from human decision; no automated enforcement |
| Journey/support roles | Contribution summaries and promotion requests; human-reviewed | Activity is not expertise; application remains pending until human review |
| `/app` prototype | Local fictional scenario; Muse Spark chat and Muse Voice Transcribe flow | Clearly labeled product exploration; local-only story/check-in state |
| Operations/account | Health/readiness, export/delete, notifications, daily cron surfaces as available | Mention only after checking live behavior; do not open admin/ops tools or expose personal records in a public recording |

## Recording checklist

- [ ] Confirm the exact production commit and `/api/ready` status immediately before filming.
- [ ] Use staging for all content mutations. Verify synthetic-only names, aliases, posts, replies, reports, and reviewer identities.
- [ ] Fix the stale Spark consent text and “Prototype” member-shell tag before showing authenticated production behavior.
- [ ] Ensure the demo inbox can receive OTP, browser is logged out before Scene 2, and a second synthetic account is available for reply context if used.
- [ ] Preload the relevant screens but do not pre-trigger model output. Allow time for live output and narrate that responses vary.
- [ ] Disable desktop notifications, hide email/address and browser password managers, close unrelated tabs, set 100% or 110% zoom, and use a clean browser profile.
- [ ] Use a 1920×1080 capture canvas at 30 fps; keep cursor movement deliberate. Pause 1–2 seconds after each important interaction and 3 seconds on result cards.
- [ ] Record clean room tone and voiceover separately if possible. Never record real inbox contents, private member posts, secret values, or admin tokens.
- [ ] If an AI response is slow or off-target, wait; if it fails, show the honest error/fallback and state that output can vary. Do not splice in an invented result as live output.
- [ ] For filming cuts, preserve the actual data state shown; disclose any time-compressed navigation or staging fixture overlay.
