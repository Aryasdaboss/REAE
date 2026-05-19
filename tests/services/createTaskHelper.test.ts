/**
 * Create Task Helper Tests
 * Phase 3 — Core UI, Step 3
 *
 * Pure functions — no Supabase, no React. Written before the implementation
 * (TDD). All date comparisons use a fixed reference date: 2026-05-18 (Monday).
 */

import { buildTaskDraft, formatDueDatePreview } from '../../services/createTaskHelper';

// Monday, 2026-05-18 at noon UTC — keeps tests deterministic
const TODAY = new Date('2026-05-18T12:00:00Z');

describe('buildTaskDraft — payload shape', () => {
  it('returns the title trimmed and importance unchanged when there is no date', () => {
    const draft = buildTaskDraft({
      title: '  Buy groceries  ',
      importance: 'Medium',
      referenceDate: TODAY,
    });
    expect(draft).not.toBeNull();
    expect(draft!.title).toBe('Buy groceries');
    expect(draft!.importance).toBe('Medium');
    expect(draft!.duedate).toBeNull();
  });

  it('produces a YYYY-MM-DD duedate when the title contains a date phrase', () => {
    const draft = buildTaskDraft({
      title: 'Call dentist tomorrow',
      importance: 'High',
      referenceDate: TODAY,
    });
    expect(draft).not.toBeNull();
    expect(draft!.duedate).toBe('2026-05-19');
    expect(draft!.importance).toBe('High');
  });

  it('keeps the date phrase inside the title (we do not strip it in v1)', () => {
    const draft = buildTaskDraft({
      title: 'Call dentist tomorrow',
      importance: 'High',
      referenceDate: TODAY,
    });
    expect(draft).not.toBeNull();
    expect(draft!.title).toBe('Call dentist tomorrow');
  });

  it('preserves each importance level', () => {
    for (const level of ['Low', 'Medium', 'High', 'Critical'] as const) {
      const draft = buildTaskDraft({ title: 'x', importance: level, referenceDate: TODAY });
      expect(draft).not.toBeNull();
      expect(draft!.importance).toBe(level);
    }
  });

  it('rejects an empty title by returning null', () => {
    expect(buildTaskDraft({ title: '',     importance: 'Medium', referenceDate: TODAY })).toBeNull();
    expect(buildTaskDraft({ title: '   ',  importance: 'Medium', referenceDate: TODAY })).toBeNull();
  });
});

describe('formatDueDatePreview — UI label', () => {
  it('returns null when there is no parsed date', () => {
    expect(formatDueDatePreview(null, TODAY)).toBeNull();
  });

  it('returns "Today" when the parsed date is today', () => {
    expect(formatDueDatePreview(new Date('2026-05-18T15:00:00Z'), TODAY)).toBe('Today');
  });

  it('returns "Tomorrow" when the parsed date is tomorrow', () => {
    expect(formatDueDatePreview(new Date('2026-05-19T09:00:00Z'), TODAY)).toBe('Tomorrow');
  });

  it('returns the weekday name for dates within the next 6 days', () => {
    // 2026-05-22 is a Friday
    const label = formatDueDatePreview(new Date('2026-05-22T09:00:00Z'), TODAY);
    expect(label).toBe('Friday');
  });

  it('returns a "Mon D" style label for dates further out', () => {
    // 2026-06-10 is 23 days out
    const label = formatDueDatePreview(new Date('2026-06-10T09:00:00Z'), TODAY);
    expect(label).toMatch(/Jun 10|June 10/);
  });
});
