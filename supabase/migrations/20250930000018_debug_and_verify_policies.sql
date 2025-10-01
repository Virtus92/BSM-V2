-- Debug: Verify current policy state and test access
-- This migration doesn't change anything, just reports current state

DO $$
DECLARE
    r RECORD;
    policy_text TEXT;
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'CUSTOMERS TABLE POLICIES:';
    RAISE NOTICE '==============================================';

    FOR r IN (
        SELECT policyname, cmd, qual::text as condition
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'customers'
        ORDER BY policyname
    )
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE 'Policy: %', r.policyname;
        RAISE NOTICE 'Command: %', r.cmd;
        RAISE NOTICE 'Condition: %', substring(r.condition, 1, 200);
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'CONTACT_REQUESTS TABLE POLICIES:';
    RAISE NOTICE '==============================================';

    FOR r IN (
        SELECT policyname, cmd, qual::text as condition
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'contact_requests'
        ORDER BY policyname
    )
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE 'Policy: %', r.policyname;
        RAISE NOTICE 'Command: %', r.cmd;
        RAISE NOTICE 'Condition: %', substring(r.condition, 1, 200);
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'USER_PROFILES TABLE POLICIES:';
    RAISE NOTICE '==============================================';

    FOR r IN (
        SELECT policyname, cmd, qual::text as condition
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_profiles'
        ORDER BY policyname
    )
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE 'Policy: %', r.policyname;
        RAISE NOTICE 'Command: %', r.cmd;
        RAISE NOTICE 'Condition: %', substring(r.condition, 1, 200);
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'HELPER FUNCTIONS:';
    RAISE NOTICE '==============================================';

    FOR r IN (
        SELECT
            p.proname as function_name,
            CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN ('is_admin', 'is_employee', 'is_customer', 'is_staff')
        ORDER BY p.proname
    )
    LOOP
        RAISE NOTICE '%: %', r.function_name, r.security_type;
    END LOOP;

    RAISE NOTICE '==============================================';
END $$;
