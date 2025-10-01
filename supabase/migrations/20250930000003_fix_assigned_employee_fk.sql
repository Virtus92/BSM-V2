-- Align customers.assigned_employee_id FK with application joins
-- The code uses PostgREST embedding: user_profiles!customers_assigned_employee_id_fkey(...)
-- That requires the FK named customers_assigned_employee_id_fkey to reference user_profiles(id),
-- not auth.users(id). We switch the FK to user_profiles(id) safely.

DO $$
BEGIN
  -- Ensure every assigned_employee_id has a corresponding user_profiles row
  INSERT INTO user_profiles (id, user_type, is_active, created_at, updated_at)
  SELECT DISTINCT c.assigned_employee_id, 'employee', true, NOW(), NOW()
  FROM customers c
  LEFT JOIN user_profiles up ON up.id = c.assigned_employee_id
  WHERE c.assigned_employee_id IS NOT NULL AND up.id IS NULL;

  -- Drop old FK if it points to auth.users
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'customers'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name = 'customers_assigned_employee_id_fkey'
      AND ccu.table_name = 'users' -- auth.users
  ) THEN
    ALTER TABLE customers DROP CONSTRAINT customers_assigned_employee_id_fkey;
  END IF;

  -- Create FK to user_profiles(id) with the expected name
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'customers'
      AND constraint_name = 'customers_assigned_employee_id_fkey'
  ) THEN
    ALTER TABLE customers
      ADD CONSTRAINT customers_assigned_employee_id_fkey
      FOREIGN KEY (assigned_employee_id)
      REFERENCES user_profiles(id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- Helpful index (idempotent)
CREATE INDEX IF NOT EXISTS idx_customers_assigned_employee_id ON customers(assigned_employee_id);
