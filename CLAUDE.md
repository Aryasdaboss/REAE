# REAE — Claude Standing Instructions

These rules apply to every session. Follow them without being asked.

---

## Session Start

At the start of every session, do all of the following before writing any code:

1. Read `C:\Projects\BUILD.md` — Enhancement Pipeline (E1-E5) and sizing rules.
2. Read `docs/DESIGN_DECISIONS.md` — all product decisions and rationale.
3. Read `docs/FEATURES.md` — feature registry (built, planned, rejected).
4. Check `docs/plans/` (not `docs/plans/archive/`) for any active PLAN files. If found,
   read them and resume from where the last session left off.
5. Run `git status` to check for uncommitted changes from a previous session.
6. Run the full test suite to confirm a green baseline:
   ```
   cd C:\Projects\app && npx expo test
   ```
   If any tests fail, flag it to the user before proceeding. Do not write new code
   on top of a broken baseline.

---

## Tech Stack
- **Framework:** React Native (Expo) — shared codebase for web + iOS
- **Database / Auth / API:** Supabase (free tier) — PostgreSQL, Google + email auth, RLS, Edge Functions
- **Web hosting:** Vercel — auto-deploys from GitHub, custom domain REAE.parlapalli.com
- **Task breakdown AI:** Supabase Edge Function → Claude Haiku API (not labeled as AI in the UI)
- **NLP parser:** chrono-node + keyword matcher (no API cost)
- **Widget (iOS only):** expo-widgets using @expo/ui SwiftUI components
- **Domain:** Hostinger → REAE.parlapalli.com → Vercel

All technology decisions are final. Do not revisit during the build.

---

## Enhancement Pipeline

**Any change that touches an API endpoint, DB schema, UI workflow, or business logic
MUST go through the pipeline automatically.** The user does not need to say "read BUILD.md".

Before starting any enhancement or new feature, read the Orchestrator Agent:
`C:\Projects\agents\orchestrator_agent.md`

The Orchestrator will classify the change (Hot-fix / Small / Medium / Large),
determine which stages are needed, enforce approval gates, and activate agents in order.

Sizing quick check:
- Does it touch an API endpoint, DB schema, UI workflow, or business logic?
  -> Read the Orchestrator Agent. It handles the rest.
- Is it a typo, CSS tweak, log message, or doc-only change?
  -> Hot-fix. Make the change, run the full test suite, commit.

Do not skip stages. Respect every approval gate.

---

## REAE-Specific Rules

- **Compassionate design is non-negotiable.** No guilt language. No red overdue warnings.
  Overdue tasks go to a separate section with reschedule prompts.
- **"Break it down" is NOT labeled as AI anywhere in the UI.** Never add AI/Claude branding.
- **Rate limit "Break it down"** to 10 breakdowns per user per day. Enforce in the Edge Function.
- **Ranking engine lives in `services/rankingEngine.ts`** as a pure, standalone function.
  It must be independently testable with no UI dependencies.
- **Learning logger runs silently.** Never show RankingOverride logging activity to the user.
- **Widget-first philosophy.** The widget is the primary accountability mechanism.
  Push notifications are optional, not the default.
- **Gentle-first defaults.** New users get gentle reminder intensity for the first 7 days.
- **Daily notification budget is a hard cap.** Gentle = 5, Accountable = 8, Strong = 12.
- The energy parameter in the ranking engine function signature is reserved for future use.
  It must exist but is ignored in MVP.

---

## Documentation Rules

Keep these docs current. Update them in the same session as the code change, before committing.

### `docs/API_DOCS.md`
Update when:
- A new Supabase Edge Function is added or changed
- Auth or RLS policy behaviour changes
- A new API endpoint is added or removed

### `docs/DATABASE.md`
Update when:
- A table field is added, removed, or renamed
- An enum value is added or changed
- A new table is created
- RLS policy changes

### `docs/USER_GUIDE.md`
Update when:
- A user-facing screen is added, removed, or significantly changed
- A user workflow changes
- Terminology visible to users changes

### `docs/DESIGN_DECISIONS.md`
Update when:
- A new product decision is made
- An existing decision is reversed or changed

### `docs/FEATURES.md`
Update when:
- A planned feature is built → mark as done
- A feature is rejected → mark as rejected
- A new feature is planned → add as planned

---

## Code Rules

- Never hardcode secrets, API keys, or passwords — all secrets via environment variables
- Never store the Claude API key client-side — it must only exist in the Supabase Edge Function environment
- Follow existing patterns and conventions in the codebase
- Do not add new enums without updating DATABASE.md and FEATURES.md
- Keep the ranking engine as a pure function — no side effects, no network calls
- All Supabase queries must use Row-Level Security (RLS). Never bypass RLS.

---

## Database Migrations

REAE uses Supabase for the database. Schema changes are made via:
1. Supabase dashboard SQL editor (for initial setup)
2. Supabase migrations in `supabase/migrations/` (for tracked changes)

- Review every migration before applying it
- Apply migrations to production BEFORE deploying code that depends on the schema change
- Never modify a migration that has already been applied to production

---

## Deployment Rules

- Always ask "Shall I deploy?" before deploying to production. Never deploy without
  explicit user approval.
- Vercel deploys automatically from GitHub main branch — confirm before pushing to main.
- When a new Supabase Edge Function environment variable is added, note it must be
  set in the Supabase dashboard before deployment will work.
- After deploying, verify REAE.parlapalli.com is accessible before closing the session.
- If deployment fails: explain in plain English, do not retry blindly, ask how to proceed.

---

## Commit Rules

- Run the full test suite before every commit. Never commit code that fails any test.
- Push to the remote after every commit. Do not wait to be asked.
- Update all relevant docs before committing.
- Never commit secrets, `.env` files, or the Claude API key.
- Always commit docs changes in the same commit as the code change that triggered them.
- Use clear, descriptive commit messages. First line: imperative mood, under 72 chars.

## Pre-Commit Checklist — MANDATORY

Before every commit, output this checklist in the conversation and confirm each item.
Do not commit until all items are checked. This is non-negotiable.

```
PRE-COMMIT CHECKLIST
--------------------------------------------
[ ] Tests run — all passing (paste count)
[ ] Version bumped in VERSION + package.json (per BUILD.md versioning rules)
[ ] RELEASE_NOTES.md updated (or confirmed no user-facing change)
[ ] FEATURES.md updated (or confirmed no new/changed feature)
[ ] DESIGN_DECISIONS.md updated (or confirmed no new decision)
[ ] USER_GUIDE.md updated (or confirmed no UI/workflow change)
[ ] API_DOCS.md updated (or confirmed no endpoint change)
[ ] DATABASE.md updated (or confirmed no schema change)
[ ] Doc changes included in this same commit
--------------------------------------------
```

---

## Testing Rules

Tests live in `tests/`. Run them with:
```
cd C:\Projects\app && npx expo test
```

- At session start, run the full test suite to confirm a green baseline.
- If any test fails, flag it to the user before writing new code.
- Hot-fixes still require running the full test suite before committing.

### Test-First Workflow

Write or update tests **before** writing implementation code:
1. Define what the function/component must do (inputs, outputs, edge cases).
2. Write failing tests that assert that behaviour.
3. Implement until all tests pass.

### Critical Tests to Always Have

- Ranking engine: 10+ mock tasks covering every rule (due date, importance, pin, overdue, no due date)
- NLP parser: sample inputs covering date/time/importance parsing
- "Break it down" Edge Function: sample tasks, rate limit enforcement
- Notification service: budget cap, quiet hours, ignored detection

---

## Session End

Before ending a session or when the user signals they are done:

- Commit any pending changes (code + docs together).
- Push to remote.
- Update `C:\Projects\memory\reae.md` if any project facts changed:
  test count, deployment URLs, project status, migration history, build phase.
- Update `C:\Projects\memory\MEMORY.md` if the project's status, version, or URLs changed.
- Update `C:\Projects\BACKLOG.md` — mark active tasks as in progress or done,
  note exactly where we stopped so the next session can pick up immediately.
