/**
 * Today Presenter
 * Phase 3 — Core UI, Step 2
 *
 * Pure function — no side effects, no network calls, no React.
 * Bridges raw Supabase rows (lowercase columns) to the ranking engine
 * (camelCase RankedTask shape) and splits the result into the two
 * sections rendered on the Today screen.
 *
 * Compassionate-design rule: overdue tasks are returned in a separate
 * `overdue` bucket so the UI can present them as "Needs rescheduling"
 * without red warnings or guilt language.
 */

import { rankTasks, RankedTask, ImportanceLevel, defaultWeights, RankingWeights } from './rankingEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Shape of a single row as it comes back from Supabase.
 * Column names mirror the lowercase identifiers in the `tasks` table
 * (see docs/DATABASE.md). Only the fields used by the presenter are typed —
 * extra fields on the row are allowed and ignored.
 */
export interface TaskRow {
  id: string;
  title: string;
  importance: ImportanceLevel;
  ispinned: boolean;
  iscompleted: boolean;
  issnoozed: boolean;
  duedate: string | null;
  createdat: string;
  completedat?: string | null;
  [key: string]: unknown;
}

export interface TodaySections {
  today: RankedTask[];
  overdue: RankedTask[];
  done: RankedTask[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapRowToRankedTask(row: TaskRow): RankedTask {
  return {
    id: row.id,
    title: row.title,
    importance: row.importance,
    isPinned: row.ispinned,
    isCompleted: row.iscompleted,
    isSnoozed: row.issnoozed,
    dueDate: row.duedate,
    createdAt: row.createdat,
    completedAt: row.completedat ?? null,
  };
}

function isSameUtcDay(timestamp: string, referenceDate: Date): boolean {
  const t = new Date(timestamp);
  return (
    t.getUTCFullYear() === referenceDate.getUTCFullYear() &&
    t.getUTCMonth()    === referenceDate.getUTCMonth() &&
    t.getUTCDate()     === referenceDate.getUTCDate()
  );
}

function isOverdue(dueDate: string | null, referenceDate: Date): boolean {
  if (!dueDate) return false;

  const due = new Date(dueDate);
  due.setUTCHours(0, 0, 0, 0);

  const ref = new Date(referenceDate);
  ref.setUTCHours(0, 0, 0, 0);

  return due.getTime() < ref.getTime();
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Prepares the Today screen's two task sections from raw Supabase rows.
 *
 * Filters out completed and snoozed tasks, maps DB rows to the RankedTask
 * shape, ranks each section independently, and splits overdue tasks into
 * their own bucket.
 *
 * @param rows          - Raw rows from `select('*').from('tasks')`.
 * @param referenceDate - The date treated as "today". Defaults to now.
 *                        Pass a fixed date in tests to keep results deterministic.
 * @param weights       - Optional custom ranking weights.
 * @returns             - `{ today, overdue }` — both arrays sorted by rank.
 */
export function prepareTodayTasks(
  rows: TaskRow[],
  referenceDate: Date = new Date(),
  weights: RankingWeights = defaultWeights,
): TodaySections {
  const active = rows.filter(r => !r.iscompleted && !r.issnoozed);
  const mappedActive = active.map(mapRowToRankedTask);

  const overdueTasks = mappedActive.filter(t => isOverdue(t.dueDate, referenceDate));
  const todayTasks   = mappedActive.filter(t => !isOverdue(t.dueDate, referenceDate));

  const doneToday = rows
    .filter(r => r.iscompleted && r.completedat && isSameUtcDay(r.completedat, referenceDate))
    .map(mapRowToRankedTask)
    .sort((a, b) => {
      // most recent completion first
      const aT = a.completedAt as string;
      const bT = b.completedAt as string;
      return new Date(bT).getTime() - new Date(aT).getTime();
    });

  return {
    today:   rankTasks(todayTasks,   weights, undefined, referenceDate),
    overdue: rankTasks(overdueTasks, weights, undefined, referenceDate),
    done:    doneToday,
  };
}
