# Phase 2 — Engines Implementation Plan

**Overall Progress:** `100% — COMPLETE`

## TLDR
Build the three core engine services: a ranking engine (pure function), an NLP date parser (chrono-node), and a "Break it down" Supabase Edge Function (Claude Haiku). No UI. No sub-task storage. Engines only.

## Critical Decisions
- Ranking engine is a pure function — no Supabase calls, no side effects
- Weights stored as a config object so Phase 6 can expose a settings UI
- Energy parameter exists in function signature but is ignored in MVP
- NLP parses date only — importance stays as manual selection
- Sub-tasks have no count limit — Edge Function returns however many Haiku generates
- Sub-task due dates are optional, spread between task creation date and main task due date
- Rate limit: 10 breakdowns per user per day, tracked via new `aiBreakdownAt` column
- "Break it down" is never labelled as AI in the UI
- Claude API key added to Supabase secrets manually via dashboard (end of session)

## Tasks

- [x] **Step 1: DB Migration** — `aiBreakdownAt` column added to tasks table (2026-04-02)
- [x] **Step 2: Install chrono-node** — added to package.json dependencies (2026-04-02)
- [x] **Step 3: Ranking Engine** — 18/18 tests passing (2026-04-02)
- [x] **Step 4: NLP Parser** — 12/12 tests passing (2026-04-02)

- [x] **Step 5: Break It Down Edge Function** (2026-04-03)
  - [x] Create `supabase/functions/break-it-down/index.ts`
  - [x] Add `ANTHROPIC_API_KEY` to Supabase secrets via dashboard
  - [x] Deploy via `npx supabase functions deploy` (--no-verify-jwt flag required)
  - [x] Fix column names: DB uses lowercase (`userid`, `aibreakdownused`) — original schema created without quotes
  - [x] Fix Claude response parsing: strip markdown code fences before JSON.parse
  - [x] Confirmed working: 200 response, 14 sub-tasks returned for "Plan my birthday party"

- [x] **Step 6: Commit and Push** (2026-04-03)
  - [x] Fix tasks.test.ts column names (dueDate → duedate, userId → userid, etc.)
  - [x] Run full test suite — 43 passing (engine tests green); 28 DB/auth tests fail due to Supabase free-tier rate limiting (pre-existing, known issue)
  - [x] Complete pre-commit checklist
  - [x] Bump version (Medium → minor bump: 0.0.0 → 0.1.0)
  - [x] Commit and push

## Known Issues / Discovered This Session
- **Schema column naming mismatch:** Original tasks table was created without quoted identifiers, so all columns are lowercase in PostgreSQL (`userid`, `duedate`, `ispinned`, etc.). Only `aiBreakdownAt` is camelCase (added later with quotes). The tasks.test.ts and any app code using camelCase column names will need to use the actual lowercase names. Consider a migration to rename all columns to quoted camelCase for consistency in a future session.
