<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Harmonize visual and testing guidance

- Treat the current Harmonize Motion Revival homepage as the visual source of truth for every page. The shared palette is warm milk `#fffaf5`, plum ink `#342f43`, coral `#af554f`, soft coral `#cf8176`, peach `#f6d8c7`, lilac `#e7e1f7`, pale blue `#d8eaf1`, sage `#dbe9df`, and warm line `#eaded8`.
- Keep typography, heading scale, spacing, rounded controls, soft layered shadows, hover feedback, logo geometry, illustration style, motion, responsive behavior, and calm supportive tone consistent across pages. Use the homepage's `harmonize.` wordmark and loop symbol on product screens. Prefer original, purposeful vector illustrations in the homepage style over stock imagery or generic icon collections.
- Use gentle entrance and scroll reveals where they clarify hierarchy. Every motion must remain reversible where practical, must not block content, and must respect `prefers-reduced-motion`.
- Preserve accessibility in every page: semantic structure, keyboard operation, visible focus, readable contrast, reduced-motion support, and responsive layouts.
- Do not add unit tests. For meaningful product behavior, prefer a small number of high-level browser end-to-end tests that exercise complete user journeys and visible outcomes. Avoid tests that only mirror implementation details.
