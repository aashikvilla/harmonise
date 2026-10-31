# Harmonise

Harmonise is an incremental upgrade of the existing Beyond Silence Next.js 16 / React 19 application. Its current v5 work focuses on a nonlinear personal companion and reciprocal community experience: people can move between topic-scoped conversations, communities, connections, a user-directed journey, and support choices without being forced through a wizard. The repository implementation is a **frontend fixture build**; it does not make Meta AI calls or connect to live people or services.

The root route (`/`) is the Harmonize Motion Revival homepage, an illustrative, interactive design concept. The existing product preview remains available at `/demo/`; its conversations, community actions, and other UI states continue to use local fixtures.

## What is implemented in the current frontend

The browser experience includes independent My Space, Communities, Connections, My Journey, and Find Support navigation; separate family and work conversation contexts within the current session; immediate, deterministic local example replies; a tentative understanding the user can confirm or correct; fictional group discussions and lived-experience stories; community join/read/reply flows with an explicit local preview; group-only connection request states; a reviewed, optional contribution flow; editable journey reflections and goal states; and illustrative reporting/moderation and professional-support screens.

These are local UI interactions, not server-backed operations. For example, a consented group reply is only recorded in the current browser session and is not published to other people; a moderation decision is only an example shown in this browser and does not change a real post or account. The screens identify fictional people and content.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm ci
npm run dev
```

Open <http://localhost:3000> for the Motion Revival homepage. Use `/demo` for the product-preview entry chooser or `/demo?path=talk` to open My Space. The UI is usable with fictional sample data and does not require credentials.

## Verification

The current frontend changes were checked with:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e -- --workers=1
```

The Motion Revival homepage port was checked with lint, typecheck, unit tests, the production build, and **46 desktop/mobile Playwright checks**. Results and homepage screenshots are recorded in [`docs/harmonize-homepage/`](docs/harmonize-homepage/). The build is a static export in `out/`. The screenshot inventory under [`evidence/v5/`](evidence/v5/) documents the separate fixture-mode product preview.

## Current v5 UI screenshot inventory

The screenshots in [`evidence/v5/`](evidence/v5/) document the fixture-mode interface:

- [01-my-space.png](evidence/v5/01-my-space.png)
- [02-understanding-shift.png](evidence/v5/02-understanding-shift.png)
- [03-relevance-comparison.png](evidence/v5/03-relevance-comparison.png)
- [04-community-thread.png](evidence/v5/04-community-thread.png)
- [05-ravi-human-connection.png](evidence/v5/05-ravi-human-connection.png)
- [06-reviewed-contribution.png](evidence/v5/06-reviewed-contribution.png)
- [07-connections.png](evidence/v5/07-connections.png)
- [08-moderation-review.png](evidence/v5/08-moderation-review.png)
- [09-provider-unavailable.png](evidence/v5/09-provider-unavailable.png)
- [10-mobile-navigation.png](evidence/v5/10-mobile-navigation.png)

These images show UI states backed by local examples. They do not demonstrate Meta inference, system architecture, real members, real moderation, or provider verification.

## Deployment and runtime status

The existing public site is [GitHub Pages](https://aashikvilla.github.io/hormonise/), deployed as a static export. GitHub Pages does not run the Next.js server routes needed for private Meta credentials, authenticated access, or server-side authorization. There is currently no configured Meta key, backend, authentication, database, persistent account state, live community, production messaging, staffed moderation service, or verified provider directory. The static deployment remains fixture-only; the latest v5 frontend changes are repository work and must not be described as live AI functionality.

## Meta AI, privacy, and service limits

- No Meta/Muse model call or speech-transcription request has been made. Chat replies are immediate local rules; there is no real model pending, failure, or retry state.
- No model evaluation was run. There are no measured relevance, source-grounding, privacy-leak, moderation, latency, token-cost, or wellbeing metrics to report.
- No raw audio is transcribed. The voice control is a browser recording/review demonstration with a manual text-entry fallback; text is not auto-sent.
- Messages and sample state are held in the browser session and reset when the page is refreshed. There is no account or secure server-side memory.
- Group membership, contributions, connection choices, reports, moderation decisions, and provider states are local examples. They are not sent to or visible to real people. The moderator and professional screens do not enforce production role permissions.
- All people, communities, posts, experiences, staff roles and replies are fictional fixtures. No contributor response is a real testimonial. No provider is verified or available through this build.

The v5 specification's live Meta integration, secure multi-user data boundaries, production community services, professional credential checks, actual human moderation, model evaluation and final narrated Meta-proof film remain incomplete. No API key is included in the repository or browser bundle.

## Film and video archive

The newest recording is a **fixture-only v5 interactive walkthrough**. It runs 139.5 seconds at 1920×1080 and has synthetic FFmpeg Flite narration with burned-in captions and an English SRT sidecar. The synthetic track is not professional or human voice narration. The walkthrough shows no real Meta inference, API call, messaging, or human participants; its people and replies are fictional fixtures. It is not the final v5 submission film and provides no real Meta evidence.

- [v5 fixture-only walkthrough MP4](demo-videos/harmonise-v5-interactive-walkthrough.mp4)
- [v5 walkthrough English SRT](demo-videos/harmonise-v5-interactive-walkthrough.en.srt)

The earlier **v3 sample-mode recording** remains historical. It predates the v5 product expansion, runs 173.5 seconds, and is silent, with burned-in narration text and an SRT sidecar. It is not the final v5 submission film.

- [Historical v3 MP4](demo-videos/harmonise-deep-human-journey-v3.mp4)
- [Historical v3 English SRT](demo/harmonise-deep-human-journey-v3.en.srt)
- [Historical v3 narration-ready script](demo/harmonise-deep-human-journey-v3.voiceover.md)
- [Earlier walkthrough v2](demo-videos/demo-walkthrough-v2.mp4)
- [Earlier walkthrough](demo-videos/demo-walkthrough.mp4)
- [Earlier final-film rehearsal](demo-videos/harmonise-final-film-rehearsal.mp4)
- [Earlier three-minute demo](demo-videos/harmonise-three-minute-demo.mp4)

All repository MP4 videos are collected under [`demo-videos/`](demo-videos/). See [the existing film capture checklist](docs/film-capture-checklist.md) for the v3 recording evidence and remaining film gaps.
