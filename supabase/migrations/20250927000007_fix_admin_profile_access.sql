-- Fix admin access to other user profiles
-- Allow admins to read all profiles without infinite recursion

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "user_profiles_basic_access" ON user_profiles;

-- Create an admin-aware policy that doesn't cause recursion
CREATE POLICY "user_profiles_admin_access" ON user_profiles
FOR ALL USING (
    -- Users can always see their own profile
    id = auth.uid()

    -- Service role can access everything (for admin operations)
    OR auth.role() = 'service_role'

    -- Admins can see all profiles (direct query without recursion)
    OR EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.user_type = 'admin'
        AND up.is_active = true
    )
);