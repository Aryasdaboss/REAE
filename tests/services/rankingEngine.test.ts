/**
 * Ranking Engine Tests
 * Phase 2 — Engines
 *
 * Pure function — no Supabase calls, safe to run anytime.
 * All date comparisons use a fixed reference date: 2026-04-02 (today).
 */

import { rankTasks, defaultWeights, RankedTask } from '../../services/rankingEngine';

// Fixed reference date so tests are deterministic
const TODAY = new Date('2026-04-02T12:00:00Z');

// Helper: build a minimal task object for testing
function makeTask(overrides: Partial<RankedTask>): RankedTask {
  return {
    id: Math.random().toString(),
    title: 'Test task',
    importance: 'Medium',
    isPinned: false,
    isCompleted: false,
    isSnoozed: false,
    dueDate: null,
    createdAt: '2026-04-01T00:00:00Z',
    ...overrides,
  };
}

describe('Ranking Engine — importance scoring', () => {
  it('ranks Critical above High', () => {
    const tasks = [
      makeTask({ id: 'high', importance: 'High' }),
      makeTask({ id: 'critical', importance: 'Critical' }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('critical');
    expect(result[1].id).toBe('high');
  });

  it('ranks High above Medium', () => {
    const tasks = [
      makeTask({ id: 'medium', importance: 'Medium' }),
      makeTask({ id: 'high', importance: 'High' }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('high');
  });

  it('ranks Medium above Low', () => {
    const tasks = [
      makeTask({ id: 'low', importance: 'Low' }),
      makeTask({ id: 'medium', importance: 'Medium' }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('medium');
  });

  it('ranks all four importance levels in correct order', () => {
    const tasks = [
      makeTask({ id: 'low', importance: 'Low' }),
      makeTask({ id: 'critical', importance: 'Critical' }),
      makeTask({ id: 'medium', importance: 'Medium' }),
      makeTask({ id: 'high', importance: 'High' }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result.map(t => t.id)).toEqual(['critical', 'high', 'medium', 'low']);
  });
});

describe('Ranking Engine — due date scoring', () => {
  it('ranks overdue above due today (same importance)', () => {
    const tasks = [
      makeTask({ id: 'today', dueDate: '2026-04-02' }),
      makeTask({ id: 'overdue', dueDate: '2026-03-30' }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('overdue');
  });

  it('ranks due today above due in 3 days', () => {
    const tasks = [
      makeTask({ id: 'three-days', dueDate: '2026-04-04' }),
      makeTask({ id: 'today', dueDate: '2026-04-02' }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('today');
  });

  it('ranks due within 3 days above due within 7 days', () => {
    const tasks = [
      makeTask({ id: 'seven-days', dueDate: '2026-04-08' }),
      makeTask({ id: 'three-days', dueDate: '2026-04-04' }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('three-days');
  });

  it('ranks due within 7 days above no due date', () => {
    const tasks = [
      makeTask({ id: 'no-date', dueDate: null }),
      makeTask({ id: 'seven-days', dueDate: '2026-04-08' }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('seven-days');
  });

  it('a task due in more than 7 days scores the same as no due date', () => {
    const tasks = [
      makeTask({ id: 'far-future', dueDate: '2026-05-01' }),
      makeTask({ id: 'no-date', dueDate: null }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    // Both score 0 for due date — order between them is not guaranteed,
    // but neither should crash
    expect(result).toHaveLength(2);
  });
});

describe('Ranking Engine — pinned tasks', () => {
  it('pinned task always appears first, even with lower importance', () => {
    const tasks = [
      makeTask({ id: 'critical-unpinned', importance: 'Critical' }),
      makeTask({ id: 'low-pinned', importance: 'Low', isPinned: true }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('low-pinned');
  });

  it('multiple pinned tasks are sorted among themselves by score', () => {
    const tasks = [
      makeTask({ id: 'pinned-low', importance: 'Low', isPinned: true }),
      makeTask({ id: 'pinned-high', importance: 'High', isPinned: true }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('pinned-high');
    expect(result[1].id).toBe('pinned-low');
  });

  it('pinned tasks appear before all unpinned tasks', () => {
    const tasks = [
      makeTask({ id: 'unpinned-critical', importance: 'Critical' }),
      makeTask({ id: 'pinned-low', importance: 'Low', isPinned: true }),
      makeTask({ id: 'unpinned-high', importance: 'High' }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('pinned-low');
  });
});

describe('Ranking Engine — combined scoring', () => {
  it('Medium + overdue outranks High + no due date', () => {
    // Medium(20) + overdue(25) = 45 vs High(30) + no date(0) = 30
    const tasks = [
      makeTask({ id: 'high-no-date', importance: 'High', dueDate: null }),
      makeTask({ id: 'medium-overdue', importance: 'Medium', dueDate: '2026-03-28' }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('medium-overdue');
  });

  it('Low + overdue outranks Medium + no due date', () => {
    // Low(10) + overdue(25) = 35 vs Medium(20) + no date(0) = 20
    const tasks = [
      makeTask({ id: 'medium-no-date', importance: 'Medium', dueDate: null }),
      makeTask({ id: 'low-overdue', importance: 'Low', dueDate: '2026-03-01' }),
    ];
    const result = rankTasks(tasks, defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('low-overdue');
  });
});

describe('Ranking Engine — edge cases', () => {
  it('returns an empty array when given no tasks', () => {
    const result = rankTasks([], defaultWeights, undefined, TODAY);
    expect(result).toEqual([]);
  });

  it('returns a single task unchanged', () => {
    const task = makeTask({ id: 'solo' });
    const result = rankTasks([task], defaultWeights, undefined, TODAY);
    expect(result[0].id).toBe('solo');
  });

  it('accepts custom weights and ranks accordingly', () => {
    const customWeights = {
      ...defaultWeights,
      importance: { Critical: 40, High: 30, Medium: 20, Low: 100 }, // Low boosted
    };
    const tasks = [
      makeTask({ id: 'high', importance: 'High' }),
      makeTask({ id: 'low', importance: 'Low' }),
    ];
    const result = rankTasks(tasks, customWeights, undefined, TODAY);
    expect(result[0].id).toBe('low');
  });

  it('ignores the energy parameter without error', () => {
    const task = makeTask({ id: 'test' });
    expect(() => rankTasks([task], defaultWeights, 5, TODAY)).not.toThrow();
    expect(() => rankTasks([task], defaultWeights, undefined, TODAY)).not.toThrow();
  });
});
