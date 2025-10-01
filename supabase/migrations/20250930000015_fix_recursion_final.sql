-- FINAL FIX: Remove infinite recursion by avoiding self-referencing policies
-- The problem: Policies that query user_profiles while evaluating user_profiles access

-- ============================================================================
-- DROP ALL POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "users_read_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "employees_read_assigned_customers" ON user_profiles;
DROP POLICY IF EXISTS "customers_read_assigned_employee" ON user_profiles;
DROP POLICY IF EXISTS "service_role_full_access" ON user_profiles;

-- ============================================================================
-- CREATE NON-RECURSIVE POLICIES
-- ============================================================================

-- 1. Everyone reads their own profile
-- NO RECURSION: Direct auth.uid() check
CREATE POLICY "users_read_own_profile"
ON user_profiles
FOR SELECT
USING (id = auth.uid());

-- 2. Everyone updates their own profile
-- NO RECURSION: Direct auth.uid() check
CREATE POLICY "users_update_own_profile"
ON user_profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. Admins can read all profiles
-- NO RECURSION: Check user_type on SAME ROW being accessed
CREATE POLICY "admins_read_all_profiles"
ON user_profiles
FOR SELECT
USING (
    -- If the CURRENT USER (doing the query) is admin, allow
    -- We check this by looking at the row where id = auth.uid()
    (SELECT user_type FROM user_profiles WHERE id = auth.uid()) = 'admin'
    AND (SELECT is_active FROM user_profiles WHERE id = auth.uid()) = true
);

-- WAIT - THIS STILL HAS RECURSION!
-- SOLUTION: Use a SECURITY DEFINER function instead

DROP POLICY IF EXISTS "admins_read_all_profiles" ON user_profiles;

-- ============================================================================
-- CREATE HELPER FUNCTION (SECURITY DEFINER = runs as owner, bypasses RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE id = auth.uid()
        AND user_type = 'admin'
        AND is_active = true
    );
END;
$$;

CREATE OR REPLACE FUNCTION is_employee()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE id = auth.uid()
        AND user_type = 'employee'
        AND is_active = true
    );
END;
$$;

CREATE OR REPLACE FUNCTION is_customer()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE id = auth.uid()
        AND user_type = 'customer'
        AND is_active = true
    );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_employee() TO authenticated;
GRANT EXECUTE ON FUNCTION is_customer() TO authenticated;

-- ============================================================================
-- NOW CREATE POLICIES USING HELPER FUNCTIONS (NO RECURSION)
-- ============================================================================

-- 3. Admins read all (using SECURITY DEFINER function)
CREATE POLICY "admins_read_all_profiles"
ON user_profiles
FOR SELECT
USING (is_admin());

-- 4. Admins update all (using SECURITY DEFINER function)
CREATE POLICY "admins_update_all_profiles"
ON user_profiles
FOR UPDATE
USING (is_admin());

-- 5. Employees read assigned customer profiles
CREATE POLICY "employees_read_assigned_customers"
ON user_profiles
FOR SELECT
USING (
    is_employee()
    AND user_profiles.user_type = 'customer'
    AND EXISTS (
        SELECT 1
        FROM customers c
        WHERE c.user_id = user_profiles.id
        AND c.assigned_employee_id = auth.uid()
    )
);

-- 6. Customers read assigned employee profile
CREATE POLICY "customers_read_assigned_employee"
ON user_profiles
FOR SELECT
USING (
    is_customer()
    AND user_profiles.user_type = 'employee'
    AND EXISTS (
        SELECT 1
        FROM customers c
        WHERE c.assigned_employee_id = user_profiles.id
        AND c.user_id = auth.uid()
    )
);

-- 7. Service role full access
CREATE POLICY "service_role_full_access"
ON user_profiles
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- VERIFY
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_profiles';

    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('is_admin', 'is_employee', 'is_customer');

    RAISE NOTICE '==============================================';
    RAISE NOTICE 'user_profiles policies: %', policy_count;
    RAISE NOTICE 'Helper functions: %', function_count;
    RAISE NOTICE '==============================================';

    IF policy_count = 7 AND function_count = 3 THEN
        RAISE NOTICE 'SUCCESS: Login system fully configured!';
    ELSE
        RAISE WARNING 'PROBLEM: Expected 7 policies and 3 functions, got % policies and % functions', policy_count, function_count;
    END IF;
END $$;

COMMENT ON FUNCTION is_admin() IS 'Check if current user is an active admin. SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION is_employee() IS 'Check if current user is an active employee. SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION is_customer() IS 'Check if current user is an active customer. SECURITY DEFINER to bypass RLS.';
