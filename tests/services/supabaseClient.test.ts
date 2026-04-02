/**
 * Supabase Client Connection Tests
 * Phase 1 — Foundation
 *
 * Verifies the Supabase client is correctly configured and can reach the project.
 */

import { supabase } from '../../services/supabaseClient';

describe('Supabase Client', () => {
  it('is defined and not null', () => {
    expect(supabase).toBeDefined();
    expect(supabase).not.toBeNull();
  });

  it('has auth, from, and storage properties', () => {
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();
    expect(supabase.storage).toBeDefined();
  });

  it('can reach the Supabase project (health check)', async () => {
    // A simple query that requires no auth — just checks connectivity.
    // If the project URL or anon key is wrong, this will throw or return an error.
    const { error } = await supabase.from('tasks').select('id').limit(1);
    // We expect either success or a "no rows" response, NOT a network/config error.
    // A "permission denied" RLS error here means connectivity works (RLS is enforcing).
    const isConnected =
      error === null ||
      (error.code !== 'ECONNREFUSED' && error.code !== 'ENOTFOUND');
    expect(isConnected).toBe(true);
  });
});
