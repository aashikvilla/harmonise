# Harmonise cinematic demo

This is a **standalone, local-only product-story demo**, stored outside the Next.js app's source and excluded from Vercel by the root `.vercelignore`. Open a version's `index.html` directly in a modern browser. It makes no network calls, writes no backend data, and uses only synthetic names/content.

## Versions

- `v1/` — initial 7:20 interactive cinematic walkthrough, with chapter voiceover via browser speech synthesis and synthetic UI cards.
- `v2/` — reviewed revision: clearer time budget, keyboard chapter navigation, accessible live voiceover status, and more explicit labeling that the synthetic UI is an illustrative film treatment rather than screenshots from the live product.

Each version is preserved intact so changes can be compared. The root docs may describe the product, but the version folders are the actual runnable artifacts.

## Run

Open `v2/index.html`, press **Begin**, and use **Voiceover** to hear the current chapter. It uses the browser's installed speech voice, so delivery varies by browser and operating system. For a polished public release, record a human voiceover from the chapter scripts and mix it with product screen recordings captured from a synthetic staging environment.

Keyboard: `←` and `→` move between chapters; `Home` and `End` jump to the beginning/end; `Escape` stops narration. Reduced-motion preferences are respected. No app APIs or production data are used.

## Product truth and limits

This is a cinematic UI recreation, not an end-to-end executable copy of Harmonise. The screen cards are illustrative, and signing-in, model calls, community posts, moderation, and reviewer decisions are not actually executed here. The main film shows a synthetic journey and narrates the real product's behavior. The feature inventory and staging requirements are in the repository's `docs/END_TO_END_DEMO_SCRIPT.md` on the source branch; the demo artifact itself stays self-contained here.

Before filming live screens, use an isolated staging backend with synthetic OTP accounts and pre-seeded synthetic memberships/posts. Production currently has seeded community records but the checked-in community seed does not populate a complete member journey. Do not use production member content for cinematic footage.
