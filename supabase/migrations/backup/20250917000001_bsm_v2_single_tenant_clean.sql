-- BSM V2 Single-Tenant Clean Migration
-- Created: 2024-09-17
-- Purpose: Single-tenant BSM V2 with Customer-User linking

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE customer_status AS ENUM ('prospect', 'active', 'inactive', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Customers (CRM with optional user account linking)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Basic Information
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255) UNIQUE, -- Unique for user account creation
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
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Contact Requests (Lead generation)
CREATE TABLE contact_requests (
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
CREATE TABLE contact_request_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_request_id UUID NOT NULL REFERENCES contact_requests(id) ON DELETE CASCADE,

    -- Note Content
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- User Profiles (Extended user information)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Profile Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    phone VARCHAR(50),

    -- User Type
    user_type VARCHAR(20) DEFAULT 'admin' CHECK (user_type IN ('admin', 'customer')),

    -- Preferences
    timezone VARCHAR(100) DEFAULT 'Europe/Berlin',
    language VARCHAR(10) DEFAULT 'de',
    notifications_enabled BOOLEAN DEFAULT true,

    -- Metadata
    last_seen_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Customer indexes
CREATE INDEX idx_customers_email ON customers(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_status ON customers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_user_id ON customers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_customers_search ON customers USING gin(to_tsvector('german', company_name || ' ' || COALESCE(contact_person, '')));

-- Contact request indexes
CREATE INDEX idx_contact_requests_status ON contact_requests(status);
CREATE INDEX idx_contact_requests_email ON contact_requests(email);
CREATE INDEX idx_contact_requests_created_at ON contact_requests(created_at);
CREATE INDEX idx_contact_requests_assigned_to ON contact_requests(assigned_to);

-- Contact request notes indexes
CREATE INDEX idx_contact_request_notes_request_id ON contact_request_notes(contact_request_id);
CREATE INDEX idx_contact_request_notes_created_at ON contact_request_notes(created_at);

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX idx_user_profiles_last_seen ON user_profiles(last_seen_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_request_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Admin users can access everything
CREATE POLICY "admin_access_customers" ON customers
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'admin'
    )
);

CREATE POLICY "admin_access_contact_requests" ON contact_requests
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'admin'
    )
);

CREATE POLICY "admin_access_contact_request_notes" ON contact_request_notes
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'admin'
    )
);

-- Customers can only see their own data
CREATE POLICY "customer_access_own_data" ON customers
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "customer_update_own_data" ON customers
FOR UPDATE USING (user_id = auth.uid());

-- User profiles policies
CREATE POLICY "users_access_own_profile" ON user_profiles
FOR ALL USING (id = auth.uid());

CREATE POLICY "admin_access_all_profiles" ON user_profiles
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.user_type = 'admin'
    )
);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
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
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_contact_requests_updated_at BEFORE UPDATE ON contact_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

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
        notes,
        created_by
    ) VALUES (
        COALESCE(request_record.company, request_record.name),
        request_record.name,
        request_record.email,
        request_record.phone,
        'prospect',
        'Erstellt aus Kontaktanfrage: ' || request_record.subject,
        auth.uid()
    ) RETURNING id INTO customer_id;

    -- Create user account if requested
    IF create_user_account THEN
        -- This would typically be handled by your application layer
        -- using Supabase Admin API to create users with email invitations
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
-- INITIAL DATA
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
);

-- Add comments for documentation
COMMENT ON TABLE customers IS 'BSM V2: Customer management with optional user account linking';
COMMENT ON TABLE contact_requests IS 'BSM V2: Contact form submissions and lead generation';
COMMENT ON TABLE contact_request_notes IS 'BSM V2: Notes and comments on contact requests';
COMMENT ON TABLE user_profiles IS 'BSM V2: Extended user profile information';
COMMENT ON FUNCTION create_customer_from_request IS 'BSM V2: Convert contact request to customer with optional user account';