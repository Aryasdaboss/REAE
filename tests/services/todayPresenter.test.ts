/**
 * Today Presenter Tests
 * Phase 3 — Core UI, Step 2
 *
 * Pure function — no Supabase calls, safe to run anytime.
 * All date comparisons use a fixed reference date: 2026-05-18.
 */

import { prepareTodayTasks, TaskRow } from '../../services/todayPresenter';

// Fixed reference date so tests are deterministic
const TODAY = new Date('2026-05-18T12:00:00Z');

// Helper: build a minimal Supabase row for testing (DB-style lowercase columns)
function makeRow(overrides: Partial<TaskRow>): TaskRow {
  return {
    id: Math.random().toString(),
    title: 'Test task',
    importance: 'Medium',
    ispinned: false,
    iscompleted: false,
    issnoozed: false,
    duedate: null,
    createdat: '2026-05-17T00:00:00Z',
    ...overrides,
  };
}

describe('prepareTodayTasks — empty + filtering', () => {
  it('returns empty sections when given no rows', () => {
    const result = prepareTodayTasks([], TODAY);
    expect(result.today).toEqual([]);
    expect(result.overdue).toEqual([]);
  });

  it('filters out completed tasks', () => {
    const rows = [
      makeRow({ id: '1', title: 'Done', iscompleted: true }),
      makeRow({ id: '2', title: 'Active' }),
    ];
    const result = prepareTodayTasks(rows, TODAY);
    expect(result.today).toHaveLength(1);
    expect(result.today[0].id).toBe('2');
    expect(result.overdue).toHaveLength(0);
  });

  it('filters out snoozed tasks', () => {
    const rows = [
      makeRow({ id: '1', title: 'Snoozed', issnoozed: true }),
      makeRow({ id: '2', title: 'Active' }),
    ];
    const result = prepareTodayTasks(rows, TODAY);
    expect(result.today).toHaveLength(1);
    expect(result.today[0].id).toBe('2');
  });
});

describe('prepareTodayTasks — DB → engine mapping', () => {
  it('maps every lowercase DB column to its camelCase RankedTask field', () => {
    const row = makeRow({
      id: 'abc',
      title: 'Mapped task',
      importance: 'High',
      ispinned: true,
      iscompleted: false,
      issnoozed: false,
      duedate: '2026-05-20',
      createdat: '2026-05-10T00:00:00Z',
    });
    const result = prepareTodayTasks([row], TODAY);
    const task = result.today[0];
    expect(task).toMatchObject({
      id: 'abc',
      title: 'Mapped task',
      importance: 'High',
      isPinned: true,
      isCompleted: false,
      isSnoozed: false,
      dueDate: '2026-05-20',
      createdAt: '2026-05-10T00:00:00Z',
    });
  });
});

describe('prepareTodayTasks — overdue split', () => {
  it('puts a task with a past due date into the overdue bucket', () => {
    const rows = [makeRow({ id: '1', duedate: '2026-05-10' })]; // 8 days ago
    const result = prepareTodayTasks(rows, TODAY);
    expect(result.today).toHaveLength(0);
    expect(result.overdue).toHaveLength(1);
    expect(result.overdue[0].id).toBe('1');
  });

  it('keeps a task due today in the today bucket (not overdue)', () => {
    const rows = [makeRow({ id: '1', duedate: '2026-05-18' })];
    const result = prepareTodayTasks(rows, TODAY);
    expect(result.today).toHaveLength(1);
    expect(result.overdue).toHaveLength(0);
  });

  it('keeps a task due in the future in the today bucket', () => {
    const rows = [makeRow({ id: '1', duedate: '2026-05-25' })];
    const result = prepareTodayTasks(rows, TODAY);
    expect(result.today).toHaveLength(1);
    expect(result.overdue).toHaveLength(0);
  });

  it('keeps a task with no due date in the today bucket', () => {
    const rows = [makeRow({ id: '1', duedate: null })];
    const result = prepareTodayTasks(rows, TODAY);
    expect(result.today).toHaveLength(1);
    expect(result.overdue).toHaveLength(0);
  });

  it('splits a mixed list into the correct buckets', () => {
    const rows = [
      makeRow({ id: 'past',   duedate: '2026-05-01' }),
      makeRow({ id: 'today',  duedate: '2026-05-18' }),
      makeRow({ id: 'future', duedate: '2026-06-01' }),
      makeRow({ id: 'none',   duedate: null }),
    ];
    const result = prepareTodayTasks(rows, TODAY);
    expect(result.overdue.map(t => t.id)).toEqual(['past']);
    expect(result.today.map(t => t.id).sort()).toEqual(['future', 'none', 'today']);
  });
});

describe('prepareTodayTasks — ranking integration', () => {
  it('orders the today bucket by ranking score (pinned first, then importance + due)', () => {
    const rows = [
      makeRow({ id: 'low',     importance: 'Low'                                 }),
      makeRow({ id: 'crit',    importance: 'Critical'                            }),
      makeRow({ id: 'pinmed',  importance: 'Medium',  ispinned: true             }),
      makeRow({ id: 'highdue', importance: 'High',    duedate: '2026-05-18'      }), // due today
    ];
    const result = prepareTodayTasks(rows, TODAY);
    expect(result.today[0].id).toBe('pinmed'); // pinned always first
    // among unpinned: highdue (30+20=50) > crit (40) > low (10)
    expect(result.today.slice(1).map(t => t.id)).toEqual(['highdue', 'crit', 'low']);
  });

  it('orders the overdue bucket by ranking score too', () => {
    const rows = [
      makeRow({ id: 'a', importance: 'Low',      duedate: '2026-05-10' }),
      makeRow({ id: 'b', importance: 'Critical', duedate: '2026-05-10' }),
    ];
    const result = prepareTodayTasks(rows, TODAY);
    expect(result.overdue.map(t => t.id)).toEqual(['b', 'a']);
  });
});

describe('prepareTodayTasks — immutability', () => {
  it('does not mutate the input rows array', () => {
    const rows = [
      makeRow({ id: '1', duedate: '2026-05-10' }),
      makeRow({ id: '2', duedate: '2026-05-25' }),
    ];
    const snapshot = JSON.stringify(rows);
    prepareTodayTasks(rows, TODAY);
    expect(JSON.stringify(rows)).toBe(snapshot);
  });
});
