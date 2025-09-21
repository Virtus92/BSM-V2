-- Role-Based Security System Migration
-- Comprehensive role-based access control with activity logging and secure setup
-- Rising BSM V2: Enterprise Security & Role Management

-- ============================================================================
-- SYSTEM SETUP AND INSTALLATION TRACKING
-- ============================================================================

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Installation tracking
    is_installed BOOLEAN DEFAULT false,
    installation_completed_at TIMESTAMP WITH TIME ZONE,
    setup_version VARCHAR(20) DEFAULT '1.0.0',

    -- System settings
    allow_registration BOOLEAN DEFAULT false,
    default_user_role VARCHAR(20) DEFAULT 'customer' CHECK (default_user_role IN ('customer', 'employee')),
    require_email_verification BOOLEAN DEFAULT true,
    require_admin_approval BOOLEAN DEFAULT true,

    -- Security settings
    enforce_strong_passwords BOOLEAN DEFAULT true,
    session_timeout_hours INTEGER DEFAULT 8,
    max_failed_login_attempts INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 30,

    -- Audit settings
    audit_employee_actions BOOLEAN DEFAULT true,
    audit_data_retention_days INTEGER DEFAULT 90,

    -- System metadata
    first_admin_id UUID REFERENCES auth.users(id),
    setup_completed_by UUID REFERENCES auth.users(id),

    -- Ensure single row
    CONSTRAINT single_config_row CHECK (id = gen_random_uuid())
);

-- Create single system config row
INSERT INTO system_config (is_installed) VALUES (false) ON CONFLICT DO NOTHING;

-- ============================================================================
-- ENHANCED USER ROLES SYSTEM
-- ============================================================================

-- User role enum (extending existing)
DO $$ BEGIN
    DROP TYPE IF EXISTS user_role CASCADE;
    CREATE TYPE user_role AS ENUM ('admin', 'employee', 'customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update user_profiles table structure
ALTER TABLE user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_user_type_check,
    ALTER COLUMN user_type TYPE VARCHAR(20),
    ADD CONSTRAINT user_profiles_user_type_check CHECK (user_type IN ('admin', 'employee', 'customer'));

-- Add role management fields
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
    role_assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
    role_assigned_by UUID REFERENCES auth.users(id);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
    is_active BOOLEAN DEFAULT true;

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
    activation_required BOOLEAN DEFAULT true;

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
    activated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
    activated_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- ACTIVITY LOGGING SYSTEM
-- ============================================================================

-- Activity log types
DO $$ BEGIN
    CREATE TYPE activity_action AS ENUM (
        'CREATE', 'READ', 'UPDATE', 'DELETE',
        'LOGIN', 'LOGOUT', 'REGISTER', 'ACTIVATE',
        'EXPORT', 'IMPORT', 'CONVERT', 'ASSIGN'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User activity logs
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- User information
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_role VARCHAR(20) NOT NULL,
    user_email VARCHAR(255),

    -- Activity details
    action activity_action NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- 'customer', 'contact_request', 'user', etc.
    resource_id UUID,
    resource_identifier VARCHAR(255), -- human-readable identifier

    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_path VARCHAR(500),
    request_method VARCHAR(10),

    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    changes_summary TEXT,

    -- Metadata
    severity activity_severity DEFAULT 'low',
    description TEXT,
    additional_context JSONB DEFAULT '{}'::jsonb,

    -- Performance tracking
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Security audit logs (for security middleware)
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Event classification
    event_type VARCHAR(50) NOT NULL,
    severity activity_severity DEFAULT 'medium',

    -- Request details
    ip_address INET,
    user_agent TEXT,
    method VARCHAR(10),
    path VARCHAR(500),
    query_params JSONB,
    headers JSONB,

    -- User context
    user_id UUID REFERENCES auth.users(id),
    user_role VARCHAR(20),

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events (for threat detection)
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Event details
    event_type VARCHAR(50) NOT NULL,
    severity activity_severity NOT NULL,
    details JSONB NOT NULL,

    -- Status
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,

    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    affected_user_id UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- PERMISSION MATRICES AND ROLE CAPABILITIES
-- ============================================================================

-- Role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee', 'customer')),
    resource VARCHAR(100) NOT NULL, -- table or resource name

    -- CRUD permissions
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,

    -- Special permissions
    can_export BOOLEAN DEFAULT false,
    can_assign BOOLEAN DEFAULT false,
    can_approve BOOLEAN DEFAULT false,

    -- Scope limitations
    scope_restriction VARCHAR(50), -- 'own', 'assigned', 'all'
    additional_conditions JSONB DEFAULT '{}'::jsonb,

    UNIQUE(role, resource)
);

-- Insert default permissions
INSERT INTO role_permissions (role, resource, can_create, can_read, can_update, can_delete, can_export, can_assign, can_approve, scope_restriction) VALUES
-- Admin permissions - full access
('admin', 'customers', true, true, true, true, true, true, true, 'all'),
('admin', 'contact_requests', true, true, true, true, true, true, true, 'all'),
('admin', 'customer_notes', true, true, true, true, true, false, false, 'all'),
('admin', 'contact_request_notes', true, true, true, true, true, false, false, 'all'),
('admin', 'user_profiles', true, true, true, true, true, true, true, 'all'),
('admin', 'workflow_registry', true, true, true, true, true, true, true, 'all'),
('admin', 'user_activity_logs', false, true, false, false, true, false, false, 'all'),
('admin', 'security_audit_logs', false, true, false, false, true, false, false, 'all'),
('admin', 'system_config', false, true, true, false, false, false, false, 'all'),

-- Employee permissions - no delete, activity logged
('employee', 'customers', true, true, true, false, true, false, false, 'all'),
('employee', 'contact_requests', true, true, true, false, true, true, false, 'all'),
('employee', 'customer_notes', true, true, true, false, false, false, false, 'all'),
('employee', 'contact_request_notes', true, true, true, false, false, false, false, 'all'),
('employee', 'user_profiles', false, true, false, false, false, false, false, 'own'),
('employee', 'workflow_registry', false, true, false, false, false, false, false, 'all'),
('employee', 'user_activity_logs', false, true, false, false, false, false, false, 'own'),

-- Customer permissions - only own data
('customer', 'customers', false, true, true, false, false, false, false, 'own'),
('customer', 'contact_requests', true, true, true, false, false, false, false, 'own'),
('customer', 'customer_notes', false, true, false, false, false, false, false, 'own'),
('customer', 'user_profiles', false, true, true, false, false, false, false, 'own'),
('customer', 'workflow_registry', false, true, false, false, false, false, false, 'own'),
('customer', 'user_activity_logs', false, true, false, false, false, false, false, 'own')

ON CONFLICT (role, resource) DO NOTHING;

-- ============================================================================
-- ENHANCED RLS POLICIES
-- ============================================================================

-- Drop existing policies to rebuild them
DROP POLICY IF EXISTS "users_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "service_role_access" ON user_profiles;
DROP POLICY IF EXISTS "admin_access_customers" ON customers;
DROP POLICY IF EXISTS "customer_access_own_data" ON customers;
DROP POLICY IF EXISTS "customer_update_own_data" ON customers;
DROP POLICY IF EXISTS "admin_access_contact_requests" ON contact_requests;
DROP POLICY IF EXISTS "contact_requests_insert_own" ON contact_requests;
DROP POLICY IF EXISTS "contact_requests_select_own" ON contact_requests;
DROP POLICY IF EXISTS "contact_requests_update_own" ON contact_requests;
DROP POLICY IF EXISTS "admin_access_contact_request_notes" ON contact_request_notes;

-- Enable RLS on new tables
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT user_type INTO user_role
    FROM user_profiles
    WHERE id = auth.uid() AND is_active = true;

    RETURN COALESCE(user_role, 'customer');
END;
$$;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN auth.get_user_role() = 'admin';
END;
$$;

-- Helper function to check if user is employee or admin
CREATE OR REPLACE FUNCTION auth.is_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN auth.get_user_role() IN ('admin', 'employee');
END;
$$;

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "user_own_profile_select" ON user_profiles
FOR SELECT USING (id = auth.uid());

-- Users can update their own basic profile
CREATE POLICY "user_own_profile_update" ON user_profiles
FOR UPDATE USING (
    id = auth.uid()
    AND (OLD.user_type = NEW.user_type) -- Cannot change own role
);

-- Admin can manage all profiles
CREATE POLICY "admin_all_profiles" ON user_profiles
FOR ALL USING (auth.is_admin());

-- Staff can read profiles for work purposes
CREATE POLICY "staff_read_profiles" ON user_profiles
FOR SELECT USING (auth.is_staff());

-- Service role access
CREATE POLICY "service_role_profiles" ON user_profiles
FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- CUSTOMERS POLICIES
-- ============================================================================

-- Admin full access
CREATE POLICY "admin_customers_all" ON customers
FOR ALL USING (auth.is_admin());

-- Employees can create, read, update (no delete)
CREATE POLICY "employee_customers_cru" ON customers
FOR SELECT USING (auth.is_staff());

CREATE POLICY "employee_customers_insert" ON customers
FOR INSERT WITH CHECK (auth.is_staff());

CREATE POLICY "employee_customers_update" ON customers
FOR UPDATE USING (auth.is_staff());

-- Customers can read their own linked data
CREATE POLICY "customer_own_data_select" ON customers
FOR SELECT USING (user_id = auth.uid());

-- Customers can update their own basic data
CREATE POLICY "customer_own_data_update" ON customers
FOR UPDATE USING (
    user_id = auth.uid()
    AND OLD.status = NEW.status -- Cannot change status
);

-- ============================================================================
-- CONTACT REQUESTS POLICIES
-- ============================================================================

-- Admin full access
CREATE POLICY "admin_contact_requests_all" ON contact_requests
FOR ALL USING (auth.is_admin());

-- Employees can create, read, update (no delete)
CREATE POLICY "employee_contact_requests_cru" ON contact_requests
FOR SELECT USING (auth.is_staff());

CREATE POLICY "employee_contact_requests_insert" ON contact_requests
FOR INSERT WITH CHECK (auth.is_staff());

CREATE POLICY "employee_contact_requests_update" ON contact_requests
FOR UPDATE USING (auth.is_staff());

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

-- ============================================================================
-- NOTES POLICIES
-- ============================================================================

-- Contact Request Notes
CREATE POLICY "admin_contact_notes_all" ON contact_request_notes
FOR ALL USING (auth.is_admin());

CREATE POLICY "employee_contact_notes_cru" ON contact_request_notes
FOR SELECT USING (auth.is_staff());

CREATE POLICY "employee_contact_notes_insert" ON contact_request_notes
FOR INSERT WITH CHECK (auth.is_staff());

CREATE POLICY "employee_contact_notes_update" ON contact_request_notes
FOR UPDATE USING (auth.is_staff() AND created_by = auth.uid());

-- Customer Notes
CREATE POLICY "admin_customer_notes_all" ON customer_notes
FOR ALL USING (auth.is_admin());

CREATE POLICY "staff_customer_notes_manage" ON customer_notes
FOR ALL USING (auth.is_staff());

-- Customers can read non-internal notes
CREATE POLICY "customer_notes_read_own" ON customer_notes
FOR SELECT USING (
    NOT is_internal
    AND customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
    )
);

-- ============================================================================
-- ACTIVITY LOGGING POLICIES
-- ============================================================================

-- Activity logs
CREATE POLICY "admin_activity_logs_all" ON user_activity_logs
FOR ALL USING (auth.is_admin());

CREATE POLICY "users_own_activity_logs" ON user_activity_logs
FOR SELECT USING (user_id = auth.uid());

-- Security audit logs - admin only
CREATE POLICY "admin_security_audit_all" ON security_audit_logs
FOR ALL USING (auth.is_admin());

-- Security events - admin only
CREATE POLICY "admin_security_events_all" ON security_events
FOR ALL USING (auth.is_admin());

-- Role permissions - read-only for authenticated users
CREATE POLICY "authenticated_role_permissions_read" ON role_permissions
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_role_permissions_all" ON role_permissions
FOR ALL USING (auth.is_admin());

-- System config - admin only
CREATE POLICY "admin_system_config_all" ON system_config
FOR ALL USING (auth.is_admin());

-- ============================================================================
-- ACTIVITY LOGGING FUNCTIONS
-- ============================================================================

-- Function to log user activities
CREATE OR REPLACE FUNCTION log_user_activity(
    p_action activity_action,
    p_resource_type VARCHAR(100),
    p_resource_id UUID DEFAULT NULL,
    p_resource_identifier VARCHAR(255) DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_additional_context JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    activity_id UUID;
    user_role TEXT;
    user_email TEXT;
BEGIN
    -- Only log for authenticated users
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get user details
    SELECT up.user_type, au.email
    INTO user_role, user_email
    FROM user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE up.id = auth.uid();

    -- Create activity log
    INSERT INTO user_activity_logs (
        user_id,
        user_role,
        user_email,
        action,
        resource_type,
        resource_id,
        resource_identifier,
        old_values,
        new_values,
        description,
        additional_context,
        changes_summary,
        severity
    ) VALUES (
        auth.uid(),
        COALESCE(user_role, 'customer'),
        user_email,
        p_action,
        p_resource_type,
        p_resource_id,
        p_resource_identifier,
        p_old_values,
        p_new_values,
        p_description,
        COALESCE(p_additional_context, '{}'::jsonb),
        CASE
            WHEN p_old_values IS NOT NULL AND p_new_values IS NOT NULL
            THEN 'Data modified'
            WHEN p_action = 'DELETE' THEN 'Data deleted'
            WHEN p_action = 'CREATE' THEN 'Data created'
            ELSE 'Action performed'
        END,
        CASE
            WHEN p_action IN ('DELETE', 'EXPORT') THEN 'high'::activity_severity
            WHEN p_action IN ('CREATE', 'UPDATE') THEN 'medium'::activity_severity
            ELSE 'low'::activity_severity
        END
    ) RETURNING id INTO activity_id;

    RETURN activity_id;
END;
$$;

-- ============================================================================
-- SETUP AND INSTALLATION FUNCTIONS
-- ============================================================================

-- Function to complete system setup
CREATE OR REPLACE FUNCTION complete_system_setup(
    p_admin_user_id UUID,
    p_allow_registration BOOLEAN DEFAULT false,
    p_require_admin_approval BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    config_exists BOOLEAN;
BEGIN
    -- Check if setup is already completed
    SELECT is_installed INTO config_exists
    FROM system_config
    WHERE is_installed = true;

    IF config_exists THEN
        RAISE EXCEPTION 'System setup is already completed';
    END IF;

    -- Create admin user profile if not exists
    INSERT INTO user_profiles (
        id,
        user_type,
        is_active,
        activation_required,
        activated_at,
        role_assigned_at,
        role_assigned_by
    ) VALUES (
        p_admin_user_id,
        'admin',
        true,
        false,
        NOW(),
        NOW(),
        p_admin_user_id
    ) ON CONFLICT (id) DO UPDATE SET
        user_type = 'admin',
        is_active = true,
        activation_required = false,
        activated_at = NOW(),
        role_assigned_at = NOW(),
        role_assigned_by = p_admin_user_id;

    -- Update system configuration
    UPDATE system_config SET
        is_installed = true,
        installation_completed_at = NOW(),
        allow_registration = p_allow_registration,
        require_admin_approval = p_require_admin_approval,
        first_admin_id = p_admin_user_id,
        setup_completed_by = p_admin_user_id,
        updated_at = NOW();

    -- Log the setup completion
    PERFORM log_user_activity(
        'ACTIVATE'::activity_action,
        'system_config',
        NULL,
        'System Setup Completed',
        NULL,
        jsonb_build_object(
            'allow_registration', p_allow_registration,
            'require_admin_approval', p_require_admin_approval
        ),
        'System installation and setup completed',
        jsonb_build_object('setup_version', '1.0.0')
    );

    RETURN true;
END;
$$;

-- Function to create user with role (admin use)
CREATE OR REPLACE FUNCTION create_user_with_role(
    p_user_id UUID,
    p_email VARCHAR(255),
    p_first_name VARCHAR(100),
    p_last_name VARCHAR(100),
    p_user_type VARCHAR(20),
    p_require_activation BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_id UUID;
BEGIN
    -- Only admins can create users with roles
    IF NOT auth.is_admin() THEN
        RAISE EXCEPTION 'Insufficient permissions to create user with role';
    END IF;

    -- Validate role
    IF p_user_type NOT IN ('admin', 'employee', 'customer') THEN
        RAISE EXCEPTION 'Invalid user type: %', p_user_type;
    END IF;

    -- Create user profile
    INSERT INTO user_profiles (
        id,
        first_name,
        last_name,
        user_type,
        is_active,
        activation_required,
        activated_at,
        activated_by,
        role_assigned_at,
        role_assigned_by
    ) VALUES (
        p_user_id,
        p_first_name,
        p_last_name,
        p_user_type,
        NOT p_require_activation,
        p_require_activation,
        CASE WHEN NOT p_require_activation THEN NOW() ELSE NULL END,
        CASE WHEN NOT p_require_activation THEN auth.uid() ELSE NULL END,
        NOW(),
        auth.uid()
    ) RETURNING id INTO profile_id;

    -- Log user creation
    PERFORM log_user_activity(
        'CREATE'::activity_action,
        'user_profiles',
        profile_id,
        p_email,
        NULL,
        jsonb_build_object(
            'user_type', p_user_type,
            'require_activation', p_require_activation
        ),
        'User created with role: ' || p_user_type,
        jsonb_build_object('created_by_admin', auth.uid())
    );

    RETURN profile_id;
END;
$$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_resource ON user_activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_severity ON user_activity_logs(severity);

-- Security logs indexes
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_severity ON security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);

-- Enhanced user profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_active ON user_profiles(user_type, is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_activation ON user_profiles(activation_required, activated_at);

-- Role permissions indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC ACTIVITY LOGGING
-- ============================================================================

-- Function for automatic activity logging on data changes
CREATE OR REPLACE FUNCTION trigger_log_data_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    action_type activity_action;
    resource_name VARCHAR(100);
    resource_identifier VARCHAR(255);
    old_vals JSONB;
    new_vals JSONB;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type := 'CREATE'::activity_action;
        new_vals := to_jsonb(NEW);
        old_vals := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE'::activity_action;
        old_vals := to_jsonb(OLD);
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'DELETE'::activity_action;
        old_vals := to_jsonb(OLD);
        new_vals := NULL;
    END IF;

    -- Get resource name from table
    resource_name := TG_TABLE_NAME;

    -- Get resource identifier
    resource_identifier := COALESCE(
        CASE
            WHEN resource_name = 'customers' THEN
                COALESCE(NEW.company_name, OLD.company_name, NEW.contact_person, OLD.contact_person)
            WHEN resource_name = 'contact_requests' THEN
                COALESCE(NEW.subject, OLD.subject)
            WHEN resource_name = 'user_profiles' THEN
                COALESCE(NEW.first_name || ' ' || NEW.last_name, OLD.first_name || ' ' || OLD.last_name)
            ELSE 'Record'
        END,
        'Unknown'
    );

    -- Only log for employee and admin actions (customers' actions on their own data are not logged)
    IF auth.get_user_role() IN ('admin', 'employee') THEN
        PERFORM log_user_activity(
            action_type,
            resource_name,
            COALESCE(NEW.id, OLD.id),
            resource_identifier,
            old_vals,
            new_vals,
            TG_OP || ' operation on ' || resource_name,
            jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply activity logging triggers to key tables (only for admin/employee actions)
CREATE TRIGGER trigger_customers_activity_log
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION trigger_log_data_changes();

CREATE TRIGGER trigger_contact_requests_activity_log
    AFTER INSERT OR UPDATE OR DELETE ON contact_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_log_data_changes();

CREATE TRIGGER trigger_customer_notes_activity_log
    AFTER INSERT OR UPDATE OR DELETE ON customer_notes
    FOR EACH ROW EXECUTE FUNCTION trigger_log_data_changes();

-- ============================================================================
-- INITIAL DATA AND COMMENTS
-- ============================================================================

COMMENT ON TABLE system_config IS 'BSM V2: System configuration and installation tracking';
COMMENT ON TABLE user_activity_logs IS 'BSM V2: Comprehensive user activity logging for audit and compliance';
COMMENT ON TABLE security_audit_logs IS 'BSM V2: Security middleware audit logging';
COMMENT ON TABLE security_events IS 'BSM V2: Security threat detection and incident tracking';
COMMENT ON TABLE role_permissions IS 'BSM V2: Role-based permission matrix for fine-grained access control';

COMMENT ON FUNCTION auth.get_user_role() IS 'BSM V2: Helper function to get current user role';
COMMENT ON FUNCTION auth.is_admin() IS 'BSM V2: Helper function to check admin privileges';
COMMENT ON FUNCTION auth.is_staff() IS 'BSM V2: Helper function to check staff (admin/employee) privileges';
COMMENT ON FUNCTION log_user_activity IS 'BSM V2: Comprehensive activity logging function';
COMMENT ON FUNCTION complete_system_setup IS 'BSM V2: Initial system setup and first admin creation';
COMMENT ON FUNCTION create_user_with_role IS 'BSM V2: Admin function to create users with specific roles';