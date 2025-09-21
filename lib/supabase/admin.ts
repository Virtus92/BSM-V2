import { createClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client with service role key
 * Bypasses RLS for admin operations
 * NEVER use this on client-side!
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Environment validation (no secrets in logs)

  if (!url) {
    throw new Error('Missing env NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!serviceRoleKey) {
    throw new Error('Missing env SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}