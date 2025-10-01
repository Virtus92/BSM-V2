-- Fix customers table recursion by removing problematic policy
-- Problem: customers.employee_customers_select queries user_profiles,
-- which queries customers back = INFINITE RECURSION

-- ============================================================================
-- DROP PROBLEMATIC RECURSIVE POLICY
-- ============================================================================

-- This policy causes recursion by querying user_profiles during customers access
DROP POLICY IF EXISTS "employee_customers_select" ON customers;

-- ============================================================================
-- VERIFY HELPER FUNCTIONS EXIST AND ARE SECURITY DEFINER
-- ============================================================================

-- Ensure is_staff() exists (used by employee_assigned_customers_select)
CREATE OR REPLACE FUNCTION is_staff()
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
        AND user_type IN ('employee', 'admin')
        AND is_active = true
    );
END;
$$;

GRANT EXECUTE ON FUNCTION is_staff() TO authenticated;

-- ============================================================================
-- VERIFY NON-RECURSIVE POLICY EXISTS
-- ============================================================================

-- The existing employee_assigned_customers_select policy should handle this
-- It uses is_admin() and is_staff() which are SECURITY DEFINER (no recursion)

DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'customers'
        AND policyname = 'employee_assigned_customers_select'
    ) INTO policy_exists;

    IF policy_exists THEN
        RAISE NOTICE '✓ Non-recursive policy "employee_assigned_customers_select" is active';
    ELSE
        RAISE WARNING '✗ Policy "employee_assigned_customers_select" NOT FOUND!';
    END IF;
END $$;

-- ============================================================================
-- VERIFY ALL HELPER FUNCTIONS
-- ============================================================================

DO $$
DECLARE
    admin_fn BOOLEAN;
    employee_fn BOOLEAN;
    customer_fn BOOLEAN;
    staff_fn BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') INTO admin_fn;
    SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_employee') INTO employee_fn;
    SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_customer') INTO customer_fn;
    SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_staff') INTO staff_fn;

    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Helper Functions Status:';
    RAISE NOTICE 'is_admin(): %', CASE WHEN admin_fn THEN '✓' ELSE '✗' END;
    RAISE NOTICE 'is_employee(): %', CASE WHEN employee_fn THEN '✓' ELSE '✗' END;
    RAISE NOTICE 'is_customer(): %', CASE WHEN customer_fn THEN '✓' ELSE '✗' END;
    RAISE NOTICE 'is_staff(): %', CASE WHEN staff_fn THEN '✓' ELSE '✗' END;
    RAISE NOTICE '==============================================';

    IF admin_fn AND employee_fn AND customer_fn AND staff_fn THEN
        RAISE NOTICE 'SUCCESS: All helper functions configured!';
        RAISE NOTICE 'Recursion should now be eliminated.';
    ELSE
        RAISE WARNING 'PROBLEM: Missing helper functions';
    END IF;
END $$;

-- ============================================================================
-- LIST REMAINING CUSTOMERS POLICIES
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    policy_count INTEGER := 0;
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Active customers policies:';
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'customers'
        ORDER BY policyname
    )
    LOOP
        RAISE NOTICE '  - %', r.policyname;
        policy_count := policy_count + 1;
    END LOOP;
    RAISE NOTICE 'Total: % policies', policy_count;
    RAISE NOTICE '==============================================';
END $$;

COMMENT ON FUNCTION is_staff() IS 'Check if current user is active employee or admin. SECURITY DEFINER to bypass RLS.';
