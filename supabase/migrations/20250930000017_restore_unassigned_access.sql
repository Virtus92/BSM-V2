-- Restore employee access to unassigned customers and requests
-- WITHOUT causing recursion by using SECURITY DEFINER functions

-- ============================================================================
-- DROP OLD POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "employee_assigned_customers_select" ON customers;
DROP POLICY IF EXISTS "employee_customers_select" ON customers;
DROP POLICY IF EXISTS "employee_requests_select" ON contact_requests;

-- ============================================================================
-- CUSTOMERS - UNASSIGNED + ASSIGNED ACCESS (NON-RECURSIVE)
-- ============================================================================

CREATE POLICY "employee_customers_select" ON customers
FOR SELECT USING (
    -- Use SECURITY DEFINER functions to avoid recursion
    (
        is_admin()  -- Admins see all
        OR (
            is_employee()
            AND (
                assigned_employee_id IS NULL  -- Unassigned customers
                OR assigned_employee_id = auth.uid()  -- Assigned to me
            )
        )
    )
);

-- ============================================================================
-- CONTACT REQUESTS - UNASSIGNED + ASSIGNED ACCESS (NON-RECURSIVE)
-- ============================================================================

CREATE POLICY "employee_requests_select" ON contact_requests
FOR SELECT USING (
    is_admin()  -- Admins see all
    OR (
        is_employee()
        AND (
            -- Unassigned requests (no active assignments)
            NOT EXISTS (
                SELECT 1 FROM request_assignments ra
                WHERE ra.contact_request_id = contact_requests.id
                AND ra.is_active = true
            )
            -- Requests assigned to me
            OR EXISTS (
                SELECT 1 FROM request_assignments ra
                WHERE ra.contact_request_id = contact_requests.id
                AND ra.assigned_to = auth.uid()
                AND ra.is_active = true
            )
            -- Requests from my assigned customers
            OR EXISTS (
                SELECT 1 FROM customers c
                WHERE c.email = contact_requests.email
                AND c.assigned_employee_id = auth.uid()
            )
        )
    )
);

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

DO $$
DECLARE
    customers_policy BOOLEAN;
    requests_policy BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'customers'
        AND policyname = 'employee_customers_select'
    ) INTO customers_policy;

    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'contact_requests'
        AND policyname = 'employee_requests_select'
    ) INTO requests_policy;

    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Unassigned Access Policies:';
    RAISE NOTICE 'customers.employee_customers_select: %',
        CASE WHEN customers_policy THEN '✓' ELSE '✗' END;
    RAISE NOTICE 'contact_requests.employee_requests_select: %',
        CASE WHEN requests_policy THEN '✓' ELSE '✗' END;
    RAISE NOTICE '==============================================';

    IF customers_policy AND requests_policy THEN
        RAISE NOTICE 'SUCCESS: Employees can now see unassigned items!';
        RAISE NOTICE 'Access model:';
        RAISE NOTICE '  - Admins: See ALL items';
        RAISE NOTICE '  - Employees: See UNASSIGNED + ASSIGNED items';
        RAISE NOTICE '  - Customers: See only their own data';
    ELSE
        RAISE WARNING 'PROBLEM: Policies not created correctly';
    END IF;
END $$;

COMMENT ON POLICY "employee_customers_select" ON customers IS
'Employees can see unassigned customers (for claiming) and customers assigned to them. Admins see all. Uses SECURITY DEFINER functions to prevent recursion.';

COMMENT ON POLICY "employee_requests_select" ON contact_requests IS
'Employees can see unassigned requests (for claiming) and requests assigned to them. Admins see all. Uses SECURITY DEFINER functions to prevent recursion.';
