# Harmonise Moderation Policy v1

**Policy version:** `2026-11-02.1`
**Status:** Pilot draft. A human reviewer decides every case; AI output is only a suggestion.
**Staffing assumption:** reviews happen during published staffed hours. Outside those hours the
product shows when review resumes and never claims live monitoring.

## 1. What moderators enforce

| Concern | Meaning | Default handling |
|---|---|---|
| `none` | No clear problem | No action |
| `harassment` | Targeted hostility, threats toward a member | Remove or request revision; urgent if credible threat |
| `personal-data` | Phone numbers, addresses, contact details | Remove; ask for revision without details |
| `coercive-advice` | Pressuring stay/leave or medical/legal directives | Request revision toward peer experience |
| `medical-or-legal-claim` | Diagnosis, dosage, legal verdicts | Request revision; never restate as fact |
| `self-harm` | Self-harm content | Urgent human review + resources; never automated outreach |
| `threat` | Credible threat of violence | Urgent human review; consider authorities |
| `other` | Something else needs a human look | Review on the merits |

Severity: `low` (no clear concern), `review` (a human should inspect), `urgent`
(credible immediate threat or explicit imminent self-harm risk).

## 2. Reviewer escalation matrix

1. **Reviewer** triages the queue, decides `no-action`, `request-revision`, or `remove`.
2. **Reviewer** escalates (`escalate`) anything involving imminent risk, illegality, or doubt
   about the right call. Escalated items move to the top of the queue with a second reviewer.
3. **Safety lead** handles escalations and appeals, and is the only role that closes an
   `escalate` decision. (Pilot: the safety lead is a named moderator; the role is enforced by
   process, not by a separate permission, until volume justifies it.)
4. **Appeals**: the author may appeal once per decision. A different reviewer should take the
   second look when staffing allows; the appeal outcome (`upheld` / `overturned`) is recorded
   separately from the original decision.

## 3. Response-time expectations (staffed pilot)

- `urgent`: first human look within 4 staffed hours.
- `review`: decision within 2 staffed days.
- Appeals: second look within 2 staffed days of filing.
- Outside staffed hours the queue shows: "Reviews resume during staffed hours. If someone may
  be in immediate danger, contact local emergency services — Harmonise cannot monitor or dispatch help."

## 4. Immediate-risk handling

- Deterministic safety phrases route to urgent human review; they do not trigger automated
  contact, dispatch, or monitoring of any kind.
- Reviewers respond with local resources and helplines (e.g. https://findahelpline.com/).
  Reviewers are not emergency responders and must say so.
- Never promise automated crisis monitoring or emergency response in product copy.

## 5. AI triage boundaries

- The model classifies against this versioned policy and returns a constrained concern,
  severity, short rationale, and uncertainty. It never removes, holds, publishes, contacts,
  or sanctions.
- Every AI suggestion is stored next to — never merged into — the human decision, with the
  policy version attached to both.
- Triage quality is measured (decisions vs. suggestions, appeal overturn rate) on synthetic
  data first, then on consented and reviewed data, before triage influences queue ordering.

## 6. Records

Each decision keeps: report, source post or reply, report reason, model suggestion (if any),
policy version, reviewer, decision, rationale, timestamp, and appeal history. Reporter
identity is visible to reviewers only.
