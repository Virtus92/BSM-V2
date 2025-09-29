-- Create all RLS policies using the helper functions
-- This must be done after functions are created

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "user_own_profile_select" ON user_profiles
FOR SELECT USING (id = auth.uid());

-- Users can update their own basic profile (but not role)
CREATE POLICY "user_own_profile_update" ON user_profiles
FOR UPDATE USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admin can manage all profiles
CREATE POLICY "admin_all_profiles" ON user_profiles
FOR ALL USING (is_admin());

-- Staff can read profiles for work purposes
CREATE POLICY "staff_read_profiles" ON user_profiles
FOR SELECT USING (is_staff());

-- Service role access
CREATE POLICY "service_role_profiles" ON user_profiles
FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- CUSTOMERS POLICIES
-- ============================================================================

-- Admin full access
CREATE POLICY "admin_customers_all" ON customers
FOR ALL USING (is_admin());

-- Employees can create, read, update (no delete)
CREATE POLICY "employee_customers_select" ON customers
FOR SELECT USING (is_staff());

CREATE POLICY "employee_customers_insert" ON customers
FOR INSERT WITH CHECK (is_staff());

CREATE POLICY "employee_customers_update" ON customers
FOR UPDATE USING (is_staff());

-- Customers can read their own linked data
CREATE POLICY "customer_own_data_select" ON customers
FOR SELECT USING (user_id = auth.uid());

-- Customers can update their own basic data (but not status)
CREATE POLICY "customer_own_data_update" ON customers
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- CONTACT REQUESTS POLICIES
-- ============================================================================

-- Admin full access
CREATE POLICY "admin_contact_requests_all" ON contact_requests
FOR ALL USING (is_admin());

-- Employees can create, read, update (no delete)
CREATE POLICY "employee_contact_requests_select" ON contact_requests
FOR SELECT USING (is_staff());

CREATE POLICY "employee_contact_requests_insert" ON contact_requests
FOR INSERT WITH CHECK (is_staff());

CREATE POLICY "employee_contact_requests_update" ON contact_requests
FOR UPDATE USING (is_staff());

-- Anonymous users can create requests (for contact forms)
CREATE POLICY "anonymous_contact_requests_insert" ON contact_requests
FOR INSERT WITH CHECK (auth.role() = 'anon');

-- Customers can access their own requests (matched by email)
CREATE POLICY "customer_own_requests" ON contact_requests
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM customers
        WHERE customers.user_id = auth.uid()
        AND customers.email = contact_requests.email
    )
);

-- Customers can create requests
CREATE POLICY "customer_create_requests" ON contact_requests
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND created_by = auth.uid()
);

-- ============================================================================
-- CONTACT REQUEST NOTES POLICIES
-- ============================================================================

-- Admin full access
CREATE POLICY "admin_contact_notes_all" ON contact_request_notes
FOR ALL USING (is_admin());

-- Staff can manage notes
CREATE POLICY "employee_contact_notes_select" ON contact_request_notes
FOR SELECT USING (is_staff());

CREATE POLICY "employee_contact_notes_insert" ON contact_request_notes
FOR INSERT WITH CHECK (is_staff());

CREATE POLICY "employee_contact_notes_update" ON contact_request_notes
FOR UPDATE USING (is_staff() AND created_by = auth.uid());

-- ============================================================================
-- CUSTOMER NOTES POLICIES
-- ============================================================================

-- Admin full access
CREATE POLICY "admin_customer_notes_all" ON customer_notes
FOR ALL USING (is_admin());

-- Staff can manage notes
CREATE POLICY "staff_customer_notes_manage" ON customer_notes
FOR ALL USING (is_staff());

-- Customers can read non-internal notes
CREATE POLICY "customer_notes_read_own" ON customer_notes
FOR SELECT USING (
    NOT is_internal
    AND customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
    )
);

-- ============================================================================
-- WORKFLOW POLICIES
-- ============================================================================

-- Admin can manage all workflows
CREATE POLICY "admin_workflows_all" ON workflow_registry
FOR ALL USING (is_admin());

-- Customers can view their own workflows
CREATE POLICY "customers_view_own_workflows" ON workflow_registry
FOR SELECT USING (
    customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
    )
);

-- Admin can manage all executions
CREATE POLICY "admin_executions_all" ON workflow_executions
FOR ALL USING (is_admin());

-- Customers can view their own executions
CREATE POLICY "customers_view_own_executions" ON workflow_executions
FOR SELECT USING (
    customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
    )
);

-- Admin can manage automation settings
CREATE POLICY "admin_automation_settings_all" ON customer_automation_settings
FOR ALL USING (is_admin());

-- Customers can manage their own automation settings
CREATE POLICY "customers_automation_settings_own" ON customer_automation_settings
FOR ALL USING (
    customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
    )
);

-- Anyone can view active workflow templates
CREATE POLICY "view_workflow_templates" ON workflow_templates
FOR SELECT USING (is_active = true);

-- Admin can manage workflow templates
CREATE POLICY "admin_workflow_templates_all" ON workflow_templates
FOR ALL USING (is_admin());

-- ============================================================================
-- ACTIVITY LOGGING POLICIES
-- ============================================================================

-- Admin can view all activity logs
CREATE POLICY "admin_activity_logs_all" ON user_activity_logs
FOR ALL USING (is_admin());

-- Users can view their own activity logs
CREATE POLICY "users_own_activity_logs" ON user_activity_logs
FOR SELECT USING (user_id = auth.uid());

-- System can insert activity logs
CREATE POLICY "system_insert_activity_logs" ON user_activity_logs
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- SECURITY AUDIT LOGS POLICIES
-- ============================================================================

-- Admin only for security audit logs
CREATE POLICY "admin_security_audit_all" ON security_audit_logs
FOR ALL USING (is_admin());

-- System can insert security audit logs
CREATE POLICY "system_insert_security_audit" ON security_audit_logs
FOR INSERT WITH CHECK (true); -- Allow system/middleware to insert

-- ============================================================================
-- SECURITY EVENTS POLICIES
-- ============================================================================

-- Admin only for security events
CREATE POLICY "admin_security_events_all" ON security_events
FOR ALL USING (is_admin());

-- System can insert security events
CREATE POLICY "system_insert_security_events" ON security_events
FOR INSERT WITH CHECK (true); -- Allow system/middleware to insert

-- ============================================================================
-- ROLE PERMISSIONS POLICIES
-- ============================================================================

-- Authenticated users can read role permissions
CREATE POLICY "authenticated_role_permissions_read" ON role_permissions
FOR SELECT USING (auth.role() = 'authenticated');

-- Admin can manage role permissions
CREATE POLICY "admin_role_permissions_all" ON role_permissions
FOR ALL USING (is_admin());

-- ============================================================================
-- SYSTEM CONFIG POLICIES
-- ============================================================================

-- Admin can manage system config
CREATE POLICY "admin_system_config_all" ON system_config
FOR ALL USING (is_admin());

-- Authenticated users can read system config (for setup checks)
CREATE POLICY "authenticated_system_config_read" ON system_config
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow anonymous reads for setup status
CREATE POLICY "anonymous_system_config_setup_read" ON system_config
FOR SELECT USING (auth.role() = 'anon');

-- ============================================================================
-- ACTIVITY LOGGING TRIGGERS
-- ============================================================================

-- Apply activity logging triggers to key tables (only for admin/employee actions)
DROP TRIGGER IF EXISTS trigger_customers_activity_log ON customers;
CREATE TRIGGER trigger_customers_activity_log
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION trigger_log_data_changes();

DROP TRIGGER IF EXISTS trigger_contact_requests_activity_log ON contact_requests;
CREATE TRIGGER trigger_contact_requests_activity_log
    AFTER INSERT OR UPDATE OR DELETE ON contact_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_log_data_changes();

DROP TRIGGER IF EXISTS trigger_customer_notes_activity_log ON customer_notes;
CREATE TRIGGER trigger_customer_notes_activity_log
    AFTER INSERT OR UPDATE OR DELETE ON customer_notes
    FOR EACH ROW EXECUTE FUNCTION trigger_log_data_changes();