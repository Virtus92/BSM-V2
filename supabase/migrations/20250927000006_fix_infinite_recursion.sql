-- Fix infinite recursion in user_profiles RLS policies
-- Drop ALL policies and create only ONE clean policy

-- Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "user_own_profile_select" ON user_profiles;
DROP POLICY IF EXISTS "user_own_profile_update" ON user_profiles;
DROP POLICY IF EXISTS "admin_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "staff_read_profiles" ON user_profiles;
DROP POLICY IF EXISTS "service_role_profiles" ON user_profiles;
DROP POLICY IF EXISTS "employee_relevant_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "users_can_see_relevant_profiles" ON user_profiles;
DROP POLICY IF EXISTS "users_can_see_relevant_profiles_fixed" ON user_profiles;

-- Create ONE simple, completely non-recursive policy
-- This policy allows basic access without any circular dependencies
CREATE POLICY "user_profiles_basic_access" ON user_profiles
FOR ALL USING (
    -- Users can always see their own profile (no helper function, no recursion)
    id = auth.uid()
    -- Service role can access everything (for admin operations)
    OR auth.role() = 'service_role'
);