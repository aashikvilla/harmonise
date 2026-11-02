# Past Mistakes and Preventive Rules

## 2026-11-02 — A triage screen is not a live moderation system

The app's community posts and moderator screen are fixture-driven. Wiring a model to one reported sample post does not create a background agent, event feed, authorized staff workflow, or live monitoring. Describe the current feature as user-triggered triage only. Build the event queue, staff access, audit trail, policy, and human escalation before claiming that a community is monitored.

## 2026-11-02 — “Private in the browser” does not mean “not sent to a provider”

Once a user submits chat or voice for Meta processing, that input leaves the device even if Harmonise does not store it in a database. Disclose each transfer at the point of use, keep the provider key server-side, and avoid privacy/retention promises not backed by verified terms and implementation.

## Agent workflow rule — Parallel work must not share a writable checkout

Give concurrent agents isolated worktrees and bounded file ownership. Do not let parallel agents push directly to `main`; serialize integration through a reviewed, green merge gate.

## 2026-11-02 — Unlayered CSS resets silently beat Tailwind utilities

Global `a`/`button`/`input` element rules in `globals.css` were unlayered, so
they beat Tailwind v4's `@layer utilities` classes (`text-white`, `box-border`,
`selection:` variants) on every link, button, and field — 11 dark-pill labels
rendered invisible ink-on-ink while all DOM assertions still passed. Keep all
element-level resets and defaults inside `@layer base`, and prove text styling
with computed-style checks or screenshots, never `toBeVisible` alone.

## 2026-11-02 — Parallel E2E files must not share mutable backend state

Stateful Playwright journeys in separate files ran in parallel workers against
the same test users and community, leaving/rejoining over each other and
failing 1–2 tests per run while passing in isolation. Keep journeys that share
users or rows in ONE spec file (serial per file), isolate parallel projects
with per-project users/aliases, normalize membership at each journey's start,
and give live-backend files a longer `test.setTimeout`.
