-- Fix RLS policy infinite recursion in user_profiles - FINAL CLEAN FIX
-- The problem is recursive admin checks

-- Disable RLS temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "users_access_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_access_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admin_full_access" ON user_profiles;

-- Create simple policies without recursion
-- Policy 1: Users can access their own profile
CREATE POLICY "users_own_profile" ON user_profiles
FOR ALL USING (id = auth.uid());

-- Policy 2: Service role has full access (for admin operations)
CREATE POLICY "service_role_access" ON user_profiles
FOR ALL USING (auth.role() = 'service_role');

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify the fix
SELECT 'RLS Policies Fixed' as status, count(*) as policy_count
FROM pg_policies
WHERE tablename = 'user_profiles';