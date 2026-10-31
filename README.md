# Harmonize

Harmonize is a private space to think things through, explore lived experiences, and choose what to share. The homepage establishes the visual language for the product; the interactive experience lives at `/app/`.

## Run locally

```bash
npm ci
npm run dev
```

Open <http://localhost:3000/> for the Motion Revival homepage or <http://localhost:3000/app/> for the product experience. The app is frontend-only while service integrations are being prepared.

## Product experience

The current screens support private conversations, a user-correctable understanding, community and story discovery, optional group participation, connection choices, personal reflections, and safety and support information. The interface adapts to desktop and mobile and respects reduced-motion preferences.

Fictional people and prepared content are identified in the interface. AI inference, transcription, accounts, persistence, messaging, community moderation, and professional services are not connected yet. User choices are local to the browser session and are not sent to other people.

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

GitHub Pages deploys from `main`: <https://aashikvilla.github.io/hormonise/>. The deployment workflow runs on every push to `main`.

## Historical material

Older product specs, captures, recorded films, scorecards, review reports, and legacy source live under [archive/](archive/). They are not loaded by the application.
