# Harmonise UX and accessibility review

Review basis: uploaded `00_START_HERE.md`, `ACCEPTANCE_TESTS.md`, and the four Harmonise flat skill guides; attached product, empathy, privacy, community, migration, Meta proof and three-minute demo specifications. This is a prototype review, not a clinical review or WCAG certification.

## Screen inventory

| Screen | User job | Primary action | Skip / back / exit | Error or empty state | Disclosure boundary |
|---|---|---|---|---|---|
| Entry | Choose a comfortable starting point | Pick Talk, Not sure, Read quietly, or Support others | Leave page; no forced account | None required | Clearly labeled fictional demo |
| Conversation | Find a starting point with minimal effort | Choose a sample response or use short text | Skip one question, stop asking, back, browse quietly | Typed content notice says no live interpretation | Private session text; no server call |
| Understanding | Correct tentative topics and choose what helps now | Confirm selected themes and need | Back to conversation; select none | Empty theme selection becomes broad browse | User words, suggestions and user choice use separate labels |
| Community discovery | Find a useful human destination | Explore a community | Change themes, browse all, no-match | Honest no-close-fit state | Fictional community and activity status shown |
| Community home | Evaluate people, stories, norms and discussion | Read an experience | Back to results; quiet reading; leave | No discussion/story state is explicit | Fictional people and moderator role labels |
| Experience | Compare a contributor's report with one's own situation | Read milestones; optionally ask Ravi | Back, not relevant, other community | Revoked story has an unavailable state | Contributor-reported milestones, source IDs, differences and unknowns |
| Question | Review exact disclosure | Approve alias + question and continue | Cancel preserves draft; back | Inline alias/question validation; consent gates send | Preview is recipient ID, alias and exact question only |
| Reply | Read the simulated human perspective | Continue to reflection | Back to question | Local fixture only | Explicit fictional reply; no live person/AI claim |
| Reflection | Say whether anything helped and optionally choose a next step | Continue to journey | Skip feedback, no next step | Negative feedback remains valid | Optional private note requires explicit keep action |
| Journey | Review only user-approved session content | Start separate later chapter | Global nav/back | No empty progress metric | Session-only; no persistence or inferred progress |
| Contribute | Review shareable summary and scope | Explicitly approve then publish preview | Revoke sharing | Publish is disabled until approval | Private notes excluded; revocation removes Ravi from public story selection |
| Help & safety | Understand support roles and limits | Select a separate support route outside this mock | Back or leave | No provider or moderator is claimed available | No live monitoring, clinical service, or real booking |

## Microcopy review

| Earlier wording or pattern | Concern | Current wording | Screen | Verification |
|---|---|---|---|---|
| “Beyond Silence” branding | Wrong product name for the current submission | “Harmonise” and the approved tagline | Metadata, landing, app shell, icon | Metadata/visible-name audit |
| “experiences from real people” in demo copy | Would make synthetic stories sound real | “lived-experience examples” plus fictional contributor labels | Landing/community | Content assertions and screenshot review |
| “Your story is analyzed” | Implies live inference for arbitrary text | “New text is not interpreted in this guided demo.” | Conversation | Typed-text unit and browser tests |
| Declared emotional or family cause | Overstates what the person said | “Possible connections” / “You chose” | Understanding | Correction/reranking tests |
| “Anonymous and secure” | Overpromises identity protection | “A pseudonym does not guarantee anonymity.” | Question | Exact recipient preview test |
| “Ravi is replying” or live status | Fabricates a human interaction | “Fictional contributor reply — demo” | Reply | Browser assertion and no-network check |
| Default positive next step | Would make the app decide for the person | “No next step selected” until chosen | Reflection | State starts empty; negative/skip tests |
| “You healed” / progress score | Claims an outcome not supported by a fictional demo | No score; user-reported usefulness only | Journey | Content assertion |
| “We're always here” | False availability promise | No live availability; archived/fictional content may be read | Community/help | Community status copy |

## Accessibility and cognitive load

- Semantics: one page heading, labeled textareas/inputs, native checkboxes/radios/select, buttons and links; community tab buttons support Tab plus Left/Right Arrow. Screen changes move focus to the new heading. Skip-to-content link is present.
- Focus and motion: three-pixel `:focus-visible` outline; no autoplay, delayed fake typing or decorative animation; reduced-motion CSS disables transitions/scroll animation.
- Contrast checks against the authored palette: body `#202722` on `#f7f6f2` = 14.13:1; muted text `#52605a` on `#fffefa` = 6.54:1; primary button `#fff` on `#205b5a` = 7.76:1; kicker `#415f54` on paper = 6.50:1; focus `#a34e20` on white = 5.73:1; control border `#87978d` on white = 3.07:1. Error text `#70251f` on `#fff0ed` = 9.60:1.
- Target sizes: primary buttons are at least 48px high; nav and choice controls are at least 44px high; checkbox rows are at least 46px high.
- No modal is used, so there is no modal focus trap to verify. The question consent checkpoint remains in normal document flow and cancel preserves typed text.
- Manual/browser verification should include desktop recording size, mobile width, 320px, keyboard path, tab switching and actual screen capture. Automated checks do not establish complete screen-reader conformance.

## Skill preflight

Applied the four original Harmonise skill guides directly from uploaded flat Markdown/ZIP contents; they contain static process instructions, no executable code or required packages. The optional external skills were reviewed earlier; no supported Codex skill installer is exposed in this environment, and the project already has Playwright. No third-party skill or dependency was installed.

## Final verification evidence

Final checks passed on the current working tree after responsive-navigation polish.

| Check | Result |
|---|---|
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | Passed, 19/19 tests |
| `npm run build` | Passed |
| `npm run test:e2e -- --workers=1` | Passed, 16 desktop/mobile executions |
| 320px responsive assertion | Passed; no horizontal overflow |
| Screenshot review | Reviewed at 1920×1080 and 390px after navigation polish |
| `git diff --check` | Passed |

These checks support the tested flows and viewports; they do not establish complete screen-reader conformance or formal WCAG certification.
