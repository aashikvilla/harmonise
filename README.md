# Harmonize

Harmonize is a private space to think things through, explore lived experiences, and choose what to share. The homepage establishes the visual language for the product; the interactive experience lives at `/app/`.

## Run locally

```bash
npm ci
npm run dev
```

Open <http://localhost:3000/> for the Motion Revival homepage or <http://localhost:3000/app/> for the product experience. The app uses Meta Model API from server-side routes; community members, stories, messages, and moderation decisions remain fictional.

## Product experience

The current screens support private conversations, a user-correctable understanding, community and story discovery, optional group participation, connection choices, personal reflections, and safety and support information. The interface adapts to desktop and mobile and respects reduced-motion preferences.

Fictional people and prepared community content are identified in the interface. Private chat uses Muse Spark when a server key is configured. Voice transcription uses Muse Voice Transcribe only after the user records, reviews, and asks Meta to transcribe. The reported-post demo can request Muse Spark triage; a person remains responsible for every moderation decision. Accounts, durable persistence, real community messaging, continuous monitoring, and professional services are not connected. Chat text is sent to Meta when a message is submitted; session choices otherwise stay in the browser.

## Meta Model API

The app uses Muse Spark 1.3 Standard mode for context-aware chat, theme suggestions, the separate `/connect` adviser, and user-triggered reported-post triage. Muse Voice Transcribe handles reviewed voice recordings. All model calls happen in server routes; the API key is never sent to the browser.

Create a local environment file from the template and add your key:

```powershell
Copy-Item .env.example .env.local
```

Set `MODEL_API_KEY` in `.env.local`. `META_TEXT_MODEL` defaults to `muse-spark-1.3`. Do not add a `NEXT_PUBLIC_` prefix or commit `.env.local`. For hosted deployments, add the same variables as protected server runtime secrets.

The routes are `/api/chat` (private conversation and structured theme suggestions), `/api/advice` (the `/connect` adviser), `/api/voice/transcribe` (WAV transcription), and `/api/moderation/triage` (reported-post triage). The moderation UI currently submits a fictional sample report; this does not monitor a live community or enforce staff permissions. Human decisions are still required.

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
