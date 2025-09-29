-- Back to simple, safe policy + use admin client for admin operations
-- This avoids any recursion risk while giving admins full access through admin client

-- Drop the JWT-based policy (won't work with our schema)
DROP POLICY IF EXISTS "user_profiles_access" ON user_profiles;

-- Restore simple, safe policy
CREATE POLICY "user_profiles_safe_access" ON user_profiles
FOR ALL USING (
    -- Users can see their own profile
    id = auth.uid()

    -- Service role has full access (admin client uses this)
    OR auth.role() = 'service_role'
);