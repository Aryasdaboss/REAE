/**
 * User Table Tests
 * Phase 1 — Foundation
 *
 * Verifies the User table is created correctly and that a user profile row
 * is created (or readable) after authentication.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const client = createClient(supabaseUrl, supabaseAnonKey);

const testEmail = `user-profile-${Date.now()}@reae-test.example`;
const testPassword = 'TestPass123!';

beforeAll(async () => {
  const { error } = await client.auth.signUp({ email: testEmail, password: testPassword });
  expect(error).toBeNull();
});

afterAll(async () => {
  await client.auth.signOut();
});

describe('User profile', () => {
  it('can read the current user profile row from the users table', async () => {
    const { data: authData } = await client.auth.getUser();
    const userId = authData.user?.id;
    expect(userId).toBeDefined();

    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data.id).toBe(userId);
    expect(data.email).toBe(testEmail);
  });

  it('user profile has required fields: id, email, authProvider, createdAt', async () => {
    const { data: authData } = await client.auth.getUser();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', authData.user?.id)
      .single();

    expect(error).toBeNull();
    expect(data.id).toBeDefined();
    expect(data.email).toBeDefined();
    expect(data.authProvider).toBeDefined();
    expect(data.createdAt).toBeDefined();
  });

  it('user profile has correct default values', async () => {
    const { data: authData } = await client.auth.getUser();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', authData.user?.id)
      .single();

    expect(error).toBeNull();
    expect(data.notificationBudget).toBe(5); // gentle default
    expect(data.ignoredNotificationCount).toBe(0);
    // firstWeekEndsAt should be set (7 days from account creation)
    expect(data.firstWeekEndsAt).not.toBeNull();
  });

  it('user cannot read another user profile (RLS enforced)', async () => {
    // Use a second client for a different user
    const client2 = createClient(supabaseUrl, supabaseAnonKey);
    const otherEmail = `other-user-${Date.now()}@reae-test.example`;
    await client2.auth.signUp({ email: otherEmail, password: testPassword });

    const { data: authData } = await client.auth.getUser();
    const userAId = authData.user?.id;

    // client2 (user B) tries to read user A's profile
    const { data, error } = await client2
      .from('users')
      .select('*')
      .eq('id', userAId);

    const isBlocked =
      (data !== null && data.length === 0) || error !== null;
    expect(isBlocked).toBe(true);

    await client2.auth.signOut();
  });
});
