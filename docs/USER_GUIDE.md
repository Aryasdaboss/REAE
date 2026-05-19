# REAE User Guide

**Current version:** 0.3.0
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
in two sections plus a collapsible "Today's wins" section at the bottom:

- **Today** — everything not yet due in the past, sorted by the ranking engine.
  Pinned tasks always appear first.
- **Needs rescheduling** — tasks whose due date has already passed. No red
  warnings or guilt language — just a calm prompt to revisit.
- **Today's wins** — tasks you completed today. Collapsed by default; tap the
  header to expand. Resets each calendar day.

The empty state ("All clear.") appears when you have nothing in any section.

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

### Completing a Task

Tap the **hollow circle** on the left edge of any active task card. The circle
fills with a warm gold check, the title gets a strikethrough, and the card
moves to the **Today's wins** section at the bottom of the screen. The update
is optimistic — the UI reacts instantly while the save runs in the background.

If the save fails for any reason, the card returns to its original section and
a brief error appears at the top of the list.

### "Break It Down"

Tap **Break it down** on any active task card. A short "Thinking…" spinner
shows while the request is in flight; on success, an inline list of suggested
sub-tasks appears directly below the task title.

Sub-tasks are **display-only in this release** — they do not persist across
reloads, and they are not editable. They live only in your current view of
the card. (Real sub-task storage lands in a later phase.)

You can use Break it down up to **10 times per day**. After the limit you'll
see a polite inline message:

> *"You've used all 10 breakdowns today. Try again tomorrow."*

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

<!-- "Break It Down" section moved up under Tasks in v0.3.0 -->


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
