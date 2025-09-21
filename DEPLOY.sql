-- ============================================================================
-- ONE-COMMAND DEPLOYMENT FOR BSM SAAS
-- Copy-paste this entire script into Supabase Dashboard → SQL Editor
-- ============================================================================

-- Drop existing objects if they exist
DROP MATERIALIZED VIEW IF EXISTS dashboard_stats;
DROP VIEW IF EXISTS recent_activities;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_workspace_ids();
DROP FUNCTION IF EXISTS refresh_dashboard_stats();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOM TYPES - Drop and recreate all to avoid conflicts
-- ============================================================================

DROP TYPE IF EXISTS customer_status CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS quote_status CASCADE;
DROP TYPE IF EXISTS contract_status CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS workspace_plan CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE customer_status AS ENUM ('prospect', 'active', 'inactive', 'archived');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
CREATE TYPE contract_status AS ENUM ('draft', 'active', 'expired', 'terminated');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE document_type AS ENUM ('contract', 'quote', 'invoice', 'report', 'template', 'specification', 'other');
CREATE TYPE workspace_plan AS ENUM ('free', 'professional', 'enterprise');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Workspaces
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    plan workspace_plan DEFAULT 'free',
    settings JSONB DEFAULT '{}'::jsonb,
    timezone VARCHAR(100) DEFAULT 'Europe/Berlin',
    currency VARCHAR(3) DEFAULT 'EUR',
    created_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Workspace Members
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'member',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(workspace_id, user_id)
);

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    status customer_status DEFAULT 'prospect',
    website VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    tax_id VARCHAR(50),
    vat_id VARCHAR(50),
    discount_rate DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(100),
    start_date DATE,
    end_date DATE,
    estimated_hours INTEGER,
    status project_status DEFAULT 'planning',
    priority priority_level DEFAULT 'medium',
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    budget DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    project_manager_id UUID REFERENCES auth.users(id),
    external_contacts JSONB DEFAULT '[]'::jsonb,
    tags TEXT[],
    milestones JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Quotes
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quote_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subtotal_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 19,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    valid_until DATE,
    estimated_hours INTEGER,
    payment_schedule VARCHAR(50) DEFAULT 'upon_completion',
    terms_conditions TEXT,
    status quote_status DEFAULT 'draft',
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    client_notes TEXT,
    sections JSONB DEFAULT '[]'::jsonb,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    contract_type VARCHAR(50) DEFAULT 'service',
    start_date DATE NOT NULL,
    end_date DATE,
    duration_months INTEGER,
    contract_value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_due_days INTEGER DEFAULT 30,
    terms_conditions TEXT,
    sla_terms TEXT,
    confidentiality_clause TEXT,
    status contract_status DEFAULT 'draft',
    signed_at TIMESTAMP WITH TIME ZONE,
    signed_by_customer VARCHAR(255),
    signed_by_us VARCHAR(255),
    auto_renewal BOOLEAN DEFAULT false,
    renewal_notice_days INTEGER DEFAULT 30,
    renewal_reminders_sent INTEGER DEFAULT 0,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    document_type document_type DEFAULT 'other',
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    file_hash VARCHAR(64),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    password_protected BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    version_number INTEGER DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT true,
    parent_document_id UUID REFERENCES documents(id),
    storage_bucket VARCHAR(100) DEFAULT 'documents',
    upload_source VARCHAR(50) DEFAULT 'manual',
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    custom_metadata JSONB DEFAULT '{}'::jsonb,
    uploaded_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Activities
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(255),
    description TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    source VARCHAR(50) DEFAULT 'web',
    changed_fields TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- HELPER FUNCTIONS (Basic ones first)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_workspace_ids()
RETURNS UUID[]
LANGUAGE SQL
STABLE
AS $$
    SELECT COALESCE(
        ARRAY(
            SELECT wm.workspace_id
            FROM workspace_members wm
            WHERE wm.user_id = auth.uid()
        ),
        ARRAY[]::UUID[]
    );
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- VIEWS AND MATERIALIZED VIEWS
-- ============================================================================

CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
    w.id as workspace_id,
    COUNT(CASE WHEN c.status = 'active' AND c.deleted_at IS NULL THEN 1 END) as active_customers,
    COUNT(CASE WHEN c.status = 'prospect' AND c.deleted_at IS NULL THEN 1 END) as prospect_customers,
    COUNT(CASE WHEN c.deleted_at IS NULL THEN 1 END) as total_customers,
    COUNT(CASE WHEN p.status = 'active' AND p.deleted_at IS NULL THEN 1 END) as active_projects,
    COUNT(CASE WHEN p.status = 'completed' AND p.deleted_at IS NULL THEN 1 END) as completed_projects,
    COUNT(CASE WHEN p.deleted_at IS NULL THEN 1 END) as total_projects,
    COUNT(CASE WHEN q.status = 'sent' AND q.deleted_at IS NULL THEN 1 END) as pending_quotes,
    COUNT(CASE WHEN q.status = 'accepted' AND q.deleted_at IS NULL THEN 1 END) as accepted_quotes,
    COUNT(CASE WHEN q.deleted_at IS NULL THEN 1 END) as total_quotes,
    COUNT(CASE WHEN ct.status = 'active' AND ct.deleted_at IS NULL THEN 1 END) as active_contracts,
    COUNT(CASE WHEN ct.deleted_at IS NULL THEN 1 END) as total_contracts,
    COALESCE(SUM(CASE
        WHEN q.status = 'accepted'
        AND q.accepted_at >= DATE_TRUNC('month', NOW())
        AND q.deleted_at IS NULL
        THEN q.total_amount
    END), 0) as monthly_revenue,
    COALESCE(SUM(CASE
        WHEN q.status = 'accepted'
        AND q.deleted_at IS NULL
        THEN q.total_amount
    END), 0) as total_revenue,
    NOW() as calculated_at
FROM workspaces w
LEFT JOIN customers c ON c.workspace_id = w.id
LEFT JOIN projects p ON p.workspace_id = w.id
LEFT JOIN quotes q ON q.workspace_id = w.id
LEFT JOIN contracts ct ON ct.workspace_id = w.id
WHERE w.deleted_at IS NULL
GROUP BY w.id;

CREATE VIEW recent_activities AS
SELECT
    a.id,
    a.workspace_id,
    a.created_at,
    a.action,
    a.entity_type,
    a.entity_id,
    a.entity_name,
    a.description,
    a.user_name,
    a.user_email,
    a.source,
    CASE
        WHEN a.entity_type = 'customers' THEN 'customer_' || a.action
        WHEN a.entity_type = 'projects' THEN 'project_' || a.action
        WHEN a.entity_type = 'quotes' THEN 'quote_' || a.action
        WHEN a.entity_type = 'contracts' THEN 'contract_' || a.action
        WHEN a.entity_type = 'documents' THEN 'document_' || a.action
        ELSE a.action
    END as type,
    a.metadata
FROM activities a
WHERE a.created_at >= NOW() - INTERVAL '90 days'
ORDER BY a.created_at DESC;

CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE SQL
AS $$
    REFRESH MATERIALIZED VIEW dashboard_stats;
$$;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_customers_workspace_status ON customers(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_workspace_status ON projects(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_workspace_status ON quotes(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_workspace_status ON contracts(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_workspace_type ON documents(workspace_id, document_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_workspace_created ON activities(workspace_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_access" ON workspaces
FOR ALL USING (id = ANY(get_user_workspace_ids()));

CREATE POLICY "workspace_members_access" ON workspace_members
FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));

CREATE POLICY "customers_access" ON customers
FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()) AND deleted_at IS NULL);

CREATE POLICY "projects_access" ON projects
FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()) AND deleted_at IS NULL);

CREATE POLICY "quotes_access" ON quotes
FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()) AND deleted_at IS NULL);

CREATE POLICY "contracts_access" ON contracts
FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()) AND deleted_at IS NULL);

CREATE POLICY "documents_access" ON documents
FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()) AND deleted_at IS NULL);

CREATE POLICY "activities_access" ON activities
FOR SELECT USING (workspace_id = ANY(get_user_workspace_ids()));

CREATE POLICY "activities_insert" ON activities
FOR INSERT WITH CHECK (workspace_id = ANY(get_user_workspace_ids()));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

INSERT INTO workspaces (
    id, name, slug, description, plan, settings, currency
) VALUES (
    '01234567-89ab-cdef-0123-456789abcdef',
    'Virtus Umbra GmbH',
    'virtus-umbra',
    'Fullstack Development & AI Engineering Company',
    'enterprise',
    '{"invoice_prefix": "VU", "default_tax_rate": 19}',
    'EUR'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO customers (
    workspace_id, company_name, contact_person, email, phone, status, industry,
    address_line1, city, postal_code, country
) VALUES
(
    '01234567-89ab-cdef-0123-456789abcdef',
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
    '01234567-89ab-cdef-0123-456789abcdef',
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
    '01234567-89ab-cdef-0123-456789abcdef',
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
);

INSERT INTO activities (
    workspace_id, action, entity_type, entity_name, description, user_name, user_email
) VALUES
(
    '01234567-89ab-cdef-0123-456789abcdef',
    'created',
    'customers',
    'TechCorp Solutions GmbH',
    'Neuer Kunde "TechCorp Solutions GmbH" wurde erstellt',
    'System',
    'system@virtusumbra.de'
),
(
    '01234567-89ab-cdef-0123-456789abcdef',
    'created',
    'customers',
    'Digital Marketing Plus',
    'Neuer Kunde "Digital Marketing Plus" wurde erstellt',
    'System',
    'system@virtusumbra.de'
);

-- Refresh dashboard stats
SELECT refresh_dashboard_stats();

-- ============================================================================
-- DEPLOYMENT COMPLETE ✅
-- Your BSM SaaS is now ready with:
-- ✅ Complete multi-tenant schema
-- ✅ Sample customers and activities
-- ✅ Dashboard with real data (no mock content)
-- ✅ All required views and functions
-- ============================================================================