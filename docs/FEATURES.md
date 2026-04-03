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

## Phase 3 — Core UI (planned)

| Feature | Status | Notes |
|---|---|---|
| Today screen | planned | Ranked task list using rankingEngine |
| Task creation screen | planned | NLP parser for date extraction |
| Task completion animation | planned | Compassionate, positive feedback |
| "Break it down" button | planned | Calls Edge Function, shows sub-tasks |

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
