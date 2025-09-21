-- Fix RLS policy infinite recursion in user_profiles
-- The issue is that admin policies reference themselves causing infinite recursion

-- Disable RLS temporarily to modify policies safely
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_access_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_access_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admin_full_access" ON user_profiles;

-- Create clean, non-recursive policies
-- Policy 1: Users can access their own profile
CREATE POLICY "users_own_profile" ON user_profiles
FOR ALL USING (id = auth.uid());

-- Policy 2: Service role has full access (for admin operations)
CREATE POLICY "service_role_access" ON user_profiles
FOR ALL USING (auth.role() = 'service_role');

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;