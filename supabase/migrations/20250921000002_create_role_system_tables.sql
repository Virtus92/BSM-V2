-- Create all new role system tables and update user_profiles
-- Split from policy creation to avoid conflicts

-- ============================================================================
-- UPDATE USER_PROFILES TABLE
-- ============================================================================

-- Drop existing constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;

-- Update column type
ALTER TABLE user_profiles ALTER COLUMN user_type TYPE VARCHAR(20);

-- Add new constraint with employee role
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_type_check
CHECK (user_type IN ('admin', 'employee', 'customer'));

-- Add new columns for role management
DO $$
BEGIN
    -- Role assignment tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role_assigned_at') THEN
        ALTER TABLE user_profiles ADD COLUMN role_assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role_assigned_by') THEN
        ALTER TABLE user_profiles ADD COLUMN role_assigned_by UUID REFERENCES auth.users(id);
    END IF;

    -- Activity status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_active') THEN
        ALTER TABLE user_profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Activation tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'activation_required') THEN
        ALTER TABLE user_profiles ADD COLUMN activation_required BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'activated_at') THEN
        ALTER TABLE user_profiles ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'activated_by') THEN
        ALTER TABLE user_profiles ADD COLUMN activated_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update existing user profiles to be active
UPDATE user_profiles SET
    is_active = true,
    activation_required = false,
    activated_at = NOW(),
    role_assigned_at = COALESCE(role_assigned_at, NOW())
WHERE is_active IS NULL OR activation_required IS NULL;

-- ============================================================================
-- SYSTEM CONFIGURATION TABLE
-- ============================================================================

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
    setup_completed_by UUID REFERENCES auth.users(id)
);

-- Create single system config row if none exists
INSERT INTO system_config (is_installed)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM system_config);

-- ============================================================================
-- ACTIVITY LOGGING ENUMS AND TABLES
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
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    resource_identifier VARCHAR(255),

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

-- Security audit logs
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

-- Security events
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
-- ROLE PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee', 'customer')),
    resource VARCHAR(100) NOT NULL,

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
    scope_restriction VARCHAR(50),
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
-- ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Enhanced user profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_active ON user_profiles(user_type, is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_activation ON user_profiles(activation_required, activated_at);

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

-- Role permissions indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);