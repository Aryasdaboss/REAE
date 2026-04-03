# REAE User Guide

**Current version:** 0.1.0
**Live URL:** https://REAE.parlapalli.com

---

## What Is REAE?

REAE is a task prioritization app. It tells you what to work on next, so you
don't have to decide. The ranking engine surfaces your most important task
automatically based on due dates, importance, and your own usage patterns.

---

## Getting Started

### Sign Up

1. Open REAE.parlapalli.com
2. Enter your email and a password, then tap **Sign Up**
3. You're in — no email verification required

### Sign In with Google

1. Tap **Sign in with Google**
2. Authorize REAE in the Google OAuth prompt
3. You're signed in

---

## Tasks

### Adding a Task

_Phase 3 (Core UI) — not yet built._

Tasks can currently be added directly via the Supabase dashboard for testing.

### Task Fields

| Field | Required | Notes |
|---|---|---|
| Title | Yes | Plain text. Can include a date phrase (e.g. "call dentist by Friday"). |
| Importance | Yes | Low, Medium, High, or Critical |
| Due date | No | Optional. Parsed automatically from the title if a date phrase is present. |
| Notes | No | Freeform notes |
| Color | No | Hex color for visual grouping |
| Indicator | No | Emoji shorthand (e.g. 🔥 for urgent) |

---

## "Break It Down"

_Phase 3 (Core UI) — UI not yet built. Edge Function is ready._

On any task, you can tap **Break it down** to decompose it into a list of
smaller, actionable steps. You can use this feature up to 10 times per day.

---

## Notifications

_Phase 5 — not yet built._

REAE uses a gentle-first notification approach. New users receive gentle reminder
intensity for the first 7 days. You can adjust this in Settings.

| Intensity | Daily cap |
|---|---|
| Gentle | 5 |
| Accountable | 8 |
| Strong | 12 |

---

## Known Limitations (MVP)

- Web only (iOS app planned for Stage B)
- No offline support
- No recurring tasks yet (Phase 4)
- No search/filter yet (Phase 5)
