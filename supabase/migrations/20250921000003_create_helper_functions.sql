-- Create helper functions for role-based access control
-- Must be created before policies that use them

-- ============================================================================
-- ROLE HELPER FUNCTIONS
-- ============================================================================

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
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
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$;

-- Helper function to check if user is staff (admin or employee)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'employee');
END;
$$;

-- ============================================================================
-- ACTIVITY LOGGING FUNCTION
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

    -- Create or update admin user profile
    INSERT INTO user_profiles (
        id,
        user_type,
        is_active,
        activation_required,
        activated_at,
        activated_by,
        role_assigned_at,
        role_assigned_by
    ) VALUES (
        p_admin_user_id,
        'admin',
        true,
        false,
        NOW(),
        p_admin_user_id,
        NOW(),
        p_admin_user_id
    ) ON CONFLICT (id) DO UPDATE SET
        user_type = 'admin',
        is_active = true,
        activation_required = false,
        activated_at = NOW(),
        activated_by = p_admin_user_id,
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
    IF NOT is_admin() THEN
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
-- AUTOMATIC ACTIVITY LOGGING TRIGGER FUNCTION
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
    IF get_user_role() IN ('admin', 'employee') THEN
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

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_user_role() IS 'BSM V2: Helper function to get current user role';
COMMENT ON FUNCTION is_admin() IS 'BSM V2: Helper function to check admin privileges';
COMMENT ON FUNCTION is_staff() IS 'BSM V2: Helper function to check staff (admin/employee) privileges';
COMMENT ON FUNCTION log_user_activity IS 'BSM V2: Comprehensive activity logging function';
COMMENT ON FUNCTION complete_system_setup IS 'BSM V2: Initial system setup and first admin creation';
COMMENT ON FUNCTION create_user_with_role IS 'BSM V2: Admin function to create users with specific roles';
COMMENT ON FUNCTION trigger_log_data_changes IS 'BSM V2: Automatic activity logging trigger function';