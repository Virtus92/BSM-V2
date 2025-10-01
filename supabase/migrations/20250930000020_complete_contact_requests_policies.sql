-- Complete contact_requests RLS policies
-- Add missing policies for customers, anonymous users, and employee operations

-- ============================================================================
-- CUSTOMER POLICIES - View their own requests
-- ============================================================================

CREATE POLICY "customers_view_own_requests" ON contact_requests
FOR SELECT
USING (
    is_customer()
    AND email = (
        SELECT email
        FROM customers
        WHERE user_id = auth.uid()
        LIMIT 1
    )
);

-- ============================================================================
-- ANONYMOUS INSERT - For landing page contact forms
-- ============================================================================

CREATE POLICY "anonymous_create_requests" ON contact_requests
FOR INSERT
WITH CHECK (
    auth.role() = 'anon'
);

-- ============================================================================
-- EMPLOYEE INSERT/UPDATE POLICIES
-- ============================================================================

CREATE POLICY "employee_create_requests" ON contact_requests
FOR INSERT
WITH CHECK (
    is_staff()
);

CREATE POLICY "employee_update_requests" ON contact_requests
FOR UPDATE
USING (
    is_admin()
    OR (
        is_employee()
        AND (
            -- Can update unassigned requests
            NOT EXISTS (
                SELECT 1 FROM request_assignments ra
                WHERE ra.contact_request_id = contact_requests.id
                AND ra.is_active = true
            )
            -- Can update requests assigned to them
            OR EXISTS (
                SELECT 1 FROM request_assignments ra
                WHERE ra.contact_request_id = contact_requests.id
                AND ra.assigned_to = auth.uid()
                AND ra.is_active = true
            )
        )
    )
);

-- ============================================================================
-- ADMIN DELETE POLICY
-- ============================================================================

CREATE POLICY "admin_delete_requests" ON contact_requests
FOR DELETE
USING (is_admin());

-- ============================================================================
-- VERIFY ALL POLICIES
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
    r RECORD;
BEGIN
    SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'contact_requests';

    RAISE NOTICE '==============================================';
    RAISE NOTICE 'contact_requests Complete Policy Set:';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Total policies: %', policy_count;
    RAISE NOTICE '';

    FOR r IN (
        SELECT policyname, cmd
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'contact_requests'
        ORDER BY cmd, policyname
    )
    LOOP
        RAISE NOTICE '  % - %', r.cmd, r.policyname;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '==============================================';

    IF policy_count >= 6 THEN
        RAISE NOTICE 'SUCCESS: Complete policy set applied!';
        RAISE NOTICE '';
        RAISE NOTICE 'Access Model:';
        RAISE NOTICE '  Anonymous: Can INSERT (landing page forms)';
        RAISE NOTICE '  Customers: Can SELECT their own requests';
        RAISE NOTICE '  Employees: Can SELECT unassigned+assigned, INSERT, UPDATE assigned';
        RAISE NOTICE '  Admins: Full access (SELECT, INSERT, UPDATE, DELETE)';
    ELSE
        RAISE WARNING 'Expected at least 6 policies, found %', policy_count;
    END IF;

    RAISE NOTICE '==============================================';
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "customers_view_own_requests" ON contact_requests IS
'Customers can view contact requests associated with their email address.';

COMMENT ON POLICY "anonymous_create_requests" ON contact_requests IS
'Anonymous users can create contact requests via landing page forms.';

COMMENT ON POLICY "employee_create_requests" ON contact_requests IS
'Employees and admins can create contact requests on behalf of customers.';

COMMENT ON POLICY "employee_update_requests" ON contact_requests IS
'Employees can update unassigned requests or requests assigned to them. Admins can update all.';

COMMENT ON POLICY "admin_delete_requests" ON contact_requests IS
'Only admins can delete contact requests.';
