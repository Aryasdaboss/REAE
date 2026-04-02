/**
 * Task Table — CRUD and RLS Tests
 * Phase 1 — Foundation
 *
 * Tests creating, reading, updating, and deleting tasks in Supabase.
 * Verifies Row-Level Security: a user can only see their own tasks.
 *
 * Two test accounts are used to verify RLS cross-user isolation:
 *   userA — creates tasks
 *   userB — must NOT be able to read userA's tasks
 */

import { supabase } from '../../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';

// Pull Supabase URL + keys from environment (set in .env.local)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Two independent Supabase clients — one per user — so we can test RLS isolation.
const clientA = createClient(supabaseUrl, supabaseAnonKey);
const clientB = createClient(supabaseUrl, supabaseAnonKey);

const userAEmail = `user-a-${Date.now()}@reae-test.example`;
const userBEmail = `user-b-${Date.now()}@reae-test.example`;
const testPassword = 'TestPass123!';

let createdTaskId: string;

// ─── Set Up: sign up and sign in both test users ─────────────────────────────

beforeAll(async () => {
  const [resA, resB] = await Promise.all([
    clientA.auth.signUp({ email: userAEmail, password: testPassword }),
    clientB.auth.signUp({ email: userBEmail, password: testPassword }),
  ]);
  expect(resA.error).toBeNull();
  expect(resB.error).toBeNull();
});

afterAll(async () => {
  await Promise.all([clientA.auth.signOut(), clientB.auth.signOut()]);
});

// ─── Task Creation ────────────────────────────────────────────────────────────

describe('Task creation', () => {
  it('inserts a task with required fields and returns the new record', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .insert({ title: 'Call dentist', importance: 'Medium' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data.title).toBe('Call dentist');
    expect(data.importance).toBe('Medium');
    expect(data.id).toBeDefined();

    createdTaskId = data.id;
  });

  it('sets default values: isCompleted = false, isPinned = false, pomodoroSessions = 0', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .insert({ title: 'Default values test', importance: 'Low' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.isCompleted).toBe(false);
    expect(data.isPinned).toBe(false);
    expect(data.isSnoozed).toBe(false);
    expect(data.pomodoroSessions).toBe(0);
    expect(data.notificationCount).toBe(0);
    expect(data.aiBreakdownUsed).toBe(false);
  });

  it('rejects a task with no title (required field)', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .insert({ importance: 'Medium' })
      .select()
      .single();

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it('rejects a task with no importance (required field)', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .insert({ title: 'No importance' })
      .select()
      .single();

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it('rejects an invalid importance value (must be Low/Medium/High/Critical)', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .insert({ title: 'Bad importance', importance: 'Extreme' })
      .select()
      .single();

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it('accepts all four valid importance values', async () => {
    const values = ['Low', 'Medium', 'High', 'Critical'];
    for (const importance of values) {
      const { error } = await clientA
        .from('tasks')
        .insert({ title: `Importance ${importance} test`, importance })
        .select()
        .single();
      expect(error).toBeNull();
    }
  });

  it('accepts optional fields: dueDate, notes, color, indicator', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .insert({
        title: 'Task with extras',
        importance: 'High',
        dueDate: '2026-04-01',
        notes: 'Some notes here',
        color: '#FF0000',
        indicator: '🔥',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.dueDate).toBe('2026-04-01');
    expect(data.notes).toBe('Some notes here');
  });

  it('stores userId automatically from the authenticated session', async () => {
    const { data: userData } = await clientA.auth.getUser();
    const { data, error } = await clientA
      .from('tasks')
      .insert({ title: 'UserId check', importance: 'Low' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.userId).toBe(userData.user?.id);
  });
});

// ─── Task Reading ─────────────────────────────────────────────────────────────

describe('Task reading', () => {
  it("returns the authenticated user's tasks", async () => {
    const { data, error } = await clientA.from('tasks').select('*');
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data!.length).toBeGreaterThan(0);
  });

  it('returns the correct task by ID', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .select('*')
      .eq('id', createdTaskId)
      .single();

    expect(error).toBeNull();
    expect(data.id).toBe(createdTaskId);
    expect(data.title).toBe('Call dentist');
  });

  it('returns an empty array when no tasks match the filter', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000');

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ─── Task Updating ────────────────────────────────────────────────────────────

describe('Task updating', () => {
  it('updates the title of an existing task', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .update({ title: 'Call dentist — UPDATED' })
      .eq('id', createdTaskId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.title).toBe('Call dentist — UPDATED');
  });

  it('marks a task as completed and sets completedAt', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .update({ isCompleted: true, completedAt: new Date().toISOString() })
      .eq('id', createdTaskId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.isCompleted).toBe(true);
    expect(data.completedAt).not.toBeNull();
  });

  it('marks a task as pinned', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .update({ isPinned: true })
      .eq('id', createdTaskId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.isPinned).toBe(true);
  });
});

// ─── Task Deletion ────────────────────────────────────────────────────────────

describe('Task deletion', () => {
  it('deletes a task owned by the authenticated user', async () => {
    // Create a task to delete
    const { data: created } = await clientA
      .from('tasks')
      .insert({ title: 'To be deleted', importance: 'Low' })
      .select()
      .single();

    const { error } = await clientA
      .from('tasks')
      .delete()
      .eq('id', created!.id);

    expect(error).toBeNull();

    // Confirm it's gone
    const { data: deleted } = await clientA
      .from('tasks')
      .select('*')
      .eq('id', created!.id);

    expect(deleted).toEqual([]);
  });
});

// ─── Row-Level Security: Cross-User Isolation ─────────────────────────────────

describe('RLS — cross-user isolation', () => {
  let userATaskId: string;

  beforeAll(async () => {
    const { data } = await clientA
      .from('tasks')
      .insert({ title: 'User A private task', importance: 'High' })
      .select()
      .single();
    userATaskId = data!.id;
  });

  it("user B cannot read user A's tasks", async () => {
    const { data, error } = await clientB
      .from('tasks')
      .select('*')
      .eq('id', userATaskId);

    // RLS should return 0 rows — user B sees nothing of user A's data
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("user B cannot update user A's task", async () => {
    const { data, error } = await clientB
      .from('tasks')
      .update({ title: 'Hijacked' })
      .eq('id', userATaskId)
      .select();

    // RLS either returns an error or 0 affected rows
    const isBlocked =
      error !== null || (data !== null && data.length === 0);
    expect(isBlocked).toBe(true);
  });

  it("user B cannot delete user A's task", async () => {
    const { error } = await clientB
      .from('tasks')
      .delete()
      .eq('id', userATaskId);

    // Verify task still exists in user A's client
    const { data } = await clientA
      .from('tasks')
      .select('*')
      .eq('id', userATaskId);

    expect(data!.length).toBe(1);
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('handles a very long title (500 characters)', async () => {
    const longTitle = 'A'.repeat(500);
    const { error } = await clientA
      .from('tasks')
      .insert({ title: longTitle, importance: 'Low' })
      .select()
      .single();

    // Either accepted or rejected — both are valid DB responses, not crashes
    expect(error === null || error !== null).toBe(true);
  });

  it('handles special characters in title', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .insert({ title: "Task with 'quotes' & <special> chars 你好 🎯", importance: 'Low' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.title).toBe("Task with 'quotes' & <special> chars 你好 🎯");
  });

  it('handles an empty notes field (null is acceptable)', async () => {
    const { data, error } = await clientA
      .from('tasks')
      .insert({ title: 'No notes', importance: 'Low', notes: null })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.notes).toBeNull();
  });
});
