-- Remove overly permissive staff policies on contact_requests to prevent
-- employees from seeing requests assigned to other employees.

DROP POLICY IF EXISTS "employee_contact_requests_select" ON contact_requests;
DROP POLICY IF EXISTS "employee_contact_requests_update" ON contact_requests;

-- Ensure our strict policy is present and last-applied
DO $$
DECLARE
  exists_strict BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND policyname = 'employee_requests_select'
  ) INTO exists_strict;
  IF NOT exists_strict THEN
    RAISE WARNING 'Strict employee_requests_select policy missing; please run the non-recursive policy migration first.';
  END IF;
END $$;

