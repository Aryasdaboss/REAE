/**
 * Authentication Tests
 * Phase 1 — Foundation
 *
 * Tests Supabase email/password auth: sign up, sign in, and error cases.
 * Uses unique test email addresses per run to avoid conflicts.
 */

import { supabase } from '../../services/supabaseClient';

// Unique email for this test run — avoids conflicts between runs.
const testEmail = `test-${Date.now()}@reae-test.example`;
const testPassword = 'TestPass123!';
const wrongPassword = 'WrongPass999!';
const nonExistentEmail = `no-such-user-${Date.now()}@reae-test.example`;

describe('Email/Password Sign Up', () => {
  it('creates a new account with a valid email and password', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    expect(error).toBeNull();
    expect(data.user).not.toBeNull();
    expect(data.user?.email).toBe(testEmail);
  });

  it('rejects sign up with an empty email', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: '',
      password: testPassword,
    });
    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
  });

  it('rejects sign up with an empty password', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: `another-${Date.now()}@reae-test.example`,
      password: '',
    });
    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
  });

  it('rejects sign up with a malformed email address', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'not-an-email',
      password: testPassword,
    });
    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
  });
});

describe('Email/Password Sign In', () => {
  it('signs in successfully with correct credentials', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
    expect(data.user?.email).toBe(testEmail);
  });

  it('returns an access token and refresh token on successful sign in', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    expect(error).toBeNull();
    expect(data.session?.access_token).toBeDefined();
    expect(data.session?.refresh_token).toBeDefined();
  });

  it('rejects sign in with the wrong password', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: wrongPassword,
    });
    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });

  it('rejects sign in for a non-existent user', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: nonExistentEmail,
      password: testPassword,
    });
    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });

  it('rejects sign in with an empty email', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: '',
      password: testPassword,
    });
    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });

  it('rejects sign in with an empty password', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: '',
    });
    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });
});

describe('Sign Out', () => {
  it('signs out the current user and clears the session', async () => {
    // Sign in first
    await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    const { error } = await supabase.auth.signOut();
    expect(error).toBeNull();

    const { data: { session } } = await supabase.auth.getSession();
    expect(session).toBeNull();
  });
});

describe('Unauthenticated Access', () => {
  beforeEach(async () => {
    // Ensure no user is signed in before each test in this block
    await supabase.auth.signOut();
  });

  it('returns null session when not signed in', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    expect(session).toBeNull();
  });

  it('cannot read tasks table when unauthenticated (RLS enforced)', async () => {
    const { data, error } = await supabase.from('tasks').select('*');
    // RLS should deny this — either returns empty data or an error
    const isBlocked =
      (data !== null && data.length === 0) ||
      error !== null;
    expect(isBlocked).toBe(true);
  });
});
