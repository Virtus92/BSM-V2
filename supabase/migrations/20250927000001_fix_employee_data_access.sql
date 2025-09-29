-- Fix employee data access policies
-- This migration updates RLS policies to properly restrict employee access to only their assigned data

-- ============================================================================
-- DROP EXISTING OVERLY PERMISSIVE POLICIES
-- ============================================================================

-- Drop existing overly permissive employee policies
DROP POLICY IF EXISTS "employee_customers_select" ON customers;
DROP POLICY IF EXISTS "employee_contact_requests_select" ON contact_requests;
DROP POLICY IF EXISTS "staff_read_profiles" ON user_profiles;

-- ============================================================================
-- CUSTOMERS - RESTRICT TO ASSIGNED EMPLOYEES ONLY
-- ============================================================================

-- Employees can only see customers assigned to them
CREATE POLICY "employee_assigned_customers_select" ON customers
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
        -- Employees can only see their assigned customers
        OR assigned_employee_id = auth.uid()
    )
);

-- ============================================================================
-- CONTACT REQUESTS - RESTRICT TO ASSIGNED EMPLOYEES ONLY
-- ============================================================================

-- Employees can only see contact requests assigned to them
CREATE POLICY "employee_assigned_requests_select" ON contact_requests
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
        -- Employees can only see requests assigned to them
        OR EXISTS (
            SELECT 1 FROM request_assignments ra
            WHERE ra.contact_request_id = contact_requests.id
            AND ra.assigned_to = auth.uid()
            AND ra.is_active = true
        )
        -- Or requests from their assigned customers
        OR EXISTS (
            SELECT 1 FROM customers c
            WHERE c.email = contact_requests.email
            AND c.assigned_employee_id = auth.uid()
        )
    )
);

-- ============================================================================
-- USER PROFILES - RESTRICT TO RELEVANT USERS ONLY
-- ============================================================================

-- Employees can only see profiles of users they work with
CREATE POLICY "employee_relevant_profiles_select" ON user_profiles
FOR SELECT USING (
    -- Users can see their own profile
    id = auth.uid()
    -- Admin can see all profiles
    OR EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.user_type = 'admin'
        AND up.is_active = true
    )
    -- Employees can see profiles of their assigned customers
    OR (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'employee'
            AND up.is_active = true
        )
        AND id IN (
            SELECT c.user_id FROM customers c
            WHERE c.assigned_employee_id = auth.uid()
        )
    )
);

-- ============================================================================
-- UPDATE CHAT MESSAGES POLICY TO BE MORE RESTRICTIVE
-- ============================================================================

-- Drop existing policy and create more restrictive one
DROP POLICY IF EXISTS "Employees can view chat messages for their assigned customers" ON customer_chat_messages;

CREATE POLICY "employee_assigned_customer_chats_select" ON customer_chat_messages
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
    -- Employees can only see chats for customers assigned to them
    OR (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'employee'
            AND up.is_active = true
        )
        AND customer_id IN (
            SELECT id FROM customers
            WHERE assigned_employee_id = auth.uid()
        )
    )
);

-- ============================================================================
-- WORKSPACE ACCESS RESTRICTION FOR EMPLOYEES
-- ============================================================================

-- Add function to check if employee has access to specific data
CREATE OR REPLACE FUNCTION employee_has_access_to_customer(customer_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Admin has access to everything
    IF EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND user_type = 'admin'
        AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;

    -- Employee has access only to assigned customers
    IF EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND user_type = 'employee'
        AND is_active = true
    ) AND EXISTS (
        SELECT 1 FROM customers
        WHERE id = customer_uuid
        AND assigned_employee_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION employee_has_access_to_customer(UUID) TO authenticated;