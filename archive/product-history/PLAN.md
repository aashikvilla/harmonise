# Harmonise incremental upgrade plan

Last updated: 2026-10-28 UTC
Status: P0 frontend journey implemented and verified on the current working tree.

## Product journey

The existing Next.js app is retained and its Beyond Silence screens are being incrementally refit for Harmonise. The demo demonstrates a private start, user-confirmed understanding, community discovery through fictional lived experiences, optional consented peer contact, and personal reflection.

## P0 implementation

- [x] Keep the existing Next.js App Router, React, TypeScript, Tailwind setup, `/` and `/demo` routes, and warm visual direction.
- [x] Provide Talk, Not sure, Read quietly, and Support others entry choices, with a labeled fictional Arjun example.
- [x] Guide the conversation with fixture answers; state clearly that arbitrary text is not interpreted by a live model.
- [x] Separate the person's source words from tentative themes and user-confirmed needs; allow correction to change community recommendations.
- [x] Make communities central, with Experiences, Discussions, People, and Guidelines views and clearly fictional content.
- [x] Provide contrasting fictional contributor stories with circumstances, attempts, reported helpful and unhelpful experiences, and relevant differences.
- [x] Support optional, consent-gated question preview to an exact fictional recipient; show one clearly simulated fixture reply.
- [x] Keep quiet reading available without an alias or question flow; support contributor consent, withdrawal, and a separate new chapter.
- [x] Finish with a user-chosen next step, optional private reflection, usefulness choices, and a skip path.
- [x] Keep demo data and state local and deterministic; make no external API or Meta inference calls.
- [x] Update setup instructions and the three-minute walkthrough in README.
- [x] Preserve old v1/v2 artifacts and domain tests as historical project context, not as the current product flow.

## Verification status

Final checks passed on the current working tree. Playwright completed 16 desktop/mobile executions; the responsive suite also asserted no horizontal overflow at 320px. Screenshots were reviewed at 1920×1080 and 390px.

| Check | Final status |
|---|---|
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | Passed, 19/19 tests |
| `npm run build` | Passed |
| `npm run test:e2e -- --workers=1` | Passed, 16 desktop/mobile executions |
| 320px responsive check | Passed, no horizontal overflow assertion |
| Screenshot review | Passed at 1920×1080 and 390px after navigation polish |
| `git diff --check` | Passed |

## Three-minute rehearsal

1. **0:00–0:12 — Choose a starting point.** Open Arjun's fictional example and frame the difficulty of naming a personal concern.
2. **0:12–0:32 — Share at a comfortable pace.** Choose the two sample answers; show that free text is not interpreted by a live model.
3. **0:32–0:48 — Confirm understanding.** Keep or correct suggested themes and support need.
4. **0:48–1:14 — Enter a community.** Open Family Expectations & Personal Choices and briefly show Experiences, Discussions, and People.
5. **1:14–1:43 — Read contrasting perspectives.** Open Ravi's story and show what he tried, what he reported, and where his situation differs.
6. **1:43–2:18 — Review the optional question.** Inspect the exact recipient and question, give consent, and show the clearly fictional reply.
7. **2:18–2:50 — Reflect and continue.** Choose usefulness and an optional next step; open My journey and the separate new chapter.
8. **2:50–3:00 — State the boundary.** This is a fictional frontend prototype; no Meta inference or real messaging occurred.

Quiet branch: restart, choose Read quietly, explore a story, and return without creating an alias or sending a question.

## Deferred stage

Real Meta-model inference is deferred until credentials, official API requirements, and a server-only adapter are available. Also deferred are persistence, authentication, live messaging, live community moderation, notifications, booking, and safety monitoring. The current UI must continue to label all fixtures and simulated activity honestly.
