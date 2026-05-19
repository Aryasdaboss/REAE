# REAE Release Notes

## 0.3.0 — 2026-05-19

### Phase 3 — Core UI (complete: Steps 4–5 land)

Completes the Phase 3 milestone. The app now has full task lifecycle on a
single screen — create, see ranked list, complete, break-it-down.

**New: Task completion** (`components/TaskCard.tsx`)
- Hollow gold completion circle on the left edge of every active task card
- Tap → optimistic local state update + Supabase write (`iscompleted`, `completedat`)
- Rolls back to previous state if the Supabase write fails
- Completed cards get a warm-gold tint, strikethrough title, and disabled circle

**New: "Today's wins" section** (`components/DoneSection.tsx`)
- Collapsible section at the bottom of the Today screen
- Warm gold header `#C8A415` — celebratory, not loud
- Shows count when collapsed; chevron expands the list
- Only includes tasks completed in the current UTC day (resets daily)

**New: Done bucket in the presenter** (`services/todayPresenter.ts`)
- `prepareTodayTasks` now returns `{ today, overdue, done }`
- `done` filters by `iscompleted && completedat within referenceDate's UTC day`
- Sorted by most-recent completion first
- 6 new unit tests covering empty, filtering, edge dates, sorting

**New: TodayScreen state model**
- Keeps raw rows in state; derives the three buckets via `useMemo`
- Enables optimistic updates without a refetch round-trip after every action

**New: "Break it down" inline expansion** (`components/TaskCard.tsx`)
- "Break it down" pill button under each active task's meta row
- Inline "Thinking…" spinner while the Edge Function runs
- On success: inline sub-task list (bullet + title + optional due-date pill)
  appears below the task. Sub-tasks live in component memory only (not persisted)
- On 429 rate-limit: friendly inline message — "You've used all 10 breakdowns today. Try again tomorrow."
- On other errors: friendly italic inline message — never an Alert

**Docs**
- `API_DOCS.md` updated to match the actual Edge Function shape (was stale —
  response is `subTasks` not `subtasks`, no `notes` field, request body includes `dueDate`)
- `FEATURES.md`, `USER_GUIDE.md`, `DESIGN_DECISIONS.md` updated for v0.3.0

**Known deferrals**
- Component tests (TaskCard, TodayScreen) — need `@testing-library/react-native`
  setup; tracked as a separate Small enhancement
- Completion animation polish — instant flip via optimistic state for now;
  smooth slide-out can be added later without behavior change
- Sub-task persistence — display-only in MVP per FEATURES decision

---

## 0.2.0 — 2026-05-18

### Phase 3 — Core UI (partial: Steps 1–3 of 6)

First user-visible release of Phase 3. The web app now has real navigation,
a ranked Today screen, and in-app task creation. Steps 4 (completion +
"Done today" section) and 5 (Break it down inline expansion) are still in
progress and will land in 0.3.0.

**New: React Navigation scaffold** (`App.tsx`, `screens/AuthScreen.tsx`)
- Migrated from inline auth UI to `@react-navigation/native-stack`
- Session-aware routing — Auth screen when signed out, Today screen when signed in
- Auth UI moved to `screens/AuthScreen.tsx` unchanged

**New: Today screen** (`screens/TodayScreen.tsx`)
- Fetches user tasks from Supabase, runs them through the ranking engine
- Two sections — "Today" (ranked) and "Needs rescheduling" (overdue, soft styling)
- Compassionate empty state — "All clear. Add something whenever you're ready."

**New: Today presenter** (`services/todayPresenter.ts`)
- Pure function that maps lowercase Supabase columns to RankedTask shape,
  filters completed/snoozed tasks, splits overdue, and ranks each bucket
- 12 tests covering empty, mapping, filtering, overdue split, ranking, immutability

**New: Task creation bottom sheet** (`components/CreateTaskSheet.tsx`)
- Custom slide-up Animated sheet — no third-party dependency
- Live "Due: X" NLP preview as the user types
- Importance picker — Low / Medium / High / Critical (Medium default)
- Save inserts into Supabase and re-ranks the list

**New: Create task helper** (`services/createTaskHelper.ts`)
- Pure helpers — `buildTaskDraft` (payload assembly) and `formatDueDatePreview`
- 11 tests covering payload shape, empty rejection, preview formatting

**Dev workflow change** (`package.json`)
- `npm test` now runs unit tests only (services) — fast, no network, fully green baseline (55/55)
- `npm run test:integration` runs Supabase auth + database tests on demand
- `npm run test:all` runs everything (current production state)

**Known deferrals (Phase 3 Step 4–5, shipping in 0.3.0)**
- Task completion + "Done today" section
- "Break it down" inline expansion
- Swipe-down gesture to dismiss the create-task sheet (backdrop+Cancel work today)

---

## 0.1.0 — 2026-04-03

### Phase 2: Engines

**New: Ranking Engine** (`services/rankingEngine.ts`)
- Pure function — no side effects, no network calls
- Ranks tasks by: pin status, importance, due date (overdue boost, urgency window), NLP-inferred date confidence, and random tiebreak
- Energy parameter reserved for future use
- 18 tests covering all ranking rules

**New: NLP Parser** (`services/nlpParser.ts`)
- Parses natural-language date/time strings from task titles using chrono-node
- Returns parsed date + confidence score + cleaned title (date phrase removed)
- Handles relative dates, day names, time expressions, and ambiguous phrases
- 12 tests covering all parser behaviours

**New: Break It Down Edge Function** (`supabase/functions/break-it-down/`)
- Supabase Edge Function that calls Claude Haiku to decompose a task into sub-tasks
- Rate-limited to 10 breakdowns per user per day (enforced server-side via `aiBreakdownAt`)
- Returns array of sub-task objects with title, notes, and optional due date
- Never labelled as AI in the UI

**New: DB Column** (`aiBreakdownAt` on tasks table)
- Tracks when the last breakdown was requested per task
- Used for rate-limit enforcement in the Edge Function

---

## 0.0.0 — 2026-04-02

### Phase 1: Foundation

Initial release. App live at REAE.parlapalli.com.

- Supabase project: PostgreSQL, Google + email/password auth, RLS
- Tasks and Users tables with full RLS policies
- Expo web app — sign up, sign in, insert/read tasks
- Styled as phone frame, University of Michigan color scheme (Navy + Maize)
- Auto-deploy via Vercel from GitHub main branch
- Jest test runner configured
