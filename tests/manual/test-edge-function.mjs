/**
 * Manual test for the break-it-down Edge Function.
 * Run with: node tests/manual/test-edge-function.mjs
 * Requires SUPABASE_SERVICE_ROLE_KEY env var.
 *
 * This script:
 * 1. Creates a temporary test user (bypasses email rate limit)
 * 2. Signs in to get a user JWT
 * 3. Inserts a test task
 * 4. Calls the Edge Function
 * 5. Prints the result
 * 6. Cleans up (deletes task + user)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ifysgbdschyqfygoahaj.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testEmail = `edge-fn-test-${Date.now()}@reae-test.example`;
const testPassword = 'TestPassword123!';

let userId = null;
let taskId = null;

try {
  // ── 1. Create test user (admin bypasses email rate limit) ─────────────────
  console.log('Creating test user...');
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });
  if (createError) throw new Error(`Create user failed: ${createError.message}`);
  userId = newUser.user.id;
  console.log(`  Created user: ${userId}`);

  // ── 2. Sign in as the user to get a JWT ───────────────────────────────────
  console.log('Signing in...');
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: session, error: signInError } = await userClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (signInError) throw new Error(`Sign in failed: ${signInError.message}`);
  const accessToken = session.session.access_token;
  console.log('  Signed in successfully.');

  // ── 3. Insert a test task via admin (bypasses RLS for test setup) ─────────
  console.log('Inserting test task...');
  const { data: tasks, error: insertError } = await adminClient
    .from('tasks')
    .insert({ title: 'Plan my birthday party', importance: 'Medium', userid: userId })
    .select()
    .single();
  if (insertError) throw new Error(`Insert task failed: ${insertError.message}`);
  taskId = tasks.id;
  console.log(`  Task ID: ${taskId}`);

  // ── 4. Call the Edge Function ─────────────────────────────────────────────
  console.log('\nCalling break-it-down Edge Function...');
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/break-it-down`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
        title: 'Plan my birthday party',
        dueDate: null,
      }),
    }
  );

  const result = await response.json();
  console.log(`\nStatus: ${response.status}`);
  console.log('Response:');
  console.log(JSON.stringify(result, null, 2));

} catch (err) {
  console.error('\nERROR:', err.message);
} finally {
  // ── 5. Clean up ───────────────────────────────────────────────────────────
  console.log('\nCleaning up...');
  if (taskId) {
    await adminClient.from('tasks').delete().eq('id', taskId);
    console.log('  Deleted test task.');
  }
  if (userId) {
    await adminClient.auth.admin.deleteUser(userId);
    console.log('  Deleted test user.');
  }
}
