-- Simple Schema Fix - Clean Implementation
-- Fix all schema inconsistencies without complex nested SQL

-- 1. Fix customer table columns
-- Rename company_name to company
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='company_name') THEN
        ALTER TABLE customers RENAME COLUMN company_name TO company;
    END IF;
END $$;

-- Rename contact_person to name
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='contact_person') THEN
        ALTER TABLE customers RENAME COLUMN contact_person TO name;
    END IF;
END $$;

-- 2. Add missing columns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS street VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS source VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 3. Create priority enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
        CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;
END $$;

-- Add priority column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS priority priority_level DEFAULT 'medium';

-- 4. Fix customer status enum
-- Skip if enum was already converted by previous migration
DO $$
BEGIN
    -- Only run if we still have the old enum with 'prospect'
    IF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'customer_status' AND e.enumlabel = 'prospect'
    ) THEN
        -- Update prospect to lead
        UPDATE customers SET status = 'lead' WHERE status = 'prospect';

        -- Create temp column
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS status_temp TEXT;

        -- Copy current values
        UPDATE customers SET status_temp = status::TEXT;

        -- Drop old column
        ALTER TABLE customers DROP COLUMN IF EXISTS status;

        -- Drop old enum
        DROP TYPE IF EXISTS customer_status;

        -- Create new enum
        CREATE TYPE customer_status AS ENUM ('lead', 'active', 'inactive', 'archived');

        -- Add new column
        ALTER TABLE customers ADD COLUMN status customer_status DEFAULT 'lead';

        -- Restore values
        UPDATE customers SET status =
            CASE
                WHEN status_temp = 'prospect' THEN 'lead'::customer_status
                WHEN status_temp = 'active' THEN 'active'::customer_status
                WHEN status_temp = 'inactive' THEN 'inactive'::customer_status
                WHEN status_temp = 'archived' THEN 'archived'::customer_status
                ELSE 'lead'::customer_status
            END;

        -- Drop temp column
        ALTER TABLE customers DROP COLUMN status_temp;
    END IF;
END $$;

-- 5. Fix contact_requests
-- Create contact request status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_request_status') THEN
        CREATE TYPE contact_request_status AS ENUM ('new', 'in_progress', 'responded', 'converted', 'archived');
    END IF;
END $$;

-- Convert status to enum if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='contact_requests' AND column_name='status' AND data_type='text'
    ) THEN
        -- Add temp column
        ALTER TABLE contact_requests ADD COLUMN status_temp TEXT;
        UPDATE contact_requests SET status_temp = status;

        -- Drop old column
        ALTER TABLE contact_requests DROP COLUMN status;

        -- Add new enum column
        ALTER TABLE contact_requests ADD COLUMN status contact_request_status DEFAULT 'new';

        -- Restore values
        UPDATE contact_requests SET status =
            CASE
                WHEN status_temp = 'new' THEN 'new'::contact_request_status
                WHEN status_temp = 'in_progress' THEN 'in_progress'::contact_request_status
                WHEN status_temp = 'responded' THEN 'responded'::contact_request_status
                WHEN status_temp = 'converted' THEN 'converted'::contact_request_status
                WHEN status_temp = 'archived' THEN 'archived'::contact_request_status
                ELSE 'new'::contact_request_status
            END;

        -- Drop temp column
        ALTER TABLE contact_requests DROP COLUMN status_temp;
    END IF;
END $$;

-- Add priority to contact_requests if missing
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS priority priority_level DEFAULT 'medium';

-- 6. Data consistency
-- Ensure customers have name or company
UPDATE customers SET name = company WHERE (name IS NULL OR name = '') AND company IS NOT NULL;
UPDATE customers SET company = name WHERE (company IS NULL OR company = '') AND name IS NOT NULL;

-- Set default values
UPDATE customers SET priority = 'medium' WHERE priority IS NULL;
UPDATE contact_requests SET priority = 'medium' WHERE priority IS NULL;

-- 7. Add constraints
-- Name or company required
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_name_or_company_check;
ALTER TABLE customers ADD CONSTRAINT customers_name_or_company_check
    CHECK ((name IS NOT NULL AND name != '') OR (company IS NOT NULL AND company != ''));

-- Unique email
DROP INDEX IF EXISTS customers_email_unique;
CREATE UNIQUE INDEX customers_email_unique ON customers(email) WHERE email IS NOT NULL AND email != '';