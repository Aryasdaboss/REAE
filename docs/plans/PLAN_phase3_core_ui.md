# Phase 3 — Core UI Implementation Plan

**Overall Progress:** `90%`

## TLDR
Build the first user-visible milestone: a navigable task app with a ranked Today screen, bottom-sheet task creation with NLP date parsing, task completion with a "Done today" section, and inline "Break it down" expansion. Introduces React Navigation. No DB schema changes.

## Critical Decisions
- **React Navigation:** `@react-navigation/native-stack` — proper multi-screen foundation for Phase 4–6
- **Task creation:** Bottom sheet (custom, Animated API — no @gorhom dependency), configurable in Phase 6 Settings
- **Completion:** Task slides to "Done today" section at bottom — celebratory color `#C8A415` (warm gold)
- **Break it down results:** Inline expansion on task card — no sheet
- **Animation library:** React Native built-in `Animated` API only — no new animation dependency
- **DB → engine mapping:** Map lowercase DB columns to camelCase RankedTask shape in TodayScreen before passing to rankTasks()
- **Done section scope:** Today only — tasks completed in the current session/day

## Tasks

- [x] **Step 1: Navigation Scaffold + AuthScreen** (complete 2026-05-18)
  - [x] Install `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`
  - [x] Create `screens/AuthScreen.tsx` — extract login/signup UI from App.tsx exactly as-is
  - [x] Refactor `App.tsx` to navigation stack only (Auth → Today), session-aware routing
  - [x] Create `screens/TodayScreen.tsx` placeholder (sign-out + empty state) — real impl in Step 2
  - [x] Isolate Supabase integration tests behind `npm run test:integration` — `npm test` baseline now 33/33 green
  - [x] Verify React Navigation loads in browser (expo web) — confirmed working (login → today → sign out)

- [~] **Step 2: TodayScreen with Ranked Task List**
  - [x] Extract pure `prepareTodayTasks()` in `services/todayPresenter.ts` — DB → engine mapping + filter + overdue split
  - [x] `tests/services/todayPresenter.test.ts` — 12 cases (empty, mapping, filtering, overdue split, ranking, immutability) all green
  - [x] Rewrite `screens/TodayScreen.tsx` — fetch tasks, render "Today" + "Needs rescheduling" sections + empty state
  - [x] Fetch fields: `id, title, importance, ispinned, iscompleted, issnoozed, duedate, createdat`
  - [x] Map DB lowercase columns → camelCase RankedTask shape (handled by presenter)
  - [x] Pass to `rankTasks()` — render ranked list
  - [x] Split overdue tasks into "Needs rescheduling" section (compassionate language, no red)
  - [x] Compassionate empty state
  - [x] Sign-out button in top bar (already in placeholder)
  - [ ] Verify in browser — list renders, sign-out still works

- [~] **Step 3: Task Creation Bottom Sheet + NLP**
  - [x] Pure helper `services/createTaskHelper.ts` — `buildTaskDraft`, `formatDueDatePreview`
  - [x] `tests/services/createTaskHelper.test.ts` — 11 cases (payload shape, importance preservation, empty rejection, preview formatting) all green
  - [x] `components/CreateTaskSheet.tsx` — Animated slide-up sheet, backdrop, importance picker, save flow
  - [x] Title input with live NLP parsing — "Due: [Today|Tomorrow|weekday|Mon D]" preview
  - [x] Importance picker: Low / Medium / High / Critical (Medium default)
  - [x] Submit → Supabase insert → re-rank via `onCreated` callback in TodayScreen
  - [x] Backdrop tap + Cancel button dismiss the sheet
  - [ ] Swipe-down gesture to dismiss — **deferred** (requires PanResponder; backdrop+Cancel cover the case for now)
  - [ ] Verify in browser — FAB opens sheet, NLP preview shows for "tomorrow", save creates a card on the list

- [~] **Step 4: Task Completion + Done Section**
  - [x] Presenter `done` bucket — filters completed-today, sorts by completedat desc (6 new tests)
  - [x] `components/TaskCard.tsx` — completion circle on left, optimistic local state, accessible labels
  - [x] `components/DoneSection.tsx` — collapsible, warm gold header `#C8A415`, count + chevron
  - [x] TodayScreen: raw rows in state + `useMemo` for sections — enables optimistic update without refetch
  - [x] `handleComplete` writes `iscompleted=true, completedat=now()` to Supabase; rolls back on error
  - [x] Done section collapsed by default, expands on tap
  - [ ] Animation polish — card slide-out / slide-into-done deferred. For v1 the flip is instant via optimistic state.
  - [ ] Verify in browser (will batch with Step 5 deploy as v0.3.0)

- [x] **Step 5: "Break It Down" Inline Expansion**
  - [x] "Break it down" button on TaskCard (only on active cards, hidden once sub-tasks load in current session)
  - [x] On tap: inline spinner + "Thinking…" label. Calls `supabase.functions.invoke('break-it-down', { body: { taskId, title, dueDate } })`.
  - [x] On success: inline sub-task list below the meta row (bullet, title, optional due-date pill)
  - [x] On 429: inline friendly message "You've used all 10 breakdowns today. Try again tomorrow."
  - [x] On other error: inline friendly italic message — no Alert
  - [x] Sub-tasks live in component memory only (per FEATURES decision — not persisted in MVP)

- [ ] **Phase 6: Tests, Docs, Version Bump, Deploy**
  - [ ] Write `tests/screens/TodayScreen.test.ts` — ranking integration, overdue split, empty state
  - [ ] Write `tests/components/TaskCard.test.ts` — completion state, break-it-down states
  - [ ] Run full test suite — confirm 43+ passing, no regressions
  - [ ] Update `docs/FEATURES.md` — mark Phase 3 features done
  - [ ] Update `docs/USER_GUIDE.md` — Today screen, task creation, completion, break-it-down
  - [ ] Update `docs/DESIGN_DECISIONS.md` — React Navigation, gold completion color, bottom sheet
  - [ ] Update `docs/RELEASE_NOTES.md` — v0.2.0
  - [ ] Bump VERSION → `0.2.0`, package.json version → `0.2.0`
  - [ ] Pre-commit checklist — all items checked
  - [ ] Commit + push → Vercel auto-deploys → verify live at REAE.parlapalli.com
