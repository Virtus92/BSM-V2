-- Fix login and profile access for all user types
-- This is a comprehensive fix for authentication and profile visibility

-- ============================================================================
-- DROP ALL EXISTING user_profiles POLICIES
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_profiles';
    END LOOP;
END $$;

-- ============================================================================
-- CREATE CLEAN, NON-RECURSIVE POLICIES
-- ============================================================================

-- 1. Everyone can read their own profile (REQUIRED FOR LOGIN)
CREATE POLICY "users_read_own_profile" ON user_profiles
FOR SELECT
USING (id = auth.uid());

-- 2. Everyone can update their own profile
CREATE POLICY "users_update_own_profile" ON user_profiles
FOR UPDATE
USING (id = auth.uid());

-- 3. Admins can see all profiles
CREATE POLICY "admins_read_all_profiles" ON user_profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.user_type = 'admin'
        AND up.is_active = true
    )
);

-- 4. Admins can update all profiles
CREATE POLICY "admins_update_all_profiles" ON user_profiles
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.user_type = 'admin'
        AND up.is_active = true
    )
);

-- 5. Employees can see assigned customer profiles (direct query, no recursion)
CREATE POLICY "employees_read_assigned_customer_profiles" ON user_profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles emp
        WHERE emp.id = auth.uid()
        AND emp.user_type = 'employee'
        AND emp.is_active = true
    )
    AND EXISTS (
        SELECT 1 FROM customers c
        WHERE c.user_id = user_profiles.id
        AND c.assigned_employee_id = auth.uid()
    )
);

-- 6. Customers can see their assigned employee's profile (direct query, no recursion)
CREATE POLICY "customers_read_assigned_employee_profile" ON user_profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles cust
        WHERE cust.id = auth.uid()
        AND cust.user_type = 'customer'
        AND cust.is_active = true
    )
    AND EXISTS (
        SELECT 1 FROM customers c
        WHERE c.user_id = auth.uid()
        AND c.assigned_employee_id = user_profiles.id
    )
);

-- 7. Service role has full access (for system operations)
CREATE POLICY "service_role_all_access" ON user_profiles
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "users_read_own_profile" ON user_profiles IS
'All authenticated users can read their own profile. Required for login and session management.';

COMMENT ON POLICY "users_update_own_profile" ON user_profiles IS
'All authenticated users can update their own profile data.';

COMMENT ON POLICY "admins_read_all_profiles" ON user_profiles IS
'Admins have read access to all user profiles for management purposes.';

COMMENT ON POLICY "admins_update_all_profiles" ON user_profiles IS
'Admins can update any user profile for administrative tasks.';

COMMENT ON POLICY "employees_read_assigned_customer_profiles" ON user_profiles IS
'Employees can read profiles of customers assigned to them. Uses direct query to avoid recursion.';

COMMENT ON POLICY "customers_read_assigned_employee_profile" ON user_profiles IS
'Customers can read the profile of their assigned employee. Uses direct query to avoid recursion.';

COMMENT ON POLICY "service_role_all_access" ON user_profiles IS
'Service role (system) has full access for internal operations and migrations.';

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'user_profiles'
    AND schemaname = 'public';

    RAISE NOTICE 'Total user_profiles policies: %', policy_count;

    IF policy_count != 7 THEN
        RAISE WARNING 'Expected 7 policies, found %', policy_count;
    END IF;
END $$;
