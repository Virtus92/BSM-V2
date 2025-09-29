-- Simple, safe policy only
DROP POLICY IF EXISTS "user_profiles_access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_basic_access" ON user_profiles;

-- Create simple, safe policy
CREATE POLICY "user_profiles_safe_access" ON user_profiles
FOR ALL USING (
    -- Users can see their own profile
    id = auth.uid()

    -- Service role has full access (admin client uses this)
    OR auth.role() = 'service_role'
);