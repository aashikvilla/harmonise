# Past Mistakes and Preventive Rules

## 2026-11-02 — A triage screen is not a live moderation system

The app's community posts and moderator screen are fixture-driven. Wiring a model to one reported sample post does not create a background agent, event feed, authorized staff workflow, or live monitoring. Describe the current feature as user-triggered triage only. Build the event queue, staff access, audit trail, policy, and human escalation before claiming that a community is monitored.

## 2026-11-02 — “Private in the browser” does not mean “not sent to a provider”

Once a user submits chat or voice for Meta processing, that input leaves the device even if Harmonise does not store it in a database. Disclose each transfer at the point of use, keep the provider key server-side, and avoid privacy/retention promises not backed by verified terms and implementation.

## Agent workflow rule — Parallel work must not share a writable checkout

Give concurrent agents isolated worktrees and bounded file ownership. Do not let parallel agents push directly to `main`; serialize integration through a reviewed, green merge gate.
