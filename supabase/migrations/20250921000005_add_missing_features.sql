-- Create missing features: Documents, Tasks, and Enhanced Employee Management
-- Split from existing schema to avoid conflicts

-- ============================================================================
-- DOCUMENT MANAGEMENT SYSTEM
-- ============================================================================

-- Document types and categories
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM (
        'contract', 'invoice', 'proposal', 'report',
        'specification', 'guide', 'policy', 'template',
        'certificate', 'license', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM (
        'draft', 'under_review', 'approved', 'published',
        'archived', 'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Document metadata
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_type document_type NOT NULL,
    status document_status DEFAULT 'draft',

    -- File information
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    file_mime_type VARCHAR(100),
    file_path TEXT NOT NULL, -- Storage path or URL
    file_hash VARCHAR(64), -- For integrity verification

    -- Versioning
    version VARCHAR(20) DEFAULT '1.0',
    is_latest_version BOOLEAN DEFAULT true,
    parent_document_id UUID REFERENCES documents(id),

    -- Access control
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'internal', 'private')),
    access_level VARCHAR(20) DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'admin')),

    -- Ownership and assignment
    created_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    department VARCHAR(100),

    -- Customer/project association
    customer_id UUID REFERENCES customers(id),
    contact_request_id UUID REFERENCES contact_requests(id),

    -- Metadata and categorization
    tags TEXT[], -- Array of tags for categorization
    keywords TEXT[], -- Searchable keywords
    expiry_date TIMESTAMP WITH TIME ZONE,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Approval workflow
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Document access logs
CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL, -- 'view', 'download', 'edit', 'delete'

    -- Request context
    ip_address INET,
    user_agent TEXT,

    -- Additional context
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TASK MANAGEMENT SYSTEM
-- ============================================================================

-- Task types and statuses
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM (
        'todo', 'in_progress', 'review', 'done',
        'cancelled', 'blocked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Task information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',

    -- Assignment and ownership
    created_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,

    -- Timing
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Relations
    customer_id UUID REFERENCES customers(id),
    contact_request_id UUID REFERENCES contact_requests(id),
    parent_task_id UUID REFERENCES tasks(id),

    -- Task categorization
    category VARCHAR(100),
    tags TEXT[],

    -- Progress tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Blocking and dependencies
    blocked_reason TEXT,
    dependencies TEXT[] -- Array of task IDs this task depends on
);

-- Task comments/updates
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),

    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- Internal comments not visible to customers

    -- Status change tracking
    old_status task_status,
    new_status task_status,
    status_changed BOOLEAN DEFAULT false,

    -- Time tracking
    time_logged_hours DECIMAL(5,2),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Task time tracking
CREATE TABLE IF NOT EXISTS task_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),

    -- Time tracking
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    hours_logged DECIMAL(5,2) NOT NULL,

    -- Description
    description TEXT,
    is_billable BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- ENHANCED EMPLOYEE MANAGEMENT
-- ============================================================================

-- Employee departments and roles
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    manager_id UUID REFERENCES auth.users(id),

    -- Department settings
    is_active BOOLEAN DEFAULT true,
    budget_limit DECIMAL(12,2),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Employee profiles with additional details
CREATE TABLE IF NOT EXISTS employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Link to user profile
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,

    -- Employment details
    employee_id VARCHAR(50) UNIQUE,
    department_id UUID REFERENCES departments(id),
    job_title VARCHAR(100),
    employment_type VARCHAR(50) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),

    -- Contact and personal
    direct_phone VARCHAR(50),
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(50),

    -- Employment dates
    hire_date DATE,
    termination_date DATE,

    -- Work schedule
    working_hours_per_week DECIMAL(5,2) DEFAULT 40.0,
    time_zone VARCHAR(50) DEFAULT 'Europe/Berlin',

    -- Skills and certifications
    skills TEXT[],
    certifications TEXT[],
    languages TEXT[],

    -- Performance and access
    performance_rating DECIMAL(3,2), -- 1.0 to 5.0
    access_level INTEGER DEFAULT 1, -- 1-5 access levels

    -- Manager relationship
    manager_id UUID REFERENCES auth.users(id),

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Employee performance tracking
CREATE TABLE IF NOT EXISTS employee_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    employee_id UUID NOT NULL REFERENCES auth.users(id),
    reviewed_by UUID NOT NULL REFERENCES auth.users(id),

    -- Review period
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,

    -- Performance metrics
    overall_rating DECIMAL(3,2) CHECK (overall_rating >= 1.0 AND overall_rating <= 5.0),
    goals_met_percentage INTEGER CHECK (goals_met_percentage >= 0 AND goals_met_percentage <= 100),

    -- Performance categories
    technical_skills_rating DECIMAL(3,2),
    communication_rating DECIMAL(3,2),
    teamwork_rating DECIMAL(3,2),
    leadership_rating DECIMAL(3,2),

    -- Qualitative feedback
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_for_next_period TEXT,
    manager_comments TEXT,
    employee_comments TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- CUSTOMER-REQUEST LINKING ENHANCEMENTS
-- ============================================================================

-- Ensure proper customer linkage in requests
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS customer_user_id UUID REFERENCES auth.users(id);
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS auto_converted BOOLEAN DEFAULT false;
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES auth.users(id);
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE;

-- Request assignments to employees
CREATE TABLE IF NOT EXISTS request_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    contact_request_id UUID NOT NULL REFERENCES contact_requests(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES auth.users(id),
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Assignment status
    is_active BOOLEAN DEFAULT true,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Assignment metadata
    priority task_priority DEFAULT 'medium',
    estimated_hours DECIMAL(5,2),
    notes TEXT,

    UNIQUE(contact_request_id, assigned_to, is_active)
);

-- ============================================================================
-- ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_customer_id ON documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_documents_type_status ON documents(document_type, status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_keywords ON documents USING GIN(keywords);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_contact_request ON tasks(contact_request_id);

-- Employee profiles indexes
CREATE INDEX IF NOT EXISTS idx_employee_profiles_user_id ON employee_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_department ON employee_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_manager ON employee_profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_active ON employee_profiles(is_active);

-- Request assignments indexes
CREATE INDEX IF NOT EXISTS idx_request_assignments_request_id ON request_assignments(contact_request_id);
CREATE INDEX IF NOT EXISTS idx_request_assignments_assigned_to ON request_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_request_assignments_active ON request_assignments(is_active);

-- ============================================================================
-- UPDATE ROLE PERMISSIONS FOR NEW TABLES
-- ============================================================================

INSERT INTO role_permissions (role, resource, can_create, can_read, can_update, can_delete, can_export, can_assign, can_approve, scope_restriction) VALUES
-- Admin permissions for new tables
('admin', 'documents', true, true, true, true, true, true, true, 'all'),
('admin', 'tasks', true, true, true, true, true, true, true, 'all'),
('admin', 'departments', true, true, true, true, true, false, false, 'all'),
('admin', 'employee_profiles', true, true, true, true, true, false, false, 'all'),
('admin', 'employee_performance', true, true, true, true, true, false, false, 'all'),
('admin', 'request_assignments', true, true, true, true, true, true, false, 'all'),

-- Employee permissions for new tables
('employee', 'documents', true, true, true, false, true, false, false, 'assigned'),
('employee', 'tasks', true, true, true, false, false, false, false, 'assigned'),
('employee', 'departments', false, true, false, false, false, false, false, 'own'),
('employee', 'employee_profiles', false, true, true, false, false, false, false, 'own'),
('employee', 'employee_performance', false, true, false, false, false, false, false, 'own'),
('employee', 'request_assignments', false, true, true, false, false, false, false, 'own'),

-- Customer permissions for new tables
('customer', 'documents', false, true, false, false, false, false, false, 'own'),
('customer', 'tasks', false, true, false, false, false, false, false, 'own'),
('customer', 'request_assignments', false, true, false, false, false, false, false, 'own')

ON CONFLICT (role, resource) DO NOTHING;

-- ============================================================================
-- INSERT DEFAULT DEPARTMENTS
-- ============================================================================

INSERT INTO departments (name, description, is_active) VALUES
('Customer Service', 'Kundenbetreuung und Support', true),
('Sales', 'Vertrieb und Kundenakquisition', true),
('IT Support', 'Technischer Support und Systemadministration', true),
('Management', 'Geschäftsführung und Administration', true),
('Operations', 'Betrieb und operative Prozesse', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to auto-assign tasks based on request assignments
CREATE OR REPLACE FUNCTION auto_create_task_from_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a task when a request is assigned to an employee
    INSERT INTO tasks (
        title,
        description,
        assigned_to,
        assigned_by,
        contact_request_id,
        priority,
        estimated_hours,
        created_by
    )
    SELECT
        'Bearbeitung: ' || cr.subject,
        'Automatisch erstellte Aufgabe für Anfrage: ' || cr.subject || COALESCE(chr(10) || NEW.notes, ''),
        NEW.assigned_to,
        NEW.assigned_by,
        NEW.contact_request_id,
        NEW.priority,
        NEW.estimated_hours,
        NEW.assigned_by
    FROM contact_requests cr
    WHERE cr.id = NEW.contact_request_id
    AND NEW.is_active = true;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create tasks from assignments
DROP TRIGGER IF EXISTS trigger_auto_create_task_from_assignment ON request_assignments;
CREATE TRIGGER trigger_auto_create_task_from_assignment
    AFTER INSERT ON request_assignments
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_task_from_assignment();

-- Function to track document access
CREATE OR REPLACE FUNCTION log_document_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log document access (this would be called from application logic)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated at triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS documents_updated_at ON documents;
CREATE TRIGGER documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS departments_updated_at ON departments;
CREATE TRIGGER departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS employee_profiles_updated_at ON employee_profiles;
CREATE TRIGGER employee_profiles_updated_at
    BEFORE UPDATE ON employee_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE documents IS 'BSM V2: Document management system with versioning and access control';
COMMENT ON TABLE tasks IS 'BSM V2: Comprehensive task management with time tracking and dependencies';
COMMENT ON TABLE departments IS 'BSM V2: Department organization for employee management';
COMMENT ON TABLE employee_profiles IS 'BSM V2: Extended employee information and management';
COMMENT ON TABLE employee_performance IS 'BSM V2: Employee performance tracking and reviews';
COMMENT ON TABLE request_assignments IS 'BSM V2: Link requests to employees with automatic task creation';