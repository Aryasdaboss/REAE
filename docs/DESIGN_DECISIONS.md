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

---

## React Navigation for Multi-Screen Foundation

**Decision:** Use `@react-navigation/native-stack` to manage screens, starting in
Phase 3 (Step 1). All screen-to-screen transitions go through React Navigation;
the App.tsx root only wires the navigator and session-aware routing.
**Date:** 2026-05-18
**Rationale:** Phase 3–6 introduce multiple screens (Today, Task detail, Settings,
Onboarding). Building a navigation foundation now is cheaper than retrofitting after
each phase. native-stack uses platform-native containers (UINavigationController on
iOS, FragmentTransaction on Android) for transitions that feel right out of the box
and survive Stage B (native iOS) without a rewrite.

---

## Custom Animated Bottom Sheet (No External Dependency)

**Decision:** The task creation sheet (`components/CreateTaskSheet.tsx`) uses
React Native's built-in `Animated` API for the slide-up/dismiss transitions.
We do NOT pull in `@gorhom/bottom-sheet` or similar.
**Date:** 2026-05-18
**Rationale:** The sheet's animation needs are simple — a translate-Y interpolation
plus a backdrop opacity fade. Adding a 200KB+ dependency and its `react-native-reanimated`
peer dependency for one component would dominate the web bundle. Hand-rolling it is
~40 lines and keeps the dependency surface small.

---

## Today Presenter as a Separate Pure Function

**Decision:** The DB→engine mapping, filtering of completed/snoozed tasks, and
overdue split live in `services/todayPresenter.ts` as a pure function — not inline
in the Today screen component.
**Date:** 2026-05-18
**Rationale:** Same reasoning as the ranking engine (see above). Pure functions are
trivially testable without React infrastructure. Anything that smells like business
logic on the Today screen path should keep migrating into this presenter rather than
accumulating in the screen.

---

## Create-Task Sheet Does Not Strip Date Phrases From Title

**Decision:** When the NLP parser detects a date in the task title (e.g. "call
dentist tomorrow"), the parsed date is saved to `duedate` BUT the original phrase
is kept in `title`. We do not rewrite the user's title.
**Date:** 2026-05-18
**Rationale:** Stripping is a surprising silent edit to user input. Most task apps
that strip get this wrong on edge cases (multiple date phrases, "by Friday" vs
"on Friday", titles where the date phrase IS the action). Keeping the title verbatim
is the safer v1 choice. We can revisit in Phase 6 if users complain.

---

## Task Completion is Optimistic (Local State First, Then Supabase)

**Decision:** Tapping the completion circle immediately flips the task in local
state — the card moves to the Done section before the Supabase write returns.
If the write fails, we roll the local state back and show a friendly error.
**Date:** 2026-05-19
**Rationale:** Completing a task is the most-frequent positive action in the app.
Making it feel instant matters more than perfect consistency. The roll-back path
covers the rare write failure, and Supabase writes are reliable enough that
optimistic-first is the right default. TodayScreen keeps raw rows in state and
derives sections via `useMemo` to make this pattern clean.

---

## Sub-Tasks From "Break It Down" Live Only in Component Memory

**Decision:** Sub-tasks returned by the break-it-down Edge Function are stored
only in the TaskCard's local React state. They are not written to the database,
not editable, and disappear on page reload.
**Date:** 2026-05-19
**Rationale:** Real sub-task support (storage, editing, completion) is its own
feature in a later phase. For MVP the goal is to demonstrate the Break-it-down
flow without committing to a sub-task schema that may need to change. The
server-side rate-limit (10/day) still applies, so a user can't infinitely
re-break a task across reloads to spam the API.

---

## "Done Today" Window is UTC-Day-Boundaries

**Decision:** The "Today's wins" section filters by tasks whose `completedat`
falls within the same UTC calendar day as the reference date. We do NOT use
local timezone for this comparison.
**Date:** 2026-05-19
**Rationale:** Postgres `timestamptz` columns and JS `Date.toISOString()` are
both UTC-based. Doing the comparison in UTC keeps the filter consistent with
how the data is stored and how the server thinks about "today". For MVP this
is the simpler and correct choice. A future timezone-aware version can be
added when we ship onboarding (Phase 6) where we collect the user's timezone.
