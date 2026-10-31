<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Harmonize visual and testing guidance

- Treat the current Harmonize homepage as the visual reference for future pages. Keep new and updated pages consistent with its typography, color palette, gradients, spacing, illustration style, motion, responsive behavior, and calm, supportive tone. Reuse existing design tokens and components where practical rather than introducing a competing visual system.
- Preserve accessibility in every page: semantic structure, keyboard operation, visible focus, readable contrast, reduced-motion support, and responsive layouts.
- Do not add unit tests. For meaningful product behavior, prefer a small number of high-level browser end-to-end tests that exercise complete user journeys and visible outcomes. Avoid tests that only mirror implementation details.
