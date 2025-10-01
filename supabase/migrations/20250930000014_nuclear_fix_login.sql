-- NUCLEAR FIX: Drop all user_profiles policies and create correct ones
-- This migration runs AFTER all the broken migrations

-- ============================================================================
-- DROP ALL POLICIES EXPLICITLY (no DO blocks that can be overridden)
-- ============================================================================

DROP POLICY IF EXISTS "users_read_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "employees_read_assigned_customer_profiles" ON user_profiles;
DROP POLICY IF EXISTS "customers_read_assigned_employee_profile" ON user_profiles;
DROP POLICY IF EXISTS "service_role_all_access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_basic_access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_safe_access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_access" ON user_profiles;
DROP POLICY IF EXISTS "users_can_see_relevant_profiles_fixed" ON user_profiles;
DROP POLICY IF EXISTS "users_can_see_relevant_profiles" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_access" ON user_profiles;
DROP POLICY IF EXISTS "employee_relevant_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "users_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "service_role_access" ON user_profiles;

-- ============================================================================
-- CREATE SIMPLE, WORKING POLICIES
-- ============================================================================

-- 1. Everyone reads own profile (CRITICAL FOR LOGIN)
CREATE POLICY "users_read_own_profile"
ON user_profiles
FOR SELECT
USING (id = auth.uid());

-- 2. Everyone updates own profile
CREATE POLICY "users_update_own_profile"
ON user_profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. Admins read all
CREATE POLICY "admins_read_all_profiles"
ON user_profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.user_type = 'admin'
        AND up.is_active = true
    )
);

-- 4. Admins update all
CREATE POLICY "admins_update_all_profiles"
ON user_profiles
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.user_type = 'admin'
        AND up.is_active = true
    )
);

-- 5. Employees read assigned customer profiles
CREATE POLICY "employees_read_assigned_customers"
ON user_profiles
FOR SELECT
USING (
    user_type = 'customer'
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
    user_type = 'employee'
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
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_profiles';

    RAISE NOTICE 'Final user_profiles policy count: %', policy_count;

    IF policy_count != 7 THEN
        RAISE WARNING 'Expected exactly 7 policies, found %', policy_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All 7 login policies correctly applied';
    END IF;
END $$;
