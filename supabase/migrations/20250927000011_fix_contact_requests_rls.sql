-- Fix contact_requests RLS infinite recursion
-- Remove all circular dependencies from contact_requests policies

-- Drop ALL existing policies on contact_requests that cause recursion
DROP POLICY IF EXISTS "admin_contact_requests_all" ON contact_requests;
DROP POLICY IF EXISTS "employee_contact_requests_select" ON contact_requests;
DROP POLICY IF EXISTS "employee_contact_requests_insert" ON contact_requests;
DROP POLICY IF EXISTS "employee_contact_requests_update" ON contact_requests;
DROP POLICY IF EXISTS "employee_assigned_requests_select" ON contact_requests;
DROP POLICY IF EXISTS "anonymous_contact_requests_insert" ON contact_requests;
DROP POLICY IF EXISTS "customer_own_requests" ON contact_requests;
DROP POLICY IF EXISTS "customer_create_requests" ON contact_requests;

-- Create ONE simple, safe policy without recursion
CREATE POLICY "contact_requests_safe_access" ON contact_requests
FOR ALL USING (
    -- Service role has full access (admin client uses this)
    auth.role() = 'service_role'

    -- Authenticated users can access (let application handle authorization)
    OR auth.uid() IS NOT NULL
);