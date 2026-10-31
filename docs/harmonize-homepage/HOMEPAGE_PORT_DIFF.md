# Harmonize homepage port notes

## Source and route

The new `/` route uses the supplied Motion Revival v3 source document, stored at `public/harmonize-motion-revival.html`. The former React demo remains available at `/demo/` with its components and local state unchanged.

## Fidelity decision

The source is self-contained and includes the original inline SVG paths, all CSS, responsive variants, and the JavaScript that drives scroll, pointer, replay, community, consent-preview, and chapter interactions. The homepage renders that canonical document in a full-viewport, titled iframe from a small Next.js React component. This keeps its styles and browser-only code isolated from the shared app layout and avoids converting dozens of SVG subtrees or changing their geometry, IDs, and timing.

This is a deliberate deviation from the handoff's request to convert each section and SVG into reusable JSX components. It retains the original HTML as the single source of truth and gives visual parity with the supplied reference; the tradeoff is that the sections are not individually represented as React components, and embedded-page automation must target the iframe document. There are no added dependencies or changes to the existing `/demo/` feature.

## Content and behavior

The HTML is copied from the handoff archive and retains its “Harmonize” brand, fictional-content disclosure, reduced-motion rules, original path and character illustrations, authored sample conversation, topic tabs, community host filter, sharing preview, keyboard controls, and responsive mobile artwork. Two small disclosure colors were darkened for contrast: the care-scene note from `#7c9387` to `#52605a`, and the footer disclosure from `#998c94` to `#776776`. On their light backgrounds these change from roughly 2.8:1 and 3.2:1 to 5.84:1 and 5.19:1. The decorative arrow glyphs also use a DejaVu Sans fallback when present because the captured reference renders those arrows while this environment's default system sans displayed tofu boxes. Layout, wording, artwork, and motion are unchanged.

## Outstanding validation

See `QA_RESULTS.md` for the executed build, test, and screenshot evidence. Visual comparison images are under `screenshots/`.
