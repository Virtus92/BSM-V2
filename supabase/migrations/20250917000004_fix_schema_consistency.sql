-- Fix Schema Consistency Issues
-- Resolve all schema drift between database and application

-- 1. Ensure customers table has all required columns with correct names
DO $$
BEGIN
    -- Rename company_name to company if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'company_name'
    ) THEN
        ALTER TABLE customers RENAME COLUMN company_name TO company;
    END IF;

    -- Rename contact_person to name if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'contact_person'
    ) THEN
        ALTER TABLE customers RENAME COLUMN contact_person TO name;
    END IF;

    -- Add missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'company'
    ) THEN
        ALTER TABLE customers ADD COLUMN company VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'name'
    ) THEN
        ALTER TABLE customers ADD COLUMN name VARCHAR(255);
    END IF;

    -- Add modern address fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'street'
    ) THEN
        ALTER TABLE customers ADD COLUMN street VARCHAR(255);
    END IF;

    -- Migrate legacy address fields to modern ones
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'address_line1'
    ) THEN
        UPDATE customers SET street = address_line1 WHERE street IS NULL AND address_line1 IS NOT NULL;
    END IF;

    -- Add source column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'source'
    ) THEN
        ALTER TABLE customers ADD COLUMN source VARCHAR(100);
    END IF;

    -- Add tags column as text array
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'tags'
    ) THEN
        ALTER TABLE customers ADD COLUMN tags TEXT[];
    END IF;

    -- Add priority with enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'priority_level'
    ) THEN
        CREATE TYPE priority_level AS ENUM ('low','medium','high','critical');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'priority'
    ) THEN
        ALTER TABLE customers ADD COLUMN priority priority_level DEFAULT 'medium';
    END IF;

    -- Add postal_code if missing (might be named differently)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE customers ADD COLUMN postal_code VARCHAR(20);
    END IF;
END $$;

-- 2. Fix contact_requests table
DO $$
BEGIN
    -- Add ContactRequest status enum if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'contact_request_status'
    ) THEN
        CREATE TYPE contact_request_status AS ENUM ('new', 'in_progress', 'responded', 'converted', 'archived');
    END IF;

    -- Convert status column to enum if it's still text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contact_requests'
        AND column_name = 'status' AND data_type = 'text'
    ) THEN
        -- First, clean up any invalid status values
        UPDATE contact_requests
        SET status = 'new'
        WHERE status NOT IN ('new', 'in_progress', 'responded', 'converted', 'archived');

        -- Convert column to enum
        ALTER TABLE contact_requests
        ALTER COLUMN status TYPE contact_request_status
        USING status::contact_request_status;
    END IF;

    -- Ensure priority column exists and uses enum
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contact_requests' AND column_name = 'priority'
    ) THEN
        ALTER TABLE contact_requests ADD COLUMN priority priority_level DEFAULT 'medium';
    ELSE
        -- Convert to enum if it's text
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'contact_requests'
            AND column_name = 'priority' AND data_type = 'text'
        ) THEN
            -- Clean up invalid values first
            UPDATE contact_requests
            SET priority = 'medium'
            WHERE priority NOT IN ('low', 'medium', 'high', 'critical');

            ALTER TABLE contact_requests
            ALTER COLUMN priority TYPE priority_level
            USING priority::priority_level;
        END IF;
    END IF;
END $$;

-- 3. Update customer_status enum to use 'lead' instead of 'prospect'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'customer_status' AND e.enumlabel = 'prospect'
    ) THEN
        -- First create new enum with correct values
        CREATE TYPE customer_status_new AS ENUM ('lead', 'active', 'inactive', 'archived');

        -- Drop default constraint temporarily
        ALTER TABLE customers ALTER COLUMN status DROP DEFAULT;

        -- Convert column to new enum, mapping 'prospect' -> 'lead'
        ALTER TABLE customers
        ALTER COLUMN status TYPE customer_status_new
        USING CASE
            WHEN status::text = 'prospect' THEN 'lead'::customer_status_new
            ELSE status::text::customer_status_new
        END;

        -- Drop old enum and rename new one
        DROP TYPE customer_status;
        ALTER TYPE customer_status_new RENAME TO customer_status;

        -- Restore default with new value
        ALTER TABLE customers ALTER COLUMN status SET DEFAULT 'lead'::customer_status;
    END IF;
END $$;

-- 4. Ensure all required fields have proper constraints
-- Make name OR company required (at least one must be present)
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_name_or_company_required;
ALTER TABLE customers ADD CONSTRAINT customers_name_or_company_required
    CHECK (
        (name IS NOT NULL AND name != '') OR
        (company IS NOT NULL AND company != '')
    );

-- Email should be unique if provided
DROP INDEX IF EXISTS customers_email_unique;
CREATE UNIQUE INDEX customers_email_unique ON customers(email) WHERE email IS NOT NULL AND email != '';

-- 5. Create updated_at trigger for customers if missing
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- 6. Data consistency fixes
-- Ensure customers have either name or company
UPDATE customers
SET name = company
WHERE (name IS NULL OR name = '') AND (company IS NOT NULL AND company != '');

UPDATE customers
SET company = name
WHERE (company IS NULL OR company = '') AND (name IS NOT NULL AND name != '');

-- Set default priority for existing records
UPDATE customers SET priority = 'medium' WHERE priority IS NULL;
UPDATE contact_requests SET priority = 'medium' WHERE priority IS NULL;