-- Drop all existing policies that reference user_type column
-- This allows us to modify the column and recreate policies properly

-- ============================================================================
-- DROP ALL EXISTING POLICIES ON TABLES WITH user_type DEPENDENCIES
-- ============================================================================

-- User profiles policies
DROP POLICY IF EXISTS "users_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "service_role_access" ON user_profiles;
DROP POLICY IF EXISTS "user_own_profile_select" ON user_profiles;
DROP POLICY IF EXISTS "user_own_profile_update" ON user_profiles;
DROP POLICY IF EXISTS "admin_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "staff_read_profiles" ON user_profiles;
DROP POLICY IF EXISTS "service_role_profiles" ON user_profiles;

-- Customer policies
DROP POLICY IF EXISTS "admin_access_customers" ON customers;
DROP POLICY IF EXISTS "customer_access_own_data" ON customers;
DROP POLICY IF EXISTS "customer_update_own_data" ON customers;
DROP POLICY IF EXISTS "admin_customers_all" ON customers;
DROP POLICY IF EXISTS "employee_customers_cru" ON customers;
DROP POLICY IF EXISTS "employee_customers_select" ON customers;
DROP POLICY IF EXISTS "employee_customers_insert" ON customers;
DROP POLICY IF EXISTS "employee_customers_update" ON customers;
DROP POLICY IF EXISTS "customer_own_data_select" ON customers;
DROP POLICY IF EXISTS "customer_own_data_update" ON customers;

-- Contact request policies
DROP POLICY IF EXISTS "admin_access_contact_requests" ON contact_requests;
DROP POLICY IF EXISTS "contact_requests_insert_own" ON contact_requests;
DROP POLICY IF EXISTS "contact_requests_select_own" ON contact_requests;
DROP POLICY IF EXISTS "contact_requests_update_own" ON contact_requests;
DROP POLICY IF EXISTS "admin_contact_requests_all" ON contact_requests;
DROP POLICY IF EXISTS "employee_contact_requests_cru" ON contact_requests;
DROP POLICY IF EXISTS "employee_contact_requests_select" ON contact_requests;
DROP POLICY IF EXISTS "employee_contact_requests_insert" ON contact_requests;
DROP POLICY IF EXISTS "employee_contact_requests_update" ON contact_requests;
DROP POLICY IF EXISTS "anonymous_contact_requests_insert" ON contact_requests;
DROP POLICY IF EXISTS "customer_own_requests" ON contact_requests;

-- Contact request notes policies
DROP POLICY IF EXISTS "admin_access_contact_request_notes" ON contact_request_notes;
DROP POLICY IF EXISTS "admin_contact_notes_all" ON contact_request_notes;
DROP POLICY IF EXISTS "employee_contact_notes_cru" ON contact_request_notes;
DROP POLICY IF EXISTS "employee_contact_notes_select" ON contact_request_notes;
DROP POLICY IF EXISTS "employee_contact_notes_insert" ON contact_request_notes;
DROP POLICY IF EXISTS "employee_contact_notes_update" ON contact_request_notes;

-- Customer notes policies
DROP POLICY IF EXISTS "users_can_view_customer_notes" ON customer_notes;
DROP POLICY IF EXISTS "users_can_create_customer_notes" ON customer_notes;
DROP POLICY IF EXISTS "users_can_update_own_customer_notes" ON customer_notes;
DROP POLICY IF EXISTS "users_can_delete_own_customer_notes" ON customer_notes;
DROP POLICY IF EXISTS "admin_customer_notes_all" ON customer_notes;
DROP POLICY IF EXISTS "staff_customer_notes_manage" ON customer_notes;
DROP POLICY IF EXISTS "customer_notes_read_own" ON customer_notes;

-- Workflow policies
DROP POLICY IF EXISTS "admin_can_manage_all_workflows" ON workflow_registry;
DROP POLICY IF EXISTS "customers_can_view_own_workflows" ON workflow_registry;
DROP POLICY IF EXISTS "admin_can_manage_all_executions" ON workflow_executions;
DROP POLICY IF EXISTS "customers_can_view_own_executions" ON workflow_executions;
DROP POLICY IF EXISTS "admin_can_manage_automation_settings" ON customer_automation_settings;
DROP POLICY IF EXISTS "customers_can_manage_own_automation_settings" ON customer_automation_settings;
DROP POLICY IF EXISTS "anyone_can_view_workflow_templates" ON workflow_templates;
DROP POLICY IF EXISTS "admin_can_manage_workflow_templates" ON workflow_templates;