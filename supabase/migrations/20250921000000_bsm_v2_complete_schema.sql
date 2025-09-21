-- BSM V2 Complete Schema Migration
-- Consolidated single-tenant BSM platform with automation
-- Replaces all previous migrations with clean, unified schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- Customer status enum
DO $$ BEGIN
    CREATE TYPE customer_status AS ENUM ('prospect', 'active', 'inactive', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Priority level enum for notes
DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- User Profiles (Extended user information)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Profile Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    phone VARCHAR(50),

    -- User Type
    user_type VARCHAR(20) DEFAULT 'customer' CHECK (user_type IN ('admin', 'customer')),

    -- Preferences
    timezone VARCHAR(100) DEFAULT 'Europe/Berlin',
    language VARCHAR(10) DEFAULT 'de',
    notifications_enabled BOOLEAN DEFAULT true,

    -- Metadata
    last_seen_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Customers (CRM with optional user account linking)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Basic Information
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),

    -- Business
    status customer_status DEFAULT 'prospect',
    website VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50),

    -- Financial
    tax_id VARCHAR(50),
    vat_id VARCHAR(50),
    discount_rate DECIMAL(5,2) DEFAULT 0,

    -- User Account Linking
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_invited_at TIMESTAMP WITH TIME ZONE,
    user_activated_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Contact Requests (Lead generation)
CREATE TABLE IF NOT EXISTS contact_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Contact Information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),

    -- Request Details
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'responded', 'converted', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Metadata
    source VARCHAR(100) DEFAULT 'website',
    ip_address INET,
    user_agent TEXT,

    -- Conversion to Customer
    converted_to_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    converted_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Contact Request Notes
CREATE TABLE IF NOT EXISTS contact_request_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_request_id UUID NOT NULL REFERENCES contact_requests(id) ON DELETE CASCADE,

    -- Note Content
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Customer Notes System
CREATE TABLE IF NOT EXISTS customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Note Content
    title VARCHAR(255),
    content TEXT NOT NULL,

    -- Metadata
    is_internal BOOLEAN DEFAULT false,
    note_type VARCHAR(50) DEFAULT 'general' CHECK (note_type IN ('general', 'meeting', 'call', 'task', 'follow_up', 'quote', 'support')),
    priority priority_level DEFAULT 'medium',

    -- User tracking
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    -- Optional due date for task-type notes
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- N8N AUTOMATION TABLES
-- ============================================================================

-- Workflow registry table
CREATE TABLE IF NOT EXISTS workflow_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    n8n_workflow_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT false,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id),
    category TEXT CHECK (category IN ('customer_automation', 'lead_processing', 'communication', 'reporting', 'integration')),
    tags TEXT[] DEFAULT '{}',
    webhook_url TEXT,
    trigger_type TEXT CHECK (trigger_type IN ('webhook', 'cron', 'manual', 'event')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_execution_at TIMESTAMPTZ,
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0
);

-- Workflow execution logs
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_registry_id UUID REFERENCES workflow_registry(id) ON DELETE CASCADE,
    n8n_execution_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'running', 'waiting', 'canceled')),
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    execution_time_ms INTEGER,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    customer_id UUID REFERENCES customers(id),
    contact_request_id UUID REFERENCES contact_requests(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer automation preferences
CREATE TABLE IF NOT EXISTS customer_automation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
    auto_lead_processing BOOLEAN DEFAULT false,
    auto_email_responses BOOLEAN DEFAULT false,
    auto_slack_notifications BOOLEAN DEFAULT true,
    auto_task_creation BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow templates for easy customer setup
CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    n8n_template_data JSONB NOT NULL,
    required_credentials TEXT[] DEFAULT '{}',
    setup_instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_seen ON user_profiles(last_seen_at);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers USING gin(to_tsvector('german', company_name || ' ' || COALESCE(contact_person, '')));

-- Contact request indexes
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_requests_assigned_to ON contact_requests(assigned_to);

-- Contact request notes indexes
CREATE INDEX IF NOT EXISTS idx_contact_request_notes_request_id ON contact_request_notes(contact_request_id);
CREATE INDEX IF NOT EXISTS idx_contact_request_notes_created_at ON contact_request_notes(created_at);

-- Customer notes indexes
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_notes_type ON customer_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_customer_notes_priority ON customer_notes(priority);
CREATE INDEX IF NOT EXISTS idx_customer_notes_due_date ON customer_notes(due_date) WHERE due_date IS NOT NULL;

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflow_registry_customer_id ON workflow_registry(customer_id);
CREATE INDEX IF NOT EXISTS idx_workflow_registry_active ON workflow_registry(active);
CREATE INDEX IF NOT EXISTS idx_workflow_registry_n8n_id ON workflow_registry(n8n_workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_registry_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_automation_customer_id ON customer_automation_settings(customer_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_request_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- User Profiles Policies
CREATE POLICY "users_own_profile" ON user_profiles
FOR ALL USING (id = auth.uid());

CREATE POLICY "service_role_access" ON user_profiles
FOR ALL USING (auth.role() = 'service_role');

-- Customer Policies
CREATE POLICY "admin_access_customers" ON customers
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'admin'
    )
);

CREATE POLICY "customer_access_own_data" ON customers
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "customer_update_own_data" ON customers
FOR UPDATE USING (user_id = auth.uid());

-- Contact Request Policies
CREATE POLICY "admin_access_contact_requests" ON contact_requests
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'admin'
    )
);

CREATE POLICY "contact_requests_insert_own" ON contact_requests
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "contact_requests_select_own" ON contact_requests
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "contact_requests_update_own" ON contact_requests
FOR UPDATE USING (created_by = auth.uid() AND converted_to_customer_id IS NULL);

-- Contact Request Notes Policies
CREATE POLICY "admin_access_contact_request_notes" ON contact_request_notes
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'admin'
    )
);

-- Customer Notes Policies
CREATE POLICY "users_can_view_customer_notes" ON customer_notes
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users_can_create_customer_notes" ON customer_notes
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "users_can_update_own_customer_notes" ON customer_notes
FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "users_can_delete_own_customer_notes" ON customer_notes
FOR DELETE USING (created_by = auth.uid());

-- Workflow Policies
CREATE POLICY "admin_can_manage_all_workflows" ON workflow_registry
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'admin'
    )
);

CREATE POLICY "customers_can_view_own_workflows" ON workflow_registry
FOR SELECT USING (
    customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
    )
);

CREATE POLICY "admin_can_manage_all_executions" ON workflow_executions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'admin'
    )
);

CREATE POLICY "customers_can_view_own_executions" ON workflow_executions
FOR SELECT USING (
    customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
    )
);

CREATE POLICY "admin_can_manage_automation_settings" ON customer_automation_settings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'admin'
    )
);

CREATE POLICY "customers_can_manage_own_automation_settings" ON customer_automation_settings
FOR ALL USING (
    customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
    )
);

CREATE POLICY "anyone_can_view_workflow_templates" ON workflow_templates
FOR SELECT USING (is_active = true);

CREATE POLICY "admin_can_manage_workflow_templates" ON workflow_templates
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'admin'
    )
);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Updated timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_contact_requests_updated_at
BEFORE UPDATE ON contact_requests
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_workflow_registry_updated_at
BEFORE UPDATE ON workflow_registry
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_automation_settings_updated_at
BEFORE UPDATE ON customer_automation_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at
BEFORE UPDATE ON workflow_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Customer notes updated_at trigger with user tracking
CREATE OR REPLACE FUNCTION update_customer_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_notes_updated_at
BEFORE UPDATE ON customer_notes
FOR EACH ROW
EXECUTE FUNCTION update_customer_notes_updated_at();

-- Function to sync workflow execution stats
CREATE OR REPLACE FUNCTION sync_workflow_execution_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE workflow_registry
        SET
            total_executions = total_executions + 1,
            successful_executions = CASE
                WHEN NEW.status = 'success' THEN successful_executions + 1
                ELSE successful_executions
            END,
            failed_executions = CASE
                WHEN NEW.status = 'error' THEN failed_executions + 1
                ELSE failed_executions
            END,
            last_execution_at = NEW.started_at
        WHERE id = NEW.workflow_registry_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        UPDATE workflow_registry
        SET
            successful_executions = CASE
                WHEN NEW.status = 'success' AND OLD.status != 'success' THEN successful_executions + 1
                WHEN OLD.status = 'success' AND NEW.status != 'success' THEN successful_executions - 1
                ELSE successful_executions
            END,
            failed_executions = CASE
                WHEN NEW.status = 'error' AND OLD.status != 'error' THEN failed_executions + 1
                WHEN OLD.status = 'error' AND NEW.status != 'error' THEN failed_executions - 1
                ELSE failed_executions
            END
        WHERE id = NEW.workflow_registry_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_workflow_stats_trigger
AFTER INSERT OR UPDATE ON workflow_executions
FOR EACH ROW EXECUTE FUNCTION sync_workflow_execution_stats();

-- Function to create customer from contact request
CREATE OR REPLACE FUNCTION create_customer_from_request(request_id UUID, create_user_account BOOLEAN DEFAULT false)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_record contact_requests%ROWTYPE;
    customer_id UUID;
    new_user_id UUID;
BEGIN
    -- Get contact request
    SELECT * INTO request_record
    FROM contact_requests
    WHERE id = request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact request not found';
    END IF;

    -- Create customer
    INSERT INTO customers (
        company_name,
        contact_person,
        email,
        phone,
        status,
        created_by
    ) VALUES (
        COALESCE(request_record.company, request_record.name),
        request_record.name,
        request_record.email,
        request_record.phone,
        'prospect',
        auth.uid()
    ) RETURNING id INTO customer_id;

    -- Create initial note
    INSERT INTO customer_notes (
        customer_id,
        title,
        content,
        note_type,
        created_by
    ) VALUES (
        customer_id,
        'Erstellt aus Kontaktanfrage',
        'Anfrage: ' || request_record.subject || E'\n\nNachricht: ' || request_record.message,
        'general',
        auth.uid()
    );

    -- Create user account if requested
    IF create_user_account THEN
        UPDATE customers
        SET user_invited_at = NOW()
        WHERE id = customer_id;
    END IF;

    -- Update contact request
    UPDATE contact_requests
    SET
        status = 'converted',
        converted_to_customer_id = customer_id,
        converted_at = NOW()
    WHERE id = request_id;

    RETURN customer_id;
END;
$$;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Sample customers
INSERT INTO customers (
    company_name,
    contact_person,
    email,
    phone,
    status,
    industry,
    address_line1,
    city,
    postal_code,
    country
) VALUES
(
    'TechCorp Solutions GmbH',
    'Michael Weber',
    'michael.weber@techcorp.de',
    '+49 30 12345678',
    'active',
    'Technology',
    'Alexanderplatz 1',
    'Berlin',
    '10178',
    'Deutschland'
),
(
    'Digital Marketing Plus',
    'Sarah Müller',
    'sarah.mueller@digitalplus.de',
    '+49 89 87654321',
    'active',
    'Marketing',
    'Marienplatz 8',
    'München',
    '80331',
    'Deutschland'
),
(
    'StartupLab Berlin',
    'Alex Fischer',
    'alex@startuplab.de',
    '+49 30 55667788',
    'prospect',
    'Consulting',
    'Potsdamer Platz 5',
    'Berlin',
    '10785',
    'Deutschland'
)
ON CONFLICT (email) DO NOTHING;

-- Sample workflow templates
INSERT INTO workflow_templates (name, description, category, n8n_template_data, required_credentials, setup_instructions) VALUES
(
    'Customer Lead Processing',
    'Automatically process new customer inquiries and create follow-up tasks',
    'customer_automation',
    '{
        "nodes": [
            {"name": "Webhook Trigger", "type": "webhook"},
            {"name": "Create Customer", "type": "supabase"},
            {"name": "Send Welcome Email", "type": "email"},
            {"name": "Create Follow-up Task", "type": "supabase"}
        ]
    }',
    ARRAY['supabase_connection', 'email_smtp'],
    'Configure webhook URL in your contact form and set up email credentials'
),
(
    'Slack Notifications',
    'Send notifications to Slack when important events occur',
    'communication',
    '{
        "nodes": [
            {"name": "Event Trigger", "type": "webhook"},
            {"name": "Format Message", "type": "function"},
            {"name": "Send to Slack", "type": "slack"}
        ]
    }',
    ARRAY['slack_bot_token'],
    'Create Slack app and configure bot token with appropriate permissions'
),
(
    'Weekly Customer Report',
    'Generate and send weekly customer activity reports',
    'reporting',
    '{
        "nodes": [
            {"name": "Schedule Trigger", "type": "cron"},
            {"name": "Fetch Customer Data", "type": "supabase"},
            {"name": "Generate Report", "type": "function"},
            {"name": "Send Email Report", "type": "email"}
        ]
    }',
    ARRAY['supabase_connection', 'email_smtp'],
    'Configure email recipients and customize report template'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE customers IS 'BSM V2: Customer management with optional user account linking';
COMMENT ON TABLE contact_requests IS 'BSM V2: Contact form submissions and lead generation';
COMMENT ON TABLE contact_request_notes IS 'BSM V2: Notes and comments on contact requests';
COMMENT ON TABLE user_profiles IS 'BSM V2: Extended user profile information';
COMMENT ON TABLE customer_notes IS 'BSM V2: Enhanced note-taking system for customer detail pages';
COMMENT ON TABLE workflow_registry IS 'BSM V2: N8N workflow metadata and execution tracking';
COMMENT ON TABLE workflow_executions IS 'BSM V2: N8N workflow execution logs';
COMMENT ON TABLE customer_automation_settings IS 'BSM V2: Customer automation preferences';
COMMENT ON TABLE workflow_templates IS 'BSM V2: Workflow templates for easy customer setup';
COMMENT ON FUNCTION create_customer_from_request IS 'BSM V2: Convert contact request to customer with optional user account';