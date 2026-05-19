# REAE API Documentation

All backend logic runs as Supabase Edge Functions. The Supabase client handles
auth, RLS, and database queries directly — no separate REST API layer.

---

## Edge Functions

### `break-it-down`

Decomposes a task into a list of actionable sub-tasks using Claude Haiku.
Never labelled as AI in the UI.

**URL:** `{SUPABASE_URL}/functions/v1/break-it-down`

**Auth:** Requires a valid Supabase user JWT (`Authorization: Bearer <token>`).
The function is deployed with `--no-verify-jwt` to allow the Supabase client
to pass the token directly.

**Method:** `POST`

**Request body:**
```json
{
  "taskId": "uuid",
  "title": "string",
  "dueDate": "YYYY-MM-DD | null"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `taskId` | uuid | Yes | ID of the parent task |
| `title` | string | Yes | Title of the task to break down |
| `dueDate` | string \| null | No | Parent task's due date; helps spread sub-task due dates between today and the parent. Send `null` if no due date. |

**Response — success (200):**
```json
{
  "subTasks": [
    {
      "title": "string",
      "dueDate": "YYYY-MM-DD | null"
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `subTasks` | array | List of sub-tasks. Order is the order Claude generated them. |
| `subTasks[].title` | string | Short verb-first title (e.g. "Book venue") |
| `subTasks[].dueDate` | string \| null | YYYY-MM-DD, spread between today and parent's `dueDate` when present |

**Response — rate limit exceeded (429):**
```json
{ "error": "You've used all 10 breakdowns for today. Try again tomorrow." }
```

**Response — missing fields (400):**
```json
{ "error": "taskId is required" }
```
or
```json
{ "error": "title is required" }
```

**Response — auth missing/invalid (401):**
```json
{ "error": "Unauthorized" }
```

**Response — internal/Anthropic parse failure (500):**
```json
{ "error": "Failed to parse sub-tasks from response" }
```

**Rate limit:** 10 breakdowns per user per day. Tracked via the `aiBreakdownAt`
column on the tasks table. The function checks: if `aibreakdownused` is true AND
`"aiBreakdownAt"` was set within the last 24 hours, the request is blocked.

**Environment variables required (Supabase secrets):**
- `ANTHROPIC_API_KEY` — Claude API key (Haiku model)
- `SUPABASE_URL` — injected automatically by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — injected automatically by Supabase

---

## Supabase Auth

Auth is handled by Supabase Auth directly from the client.

| Operation | Method | Notes |
|---|---|---|
| Sign up | `supabase.auth.signUp()` | Email/password |
| Sign in | `supabase.auth.signInWithPassword()` | Email/password |
| Google sign in | `supabase.auth.signInWithOAuth()` | Provider: `google` |
| Sign out | `supabase.auth.signOut()` | |
| Get current user | `supabase.auth.getUser()` | |

On sign up, the `handle_new_user()` trigger automatically inserts a row into the
`users` table.

---

## RLS Policies

All tables enforce Row-Level Security. Users can only read, write, update, and
delete their own rows. The `userid` column on the `tasks` table is automatically
set from `auth.uid()` via RLS — it is never passed in from the client.
