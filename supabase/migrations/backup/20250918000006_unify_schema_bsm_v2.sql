-- BSM V2 Schema Unification Migration
-- Goal: Resolve drift between early clean schema and later fixes
-- Canonical model:
--   customers: company_name, contact_person, address_line1/2, city, postal_code, country,
--              status (customer_status enum with 'prospect' | 'active' | 'inactive' | 'archived'),
--              tags text[], notes text (optional)
--   contact_requests: status as text with CHECK, priority as text with CHECK

-- 1) Customers: merge/rename columns to canonical names
DO $$
BEGIN
  -- company_name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='company'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='company_name'
  ) THEN
    ALTER TABLE customers RENAME COLUMN company TO company_name;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='company'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='company_name'
  ) THEN
    UPDATE customers SET company_name = COALESCE(company_name, company) WHERE company IS NOT NULL;
    ALTER TABLE customers DROP COLUMN company;
  END IF;

  -- contact_person
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='contact_person'
  ) THEN
    ALTER TABLE customers RENAME COLUMN name TO contact_person;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='contact_person'
  ) THEN
    UPDATE customers SET contact_person = COALESCE(contact_person, name) WHERE name IS NOT NULL;
    ALTER TABLE customers DROP COLUMN name;
  END IF;

  -- street -> address_line1
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='street'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='address_line1'
  ) THEN
    UPDATE customers SET address_line1 = COALESCE(address_line1, street) WHERE street IS NOT NULL;
    ALTER TABLE customers DROP COLUMN street;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='street'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='address_line1'
  ) THEN
    ALTER TABLE customers RENAME COLUMN street TO address_line1;
  END IF;

  -- remove columns not in canonical schema
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='priority'
  ) THEN
    ALTER TABLE customers DROP COLUMN priority;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='source'
  ) THEN
    ALTER TABLE customers DROP COLUMN source;
  END IF;
END $$;

-- 2) Ensure tags column exists (canonical)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 3) Customer status enum: normalize label to 'prospect'
DO $$
DECLARE
  has_lead boolean;
  has_prospect boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_status') THEN
    SELECT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid
      WHERE t.typname='customer_status' AND e.enumlabel='lead'
    ) INTO has_lead;

    SELECT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid
      WHERE t.typname='customer_status' AND e.enumlabel='prospect'
    ) INTO has_prospect;

    -- Prefer rename if only 'lead' exists; otherwise fall back to updating rows
    IF has_lead AND NOT has_prospect THEN
      ALTER TYPE customer_status RENAME VALUE 'lead' TO 'prospect';
    ELSIF has_lead AND has_prospect THEN
      UPDATE customers SET status = 'prospect'::customer_status WHERE status = 'lead'::customer_status;
    END IF;
  END IF;
END $$;

-- 4) Contact requests status: use TEXT with CHECK (matches generated types)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contact_requests' AND column_name='status' AND udt_name='contact_request_status'
  ) THEN
    ALTER TABLE contact_requests
    ALTER COLUMN status TYPE TEXT USING status::text;
    -- Drop enum if no longer used
    PERFORM 1 FROM pg_type WHERE typname='contact_request_status';
    -- Attempt drop (will fail if still referenced elsewhere)
    BEGIN
      DROP TYPE contact_request_status;
    EXCEPTION WHEN dependent_objects_still_exist THEN
      -- ignore if used elsewhere
      NULL;
    END;
  END IF;

  -- Ensure CHECK constraint exists
  ALTER TABLE contact_requests DROP CONSTRAINT IF EXISTS contact_requests_status_check;
  ALTER TABLE contact_requests
    ADD CONSTRAINT contact_requests_status_check
    CHECK (status IN ('new','in_progress','responded','converted','archived'));
END $$;

-- 5) Recreate search index on canonical columns
DROP INDEX IF EXISTS idx_customers_search;
CREATE INDEX IF NOT EXISTS idx_customers_search
  ON customers USING gin(to_tsvector('german', coalesce(company_name,'') || ' ' || coalesce(contact_person,'')));

