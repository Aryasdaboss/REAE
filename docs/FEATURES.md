# REAE Feature Registry

Status: `done` | `planned` | `rejected`

---

## Phase 1 — Foundation

| Feature | Status | Notes |
|---|---|---|
| Email/password sign up + sign in | done | Supabase Auth |
| Google Sign-In | done | Supabase OAuth |
| Task CRUD (create, read, update, delete) | done | Supabase + RLS |
| Row-Level Security | done | Users can only see their own tasks |
| User profile auto-created on sign up | done | `handle_new_user()` trigger |
| Web app (phone-frame UI) | done | Expo web, centered 390×844 |
| University of Michigan color scheme | done | Navy #00274C + Maize #FFCB05 |
| Vercel auto-deploy from GitHub | done | REAE.parlapalli.com |

---

## Phase 2 — Engines

| Feature | Status | Notes |
|---|---|---|
| Ranking engine | done | Pure function, `services/rankingEngine.ts`, 18 tests |
| NLP date parser | done | chrono-node, `services/nlpParser.ts`, 12 tests |
| "Break it down" Edge Function | done | Claude Haiku, rate-limited 10/user/day |
| `aiBreakdownAt` DB column | done | Tracks last breakdown per task for rate limiting |

---

## Phase 3 — Core UI (in progress — Steps 1–3 shipped in v0.2.0)

| Feature | Status | Notes |
|---|---|---|
| React Navigation scaffold | done | `@react-navigation/native-stack`, Auth → Today |
| AuthScreen extracted | done | `screens/AuthScreen.tsx` |
| Today screen — ranked task list | done | `screens/TodayScreen.tsx` using `prepareTodayTasks` |
| Overdue split — "Needs rescheduling" section | done | Compassionate, no red warnings |
| Today presenter (DB → engine) | done | `services/todayPresenter.ts`, 12 tests |
| Task creation bottom sheet | done | `components/CreateTaskSheet.tsx`, custom Animated API |
| Live NLP "Due: X" preview | done | Uses `parseDate` + `formatDueDatePreview` helper |
| Importance picker (Low/Med/High/Critical) | done | Medium default |
| Task completion animation | planned | Step 4 — slides into "Done today" section (warm gold) |
| "Done today" section | planned | Step 4 |
| "Break it down" inline expansion | planned | Step 5 — calls Edge Function, shows sub-tasks |
| Swipe-down dismiss on sheet | planned | Deferred — backdrop+Cancel cover the case in v0.2.0 |

---

## Phase 4 — Task Depth + Learning Logger (planned)

| Feature | Status | Notes |
|---|---|---|
| Sub-tasks | planned | Displayed only, not stored in DB at MVP |
| Recurrence | planned | |
| Snooze | planned | |
| Pomodoro timer | planned | |
| Override logging (silent) | planned | RankingOverride — never shown to user |

---

## Phase 5 — Search + Notifications (planned)

| Feature | Status | Notes |
|---|---|---|
| Search/filter | planned | |
| Browser push notifications | planned | |
| Reminder engine | planned | Gentle-first, daily budget cap |

---

## Phase 6 — Settings + Onboarding + Landing (planned)

| Feature | Status | Notes |
|---|---|---|
| Settings screen | planned | Includes ranking weight editor |
| Onboarding flow | planned | |
| Landing page | planned | |
| Weekly report (in-app) | planned | Replaced email report |

---

## Phase 7 — Validation + Smart Suggestions (planned)

| Feature | Status | Notes |
|---|---|---|
| Suggestion engine | planned | Requires 1–2 weeks of real usage data |
| SuggestionCard | planned | |
| LearnedPreference | planned | |

---

## Rejected

| Feature | Reason |
|---|---|
| Report email | Replaced by in-app weekly report (Phase 6) — more cost-efficient |
| AI/Claude branding in UI | Non-negotiable rule — "Break it down" is never labelled as AI |
| GCP Cloud Run | Replaced by Vercel + Supabase for MVP ($300 credit saved for future) |
