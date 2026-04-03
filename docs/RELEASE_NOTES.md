# REAE Release Notes

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
