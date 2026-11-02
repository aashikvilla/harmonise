# Harmonize

Harmonize is a private space to think things through, explore lived experiences, and choose what to share. The homepage establishes the visual language. `/app` and `/connect` are demonstration journeys; `/communities` and `/moderation` are the Supabase-backed community and reviewer surfaces.

## Run locally

```bash
npm ci
npm run dev
```

Open <http://localhost:3000/> for the Motion Revival homepage. Browse `/app` or `/connect` for the fictional demo journeys, or `/communities` and `/moderation` for the authenticated live-community flows. Meta calls run in server-side routes.

## Product experience

The demo screens support private conversations, a user-correctable understanding, fictional story discovery, local demo participation, reflections, and support information. Live communities support authenticated membership, posts, replies, reports, human-reviewed moderation, and private per-community AI guidance. The scope migrations are deployed to Supabase. The interface adapts to desktop and mobile and respects reduced-motion preferences.

Fictional people and prepared content in `/app` and `/connect` are identified in the interface; those demos do not become live community posts. Live community posts and moderation records use Supabase. The setup copilot, member guide, voice transcription, chat, adviser, and triage each disclose their Meta transfer at the point of use. Model output never makes a moderation decision. On Vercel Hobby, the worker runs once daily and handles one queued event per run; this is not continuous moderation, and human coverage is not staffed.

## Meta Model API

The app uses Muse Spark 1.3 Standard mode for context-aware chat, theme suggestions, the separate `/connect` adviser, and user-triggered reported-post triage. Muse Voice Transcribe handles reviewed voice recordings. All model calls happen in server routes; the API key is never sent to the browser.

Create a local environment file from the template and add your key:

```powershell
Copy-Item .env.example .env.local
```

Set `MODEL_API_KEY` in `.env.local`. `META_TEXT_MODEL` defaults to `muse-spark-1.3`. Do not add a `NEXT_PUBLIC_` prefix or commit `.env.local`. For hosted deployments, add the same variables as protected server runtime secrets.

The Meta routes include `/api/chat` (private conversation and structured theme suggestions), `/api/advice` (the `/connect` adviser), `/api/voice/transcribe` (WAV transcription), `/api/moderation/triage` (reported-post triage), `/api/communities/propose/assist` (optional community setup drafting), and `/api/communities/[id]/guide` (private, scope-grounded answers for active members). Moderator-selected scope review is available at `/api/communities/[id]/scope-proposals`; it does not scan posts in the background or apply changes without a human decision. The scope schema is deployed to the live Supabase project. Human moderation decisions are still required.

`META_SETUP_MODEL` is server-only, defaults to `muse-spark-1.3`, and may select `muse-wonder-1.0` only outside production for controlled synthetic evaluation. It has no automatic fallback. Do not use Contributor mode for sensitive user content.

## Visual direction

Follow the Motion Revival homepage for the logo, typography, warm coral and lilac palette, illustrated scenes, rounded controls, soft shadows, hover states, and restrained scroll motion. Repository-level guidance is in [AGENTS.md](AGENTS.md); historical homepage comparisons and QA evidence are archived in [archive/product-history/docs/harmonize-homepage/](archive/product-history/docs/harmonize-homepage/).

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

Do not add unit tests. Use high-level browser E2E tests for meaningful product journeys. Existing unit tests remain for the current state model until that code is replaced.

## Deployment

The model routes require a Node server, so deploy as a server app rather than a static export. Add `MODEL_API_KEY` and `META_TEXT_MODEL` as protected runtime secrets. The `Verify Harmonise build` workflow runs lint, typecheck, unit tests, and a production build on every push to `main`.

Run `npm run dev` after configuring `.env.local`. Open `/app/` for the primary chat and `/connect` for the separate adviser experience. Without a key, model-powered actions show an unavailable state and keep the user's text available to retry.

## Historical material

Older product specs, captures, recorded films, scorecards, review reports, and legacy source live under [archive/](archive/). They are not loaded by the application.
