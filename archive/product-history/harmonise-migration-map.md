# Harmonise migration map

This is an incremental update of the existing Beyond Silence Next.js App Router project on branch `work`. It keeps `/` and `/demo`, the installed Next.js/React/Tailwind toolchain, and the existing cream, teal, sage, and editorial visual direction. The prior v2 implementation remains in the repository's domain test history; the visible journey now uses the Harmonise domain model and supplied synthetic fixture data.

| Existing file or capability | Decision | Harmonise result |
|---|---|---|
| `src/app/page.tsx` landing | Refactor | Harmonise proposition, four direct entry choices, explicit Arjun example, privacy/safety link, fictional demo notice. |
| `src/app/demo/page.tsx` | Preserve route; adapt | Existing `/demo` route reads Next 16 async search params for selected entry route. |
| `src/components/demo-experience.tsx` | Refactor in place | Existing central experience now renders entry, conversation, understanding, discovery, community, story, question, reflection, journey, contribution, and help screens. |
| `src/lib/demo.ts` and `demo.test.ts` | Preserve as existing v2 reference | Existing deterministic types/reducer/tests remain available; the new active route uses `src/lib/harmonise.ts`. |
| `src/lib/harmonise.ts` | Add | Typed domain fixture adapter, predictable reducer, consent allowlist, correction-driven community selection, contributor withdrawal and chapter transition. |
| `src/lib/harmonise-demo-data.json` | Add from supplied attachment | Synthetic Arjun, Ravi, Nisha, community and discussion records; no network service. |
| `src/app/globals.css` | Refine in place | Retains the warm palette while improving body sizes, contrast, target sizes, focus, responsive layouts and reduced-motion behavior. |
| `src/app/layout.tsx` and `src/app/icon.svg` | Refine/add | Harmonise metadata and labeled icon. |
| `src/lib/harmonise.test.ts` | Add | Unit coverage for paths, typed-text honesty, correction reranking, question payload, contributor revocation, reflection and new chapter. |
| `tests/demo-flow.spec.ts` | Refactor | Browser coverage now exercises Harmonise flow at desktop and mobile viewports. |
| `README.md` | Update | Run steps, 180-second rehearsal and honest mock limitations. |

The guided demo uses one reducer-backed screen state with an in-memory history stack. It is intentionally session-only: refresh starts a fresh route. Global navigation and a Back action keep the person out of a one-way wizard. Community tabs are local fixture views; no posting, joining, publishing, reporting, messaging or persistence occurs remotely.

## Flow map

```text
Entry choices ─┬─ Talk / Not sure → up to two sample-guided turns → understanding map → community discovery
               ├─ Read quietly ────────────────────────────────────────────────┘
               ├─ Support others → contributor consent preview / publish / revoke
               └─ Help & safety → distinct peer, listener, moderator, and professional roles

Community discovery → community home (Experiences / Discussions / People / Guidelines)
                    → Ravi or Nisha experience → optional consented Ravi question → fictional reply
                    → optional usefulness + next step → private journey → separate moving/belonging chapter
```

## Stage boundary

Stage A is deterministic and fictional. The environment reported no configured secrets, runtime variables, or cloud credentials for a Meta provider. No Meta request was made and the interface does not claim live inference. The typed seams in the domain model keep fixture behavior separate so a future server-only Meta adapter can be added after credentials and official API details are available; private user disclosures must not be sent in that stage.
