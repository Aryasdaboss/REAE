/**
 * NLP Parser
 * Phase 2 — Engines
 *
 * Pure function — no side effects, no network calls.
 * Parses a natural language due date from a task title string.
 *
 * Examples:
 *   "Call dentist tomorrow"        → Date (tomorrow)
 *   "Submit report next Friday"    → Date (next Friday)
 *   "Buy groceries"                → null (no date found)
 */

import * as chrono from 'chrono-node';

/**
 * Parses a due date from a natural language string.
 *
 * @param input         - The task title or any free-text string.
 * @param referenceDate - The date to use as "today". Defaults to now. Pass a fixed
 *                        date in tests to keep results deterministic.
 * @returns             - A Date object if a date was found, or null if none was detected.
 */
export function parseDate(input: string, referenceDate: Date = new Date()): Date | null {
  if (!input || input.trim().length === 0) return null;

  const results = chrono.parse(input, referenceDate, { forwardDate: true });

  if (results.length === 0) return null;

  // Return the first detected date
  return results[0].date();
}
