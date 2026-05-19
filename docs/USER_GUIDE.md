# REAE User Guide

**Current version:** 0.2.0
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

## Today Screen

After signing in you land on the **Today** screen. It shows your active tasks
in two sections:

- **Today** — everything not yet due in the past, sorted by the ranking engine.
  Pinned tasks always appear first.
- **Needs rescheduling** — tasks whose due date has already passed. No red
  warnings or guilt language — just a calm prompt to revisit.

The empty state ("All clear.") appears when you have nothing active.

## Tasks

### Adding a Task

Tap the **gold "+" button** in the bottom-right corner of the screen. A sheet
slides up from the bottom with:

- **Title input** — type the task. If your title includes a date phrase
  ("call dentist tomorrow", "submit report next Friday") a **Due: X** preview
  appears below the input within a keystroke.
- **Importance picker** — Low / Medium / High / Critical. Medium is the default.
- **Save** — inserts the task and re-ranks the list.
- **Cancel** or **tap the backdrop** — dismisses without saving.

The date phrase is left in the title (we don't strip it).

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

_UI lands in v0.3.0 (Phase 3 Step 5). The Edge Function is already deployed._

On any task, you'll be able to tap **Break it down** to decompose it into a
list of smaller, actionable steps. You can use this feature up to 10 times
per day.

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
