-- Fix employee access to unassigned customers and requests
-- Employees should see:
-- 1. All unassigned customers/requests (available for assignment)
-- 2. Customers/requests assigned to them
-- Admins see everything

-- ============================================================================
-- CUSTOMERS - ALLOW ACCESS TO UNASSIGNED + ASSIGNED
-- ============================================================================

DROP POLICY IF EXISTS "employee_assigned_customers_select" ON customers;

CREATE POLICY "employee_customers_select" ON customers
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.user_type IN ('employee', 'admin')
        AND up.is_active = true
    )
    AND (
        -- Admin can see all customers
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'admin'
        )
        -- Employees can see unassigned customers
        OR assigned_employee_id IS NULL
        -- Employees can see their assigned customers
        OR assigned_employee_id = auth.uid()
    )
);

-- ============================================================================
-- CONTACT REQUESTS - ALLOW ACCESS TO UNASSIGNED + ASSIGNED
-- ============================================================================

DROP POLICY IF EXISTS "employee_assigned_requests_select" ON contact_requests;

CREATE POLICY "employee_requests_select" ON contact_requests
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.user_type IN ('employee', 'admin')
        AND up.is_active = true
    )
    AND (
        -- Admin can see all requests
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'admin'
        )
        -- Employees can see unassigned requests (no active assignments)
        OR NOT EXISTS (
            SELECT 1 FROM request_assignments ra
            WHERE ra.contact_request_id = contact_requests.id
            AND ra.is_active = true
        )
        -- Employees can see requests assigned to them
        OR EXISTS (
            SELECT 1 FROM request_assignments ra
            WHERE ra.contact_request_id = contact_requests.id
            AND ra.assigned_to = auth.uid()
            AND ra.is_active = true
        )
        -- Employees can see requests from their assigned customers
        OR EXISTS (
            SELECT 1 FROM customers c
            WHERE c.email = contact_requests.email
            AND c.assigned_employee_id = auth.uid()
        )
    )
);

-- ============================================================================
-- UPDATE HELPER FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS employee_has_access_to_customer(UUID);

CREATE OR REPLACE FUNCTION employee_has_access_to_customer(customer_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    customer_assigned_to UUID;
BEGIN
    -- Get assigned employee for the customer
    SELECT assigned_employee_id INTO customer_assigned_to
    FROM customers
    WHERE id = customer_uuid;

    -- Admin has access to everything
    IF EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND user_type = 'admin'
        AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;

    -- Employee has access to unassigned customers or their assigned customers
    IF EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND user_type = 'employee'
        AND is_active = true
    ) AND (
        customer_assigned_to IS NULL
        OR customer_assigned_to = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION employee_has_access_to_customer(UUID) TO authenticated;

-- ============================================================================
-- UPDATE CHAT MESSAGES POLICY
-- ============================================================================

DROP POLICY IF EXISTS "employee_assigned_customer_chats_select" ON customer_chat_messages;

CREATE POLICY "employee_customer_chats_select" ON customer_chat_messages
FOR SELECT USING (
    -- Admin can see all chats
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.user_type = 'admin'
        AND up.is_active = true
    )
    -- Customers can see their own chats
    OR (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'customer'
            AND up.is_active = true
        )
        AND customer_id IN (
            SELECT id FROM customers WHERE user_id = auth.uid()
        )
    )
    -- Employees can see chats for unassigned or their assigned customers
    OR (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'employee'
            AND up.is_active = true
        )
        AND customer_id IN (
            SELECT id FROM customers
            WHERE assigned_employee_id IS NULL
            OR assigned_employee_id = auth.uid()
        )
    )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "employee_customers_select" ON customers IS
'Employees can see unassigned customers (available to claim) and customers assigned to them. Admins see all.';

COMMENT ON POLICY "employee_requests_select" ON contact_requests IS
'Employees can see unassigned requests (available to claim) and requests assigned to them. Admins see all.';

COMMENT ON FUNCTION employee_has_access_to_customer(UUID) IS
'Check if employee has access to customer (unassigned or assigned to them). Admins always have access.';