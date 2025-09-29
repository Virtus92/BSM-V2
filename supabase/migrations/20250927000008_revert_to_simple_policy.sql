-- Revert to simple policy and use admin client in application code instead
-- This avoids any potential for infinite recursion

-- Drop the potentially recursive policy
DROP POLICY IF EXISTS "user_profiles_admin_access" ON user_profiles;

-- Restore the simple, safe policy
CREATE POLICY "user_profiles_basic_access" ON user_profiles
FOR ALL USING (
    -- Users can always see their own profile (no helper function, no recursion)
    id = auth.uid()
    -- Service role can access everything (for admin operations)
    OR auth.role() = 'service_role'
);