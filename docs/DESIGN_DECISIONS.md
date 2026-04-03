# REAE Design Decisions

Rationale for key product and technical decisions. Update when decisions change.

---

## Technology Stack

**Decision:** Expo (React Native) + Supabase + Vercel
**Date:** 2026-03-29
**Rationale:** Single codebase covers web MVP now and iOS later without a rewrite.
Supabase gives Postgres + Auth + Edge Functions + RLS for free. Vercel gives
auto-deploy from GitHub with zero config. No GCP for MVP — saves the $300 credit
for future production scaling.

---

## Ranking Engine as a Pure Function

**Decision:** `services/rankingEngine.ts` is a pure function with no side effects,
no Supabase calls, and no UI dependencies.
**Date:** 2026-04-02
**Rationale:** Pure functions are trivially testable and composable. The ranking
algorithm will evolve (Phase 6 weight editor, Phase 7 learned preferences) — keeping
it pure means every change is covered by unit tests without mocking infrastructure.

---

## "Break It Down" Is Not Labelled as AI

**Decision:** The task decomposition feature is called "Break it down" in the UI.
There is no mention of AI, Claude, or Anthropic anywhere in the interface.
**Date:** 2026-04-02
**Rationale:** The feature should feel like part of the app's intelligence, not
an external service. Users don't need to know the implementation detail. This also
future-proofs against switching AI providers.

---

## Rate Limit: 10 Breakdowns Per User Per Day

**Decision:** The "Break it down" Edge Function allows a maximum of 10 calls per
user per day. Tracked via `aiBreakdownAt` and `aibreakdownused` on the tasks table.
**Date:** 2026-04-02
**Rationale:** Cost control on the free Supabase + Claude API tier. 10/day is
generous enough for real use while preventing abuse.

---

## NLP Parses Date Only — Importance Is Manual

**Decision:** The NLP parser extracts dates from task titles but does not infer
importance. Importance is always set manually by the user.
**Date:** 2026-04-02
**Rationale:** Importance is subjective and personal. Auto-inferring it from
title text would produce unreliable results and erode user trust in the ranking.

---

## Compassionate Design — No Guilt Language

**Decision:** Overdue tasks do not show red warnings or "overdue" labels. They
appear in a separate section with a reschedule prompt. No guilt language anywhere.
**Date:** 2026-03-29
**Rationale:** REAE's core value proposition is reducing overwhelm, not adding to
it. Harsh visual feedback for overdue tasks contradicts the product's purpose.

---

## Widget as Primary Accountability Mechanism

**Decision:** The iOS widget is the primary way users stay accountable to their
top task. Push notifications are optional, not the default.
**Date:** 2026-03-29
**Rationale:** Notifications are interruptive. A widget is ambient and user-initiated.
Users who want notifications can opt in; the default experience is non-intrusive.

---

## In-App Weekly Report Instead of Email

**Decision:** The weekly progress report will be a screen inside the app, not
an email digest.
**Date:** 2026-03-29
**Rationale:** Email delivery costs (SendGrid/Resend) add up on free tier. In-app
report has zero marginal cost and keeps users in the app rather than diverting
attention to email.

---

## Energy Parameter Reserved for Future Use

**Decision:** The ranking engine function signature includes an `energy` parameter,
but it is ignored in MVP and has no effect on ranking.
**Date:** 2026-04-02
**Rationale:** The build plan calls for energy-aware ranking post-validation. Including
the parameter now ensures no API breakage when it is activated. The parameter must
exist in the signature — it must not be removed.
