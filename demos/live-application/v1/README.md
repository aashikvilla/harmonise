# Harmonise live application demo · V1

This folder contains the recording plan, capture script, and final footage of the running Harmonise application. It is kept outside `src/` and is excluded from Vercel by the repository's `/demos/` ignore rule. It contains no alternate HTML product UI.

## Recording truth

- Capture the deployed Next.js app and its real Supabase and Meta responses in a clean browser profile.
- The shared production demo account is persistent. Sign-in itself is authorized; do not join communities, post, react, report, create proposals, or otherwise write community activity during the take.
- Do not show member-only posts or identifying member details in the public recording. The production directory currently has one active, populated community (58 memberships and 15 visible posts), so the demo will show the real counts and community boundary without exposing member stories.
- The demo-account membership is empty. Do not call that seed data. No isolated Harmonise staging project or Supabase branch is available, so synthetic user/post fixtures are not being written to production.
- A voice-only capture may be transcribed to an editable draft and left unsent. Private chat persistence is real, but avoid adding a conversation to the shared account unless the take explicitly includes a real private-chat exchange and then removes that session.
- No therapist directory or booking, public volunteer roster, direct member messaging, continuous moderation, or autonomous community publication exists. The AI setup flow drafts a private proposal; human review is required before launch.

## Files

- `storyboard.md` — shot order, narration, holds, scroll cues, and substantiated product/technology claims.
- `capture-v1.mjs` — browser capture using Playwright video of the live app; no mock APIs or seeded browser responses.
- `recording/` — raw browser capture and final voiceover mix. Keep temporary audio and images out of the deployed app.

## How to capture

Run the script against the production alias after the change is merged and the deployment is READY:

```powershell
$env:DEMO_BASE_URL = "https://harmonise-weld.vercel.app"
node demos/live-application/v1/capture-v1.mjs
```

The script signs in through the shared demo button, waits for real service responses, and records read-only pages plus the AI adviser. It checks that the adviser result includes server-returned model attribution and that the authenticated private-chat screen exposes Meta voice transcription. It does not click any community write action. The voice narration and edit pass are separate: never speed up or replace a real model response to hide latency.

If the live AI, voice endpoint, or data service is unavailable, the script stops with a clear error rather than filling the screen with prepared content.
