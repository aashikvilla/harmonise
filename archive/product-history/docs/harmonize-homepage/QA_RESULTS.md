# Homepage QA results

**Branch:** `feat/harmonize-home-motion-revival`  
**Base:** `work` at `8d19b78473646c38c49f4f3cceceac706128f113`  
**Reference source:** `public/harmonize-motion-revival.html` (handoff HTML SHA-256 before the documented accessibility/font-fallback corrections: `f19f32d1be04907962ebdec1dcc625c8d3f932d9da8aad55597fdb6b61ff9706`)

## Automated checks

- `npm run lint` — passed with four existing warnings in v23, v24, and v39 capture scripts; no errors.
- `npm run typecheck` — passed.
- `npm test` — passed, 27 tests across 3 test files.
- `npm run build` — passed; Next.js produced the static export and retained `/demo/`.
- `npm run test:e2e` — passed, 46 Playwright tests across desktop (1920×1080) and mobile (390×844) projects.
- `node tests/compare-homepage.mjs` — captured standalone-reference and Next.js-homepage pairs at 1440×900 and 390×844 with reduced motion enabled. Nineteen of the 22 state pairs are pixel-identical. The three small differences occur around clicked-tab focus and immediate mobile scroll/replay state; inspection showed no illustration, typography, color-field, or layout mismatch.
- `node tests/capture-homepage.mjs` — captured the live-motion React homepage scenes at 1440×900 and 390×844; no browser page errors.

## Interaction coverage

Playwright verifies the section navigation, reversible Beyond traveler, chat day switch/replay/restart, community host filter, all three distinct chapter illustrations and arrow-key tabs, sharing modal editing and focus return, mobile navigation, no horizontal overflow, and pointer-responsive hero plus reversible gathering motion. Reduced-motion mode is exercised on both viewport projects.

The original HTML script already provides the interactions; the React wrapper does not replace or approximate them. The `/demo/` flow remains covered by the existing browser tests, which now open that flow at `/demo/` because `/` is the requested marketing homepage.

## Screenshot index

Screenshots are saved in `screenshots/` as actual Chromium captures. Paired, static source-versus-Next comparisons are in `screenshots/comparison/`.

- Hero: [desktop](screenshots/desktop-hero-next.jpg), [mobile](screenshots/mobile-hero-next.jpg)
- Beyond paths: [desktop](screenshots/desktop-beyond-mid.jpg), [mobile](screenshots/mobile-beyond-mid.jpg)
- Conversation: [desktop](screenshots/desktop-conversation.jpg), [mobile](screenshots/mobile-conversation.jpg)
- Community: [desktop](screenshots/desktop-community.jpg), [mobile](screenshots/mobile-community.jpg)
- Reciprocity: [desktop](screenshots/desktop-reciprocity.jpg), [mobile](screenshots/mobile-reciprocity.jpg)
- Chapters: [Family](screenshots/desktop-chapter-family.jpg), [Work](screenshots/desktop-chapter-work.jpg), [Belonging](screenshots/desktop-chapter-belonging.jpg), with matching mobile captures in the same folder.
- Care and closing: [care](screenshots/desktop-care.jpg), [gathering start](screenshots/desktop-gather-start.jpg), [gathering end](screenshots/desktop-gather-end.jpg), with matching mobile captures in the same folder.

## Accessibility notes

Keyboard-arrow chapter switching, visible focus, Escape closure and focus return in the share dialog, mobile menu keyboard access, reduced-motion behavior, and narrow-screen overflow were exercised. Core text contrast is strong; the two important small-text disclaimers that fell below 4.5:1 were darkened as documented in `HOMEPAGE_PORT_DIFF.md` (now 5.84:1 in the care scene and 5.19:1 in the footer).

## Known deviation

The source’s homepage sections and SVGs are not individually converted into JSX components. The supplied full HTML runs in a titled iframe rendered by a small React component so its original DOM, SVG IDs, global CSS, and browser script stay unchanged and isolated from `/demo/`. See `HOMEPAGE_PORT_DIFF.md` for that tradeoff. No live AI, messages, membership, moderators, or professional support are represented as connected services.
