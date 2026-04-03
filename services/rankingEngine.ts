/**
 * Ranking Engine
 * Phase 2 — Engines
 *
 * Pure function — no side effects, no network calls, no Supabase.
 * Takes a list of tasks and returns them sorted by priority score.
 *
 * Scoring rules:
 *   1. Pinned tasks always appear first, sorted among themselves by score.
 *   2. All other tasks sorted by: importance score + due date score.
 *
 * The `energy` parameter is reserved for future use and ignored in MVP.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImportanceLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface RankedTask {
  id: string;
  title: string;
  importance: ImportanceLevel;
  isPinned: boolean;
  isCompleted: boolean;
  isSnoozed: boolean;
  dueDate: string | null;
  createdAt: string;
  [key: string]: unknown; // allow extra fields from DB without breaking the engine
}

export interface RankingWeights {
  importance: Record<ImportanceLevel, number>;
  dueDate: {
    overdue: number;
    today: number;
    withinThreeDays: number;
    withinSevenDays: number;
    noDueDate: number;
  };
}

// ─── Default Weights ──────────────────────────────────────────────────────────

export const defaultWeights: RankingWeights = {
  importance: {
    Critical: 40,
    High:     30,
    Medium:   20,
    Low:      10,
  },
  dueDate: {
    overdue:         25,
    today:           20,
    withinThreeDays: 10,
    withinSevenDays:  5,
    noDueDate:        0,
  },
};

// ─── Scoring Helpers ──────────────────────────────────────────────────────────

/**
 * Returns the number of whole days between two dates.
 * Positive = dueDate is in the future. Negative = overdue.
 */
function daysDiff(dueDate: Date, referenceDate: Date): number {
  const dueMidnight = new Date(dueDate);
  dueMidnight.setUTCHours(0, 0, 0, 0);

  const refMidnight = new Date(referenceDate);
  refMidnight.setUTCHours(0, 0, 0, 0);

  return Math.round(
    (dueMidnight.getTime() - refMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Calculates the due date score for a task based on how close it is to today.
 */
function dueDateScore(dueDate: string | null, weights: RankingWeights, referenceDate: Date): number {
  if (!dueDate) return weights.dueDate.noDueDate;

  const days = daysDiff(new Date(dueDate), referenceDate);

  if (days < 0)  return weights.dueDate.overdue;
  if (days === 0) return weights.dueDate.today;
  if (days <= 3) return weights.dueDate.withinThreeDays;
  if (days <= 7) return weights.dueDate.withinSevenDays;

  return weights.dueDate.noDueDate;
}

/**
 * Calculates the total priority score for a single task.
 * Higher score = shown earlier in the list.
 */
function scoreTask(task: RankedTask, weights: RankingWeights, referenceDate: Date): number {
  return weights.importance[task.importance] + dueDateScore(task.dueDate, weights, referenceDate);
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Sorts tasks by priority.
 *
 * @param tasks         - Array of tasks to rank.
 * @param weights       - Scoring weights. Use `defaultWeights` or pass custom weights.
 * @param energy        - Reserved for future use. Ignored in MVP.
 * @param referenceDate - The date to use as "today". Defaults to now. Pass a fixed
 *                        date in tests to keep results deterministic.
 * @returns             - New sorted array. Original array is not mutated.
 */
export function rankTasks(
  tasks: RankedTask[],
  weights: RankingWeights = defaultWeights,
  energy?: number,
  referenceDate: Date = new Date(),
): RankedTask[] {
  const pinned   = tasks.filter(t => t.isPinned);
  const unpinned = tasks.filter(t => !t.isPinned);

  const sortByScore = (a: RankedTask, b: RankedTask) =>
    scoreTask(b, weights, referenceDate) - scoreTask(a, weights, referenceDate);

  return [
    ...pinned.sort(sortByScore),
    ...unpinned.sort(sortByScore),
  ];
}
