# Demo sign-in to community journey

## Goal

Give a visitor a no-account demo sign-in from the public homepage, then let them privately chat with Meta Muse Spark and opt in to reveal and join a relevant sample community. Document the exact flow and verify it in a browser.

## Changes

- Replaced `/connect`'s free-form member entry with a shared demo credential form for `Quiet Fern`; it requires 18+ and Meta-transfer confirmations.
- Kept the Coach preview as a separate entry tab.
- Prevented the demo submit control from becoming active until the client handler is hydrated. An immediate browser test had triggered a native GET before React attached the submit handler.
- Changed homepage CTAs to open `/connect` and explained that demo chat is sent to Meta Muse Spark while demo memberships remain local.
- Added `docs/DEMO_JOURNEY.md` with credentials, prompts, expected matches, and checks for a self-guided run.
- Added one Playwright browser journey and updated architecture, decision, and past-mistake notes.

## Verification

- `npm run lint` — passed.
- `npm run typecheck` — passed after the final source change. One earlier invocation ran concurrently with `next build`, which recreated `.next` and briefly removed generated Next types; rerunning after the build completed passed.
- `npm run build` — passed.
- `npx playwright test --config tests/playwright.config.ts tests/demo-journey.spec.ts` — passed, desktop and mobile (2/2). The advice endpoint was stubbed in this reproducible UI journey; no Supabase writes occur.
- Manually opened `http://127.0.0.1:3000`, signed in with the shared demo credentials, and submitted a generic routine prompt to the configured Meta endpoint. Meta returned a reflection and practical steps. A clearly fictional family-pressure scenario returned the `Finding steady ground` sample match after the explicit reveal action. Joined it and verified the sample circle prompt and feed in **My circles**. This only changed in-memory demo session state; it did not create a Supabase user, conversation, membership, or post.

## Notes

- Demo email/password are intentionally public and are not authentication credentials. Remove them if `/connect` becomes a persisted, authenticated product flow.
- Model matching is variable; `docs/DEMO_JOURNEY.md` identifies expected results, not guarantees.
- A live match lookup needs a separate Meta request after the explicit reveal action. Keep the private reflection and community discovery as distinct user-controlled steps.
