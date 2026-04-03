# REAE Database Documentation

Database: Supabase (PostgreSQL 15, free tier)

**Important:** The `tasks` table was created without quoted identifiers, so all
column names are stored in lowercase by PostgreSQL. Only `aiBreakdownAt` was
added later with quotes and preserves camelCase. Always use the exact column
names listed below in queries and application code.

---

## Tables

### `users`

Stores user profile data. One row per authenticated user.
Auto-populated by the `handle_new_user()` trigger on `auth.users`.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | NO | — | Primary key, matches `auth.users.id` |
| `email` | text | NO | — | User's email address |
| `authprovider` | text | YES | `'email'` | `'email'` or `'google'` |
| `createdat` | timestamptz | YES | `now()` | Account creation time |
| `notificationintensity` | text | YES | `'gentle'` | `'gentle'`, `'accountable'`, or `'strong'` |

**RLS:** Users can only read their own row. No direct insert/update from client
(handled by trigger).

---

### `tasks`

Stores all user tasks.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `userid` | uuid | NO | `auth.uid()` | Foreign key → `users.id`. Set by RLS. |
| `title` | text | NO | — | Task title |
| `importance` | text | NO | — | Enum: `'Low'`, `'Medium'`, `'High'`, `'Critical'` |
| `duedate` | date | YES | NULL | Optional due date |
| `notes` | text | YES | NULL | Optional notes |
| `color` | text | YES | NULL | Optional hex color for display |
| `indicator` | text | YES | NULL | Optional emoji indicator |
| `iscompleted` | boolean | NO | `false` | |
| `completedat` | timestamptz | YES | NULL | Set when `iscompleted` → true |
| `ispinned` | boolean | NO | `false` | Pinned tasks sort to top |
| `issnoozed` | boolean | NO | `false` | |
| `snoozeuntil` | timestamptz | YES | NULL | |
| `pomodorosessions` | integer | NO | `0` | |
| `notificationcount` | integer | NO | `0` | |
| `aibreakdownused` | boolean | NO | `false` | True once "Break it down" has been used |
| `"aiBreakdownAt"` | timestamptz | YES | NULL | When last breakdown was requested. **camelCase — quoted.** |
| `createdat` | timestamptz | NO | `now()` | |
| `updatedat` | timestamptz | NO | `now()` | Auto-updated by trigger |

**RLS:**
- SELECT: user can only read rows where `userid = auth.uid()`
- INSERT: user can only insert rows where `userid = auth.uid()`
- UPDATE: user can only update their own rows
- DELETE: user can only delete their own rows

---

## Migrations

| File | Applied | Description |
|---|---|---|
| _(initial schema)_ | 2026-03-31 | Created `users` and `tasks` tables, RLS policies, `handle_new_user()` trigger |
| `20260402_add_ai_breakdown_at.sql` | 2026-04-02 | Added `"aiBreakdownAt"` column to tasks |

---

## Enums

PostgreSQL does not enforce these as native enum types — they are enforced via
CHECK constraints:

- `tasks.importance`: `'Low'`, `'Medium'`, `'High'`, `'Critical'`
- `users.notificationintensity`: `'gentle'`, `'accountable'`, `'strong'`
