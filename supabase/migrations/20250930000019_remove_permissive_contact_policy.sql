-- Remove overly permissive contact_requests policy
-- The policy "contact_requests_safe_access" allows ALL authenticated users
-- to perform ALL operations on contact_requests - this is wrong!

-- ============================================================================
-- DROP OVERLY PERMISSIVE POLICY
-- ============================================================================

DROP POLICY IF EXISTS "contact_requests_safe_access" ON contact_requests;

-- ============================================================================
-- VERIFY CORRECT POLICIES EXIST
-- ============================================================================

DO $$
DECLARE
    requests_select_exists BOOLEAN;
    safe_access_exists BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check if the correct employee policy exists
    SELECT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'contact_requests'
        AND policyname = 'employee_requests_select'
    ) INTO requests_select_exists;

    -- Check if the problematic policy is gone
    SELECT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'contact_requests'
        AND policyname = 'contact_requests_safe_access'
    ) INTO safe_access_exists;

    -- Count total policies
    SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'contact_requests';

    RAISE NOTICE '==============================================';
    RAISE NOTICE 'contact_requests Policy Status:';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'employee_requests_select: %',
        CASE WHEN requests_select_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
    RAISE NOTICE 'contact_requests_safe_access: %',
        CASE WHEN safe_access_exists THEN '✗ STILL EXISTS (BAD!)' ELSE '✓ REMOVED' END;
    RAISE NOTICE 'Total policies: %', policy_count;
    RAISE NOTICE '==============================================';

    IF requests_select_exists AND NOT safe_access_exists THEN
        RAISE NOTICE 'SUCCESS: Overly permissive policy removed!';
        RAISE NOTICE 'Access model now correct:';
        RAISE NOTICE '  - Admins: See all requests';
        RAISE NOTICE '  - Employees: See unassigned + assigned requests';
        RAISE NOTICE '  - Customers: See only their own requests';
    ELSE
        IF NOT requests_select_exists THEN
            RAISE WARNING 'PROBLEM: employee_requests_select policy is missing!';
        END IF;
        IF safe_access_exists THEN
            RAISE WARNING 'PROBLEM: Permissive policy still exists!';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- LIST ALL REMAINING contact_requests POLICIES
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'All contact_requests policies:';
    FOR r IN (
        SELECT policyname, cmd
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'contact_requests'
        ORDER BY policyname
    )
    LOOP
        RAISE NOTICE '  - % (%)', r.policyname, r.cmd;
    END LOOP;
END $$;

COMMENT ON TABLE contact_requests IS
'Contact requests table with proper RLS. Access controlled via employee_requests_select policy and others.';
