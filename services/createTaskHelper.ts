/**
 * Create Task Helper
 * Phase 3 — Core UI, Step 3
 *
 * Pure functions used by the CreateTaskSheet UI:
 *   - buildTaskDraft:        turns user input into the Supabase insert payload
 *   - formatDueDatePreview:  formats a parsed date for the "Due: X" preview line
 *
 * Both are pure (no Supabase, no React) so they can be unit tested without
 * mocking infrastructure.
 */

import { parseDate } from './nlpParser';
import { ImportanceLevel } from './rankingEngine';

export interface TaskDraftInput {
  title: string;
  importance: ImportanceLevel;
  referenceDate?: Date;
}

export interface TaskDraft {
  title: string;
  importance: ImportanceLevel;
  duedate: string | null;
}

/**
 * Builds the payload that gets inserted into the `tasks` table.
 * Returns null if the title is empty or whitespace-only.
 *
 * The date phrase inside the title is intentionally NOT stripped — users
 * generally want the original phrasing preserved on the card.
 */
export function buildTaskDraft({ title, importance, referenceDate = new Date() }: TaskDraftInput): TaskDraft | null {
  const trimmed = title.trim();
  if (trimmed.length === 0) return null;

  const parsed = parseDate(trimmed, referenceDate);

  return {
    title: trimmed,
    importance,
    duedate: parsed ? toDateString(parsed) : null,
  };
}

/**
 * Formats a parsed date for the live preview shown under the title input.
 * Returns null when there is no date to show.
 */
export function formatDueDatePreview(date: Date | null, referenceDate: Date = new Date()): string | null {
  if (!date) return null;

  const due = atUtcMidnight(date);
  const today = atUtcMidnight(referenceDate);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 6) return due.toLocaleDateString(undefined, { weekday: 'long', timeZone: 'UTC' });

  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function atUtcMidnight(d: Date): Date {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function toDateString(d: Date): string {
  // YYYY-MM-DD in UTC — matches the Postgres `date` column expectation
  const year  = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day   = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
