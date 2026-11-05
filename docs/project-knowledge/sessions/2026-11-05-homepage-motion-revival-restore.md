# 2026-11-05 — Restore the complete Motion Revival homepage

## Goal

Restore the previously approved, animation-rich homepage after the live-demo
preparation had replaced it with a shorter React recreation.

## Work completed

- Recovered the homepage source from Git commit `c0ed121` (`feat(home): port Harmonize Motion Revival homepage`).
- Restored `public/harmonize-motion-revival.html` and its titled iframe wrapper and isolated styles.
- The restored page contains eight major sections: hero, Beyond, conversation,
  communities, reciprocity, chapters, care, and closing. The original page also
  includes scroll/pointer motion, replay and filtering interactions, keyboard
  chapter switching, responsive artwork, and reduced-motion handling.
- Preserved the existing disclosure that story scenes are illustrative and
  fictional, and are not connected to live AI or community services.
- Left unrelated untracked demo review assets untouched.

## Verification

- Component and CSS module hashes match their exact versions at `c0ed121`.
- The restored HTML is 542 lines and contains all eight sections listed above.
- `git diff --check` passed.
- No test suite was run.

## Follow-up

The restoration is currently uncommitted on local `main`. Review and commit it
before deploying. A future React port must preserve the original sections and
interactions rather than shrinking the approved homepage for a recording.
