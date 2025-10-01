-- Fix infinite recursion in contact_requests RLS by removing
-- cross-table dependency on request_assignments. Instead, rely
-- on contact_requests.assigned_to (kept in sync via triggers).

-- ============================================================================
-- DROP POLICIES THAT REFERENCE request_assignments (CAUSE OF RECURSION)
-- ============================================================================

DROP POLICY IF EXISTS "employee_requests_select" ON contact_requests;
DROP POLICY IF EXISTS "employee_update_requests" ON contact_requests;

-- ============================================================================
-- RECREATE NON-RECURSIVE EMPLOYEE POLICIES USING assigned_to
-- ============================================================================

-- Employees can see unassigned requests or those assigned to them.
-- Admins can see all requests.
CREATE POLICY "employee_requests_select" ON contact_requests
FOR SELECT USING (
  is_admin()
  OR (
    is_employee()
    AND (
      assigned_to IS NULL
      OR assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM customers c
        WHERE c.email = contact_requests.email
        AND c.assigned_employee_id = auth.uid()
      )
    )
  )
);

-- Employees can update unassigned requests or those assigned to them.
-- Admins can update all requests.
CREATE POLICY "employee_update_requests" ON contact_requests
FOR UPDATE USING (
  is_admin()
  OR (
    is_employee()
    AND (
      assigned_to IS NULL
      OR assigned_to = auth.uid()
    )
  )
);

COMMENT ON POLICY "employee_requests_select" ON contact_requests IS
'Employees see unassigned requests and those assigned to them; admins see all. No cross-table refs to avoid RLS recursion.';

COMMENT ON POLICY "employee_update_requests" ON contact_requests IS
'Employees update unassigned/own assigned requests; admins update all. No cross-table refs to avoid RLS recursion.';

-- ============================================================================
-- KEEP contact_requests.assigned_to IN SYNC WITH request_assignments
-- ============================================================================

-- Single trigger function handling INSERT/UPDATE/DELETE on request_assignments
CREATE OR REPLACE FUNCTION sync_contact_request_assignee()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_active THEN
      UPDATE contact_requests
      SET assigned_to = NEW.assigned_to,
          updated_at = NOW()
      WHERE id = NEW.contact_request_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_active AND (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to OR NOT OLD.is_active) THEN
      UPDATE contact_requests
      SET assigned_to = NEW.assigned_to,
          updated_at = NOW()
      WHERE id = NEW.contact_request_id;
    ELSIF NOT NEW.is_active AND OLD.is_active THEN
      -- If no other active assignment remains, clear; otherwise set to latest active assignee
      IF NOT EXISTS (
        SELECT 1 FROM request_assignments ra
        WHERE ra.contact_request_id = NEW.contact_request_id
          AND ra.is_active = true
      ) THEN
        UPDATE contact_requests
        SET assigned_to = NULL,
            updated_at = NOW()
        WHERE id = NEW.contact_request_id;
      ELSE
        UPDATE contact_requests cr
        SET assigned_to = (
          SELECT ra.assigned_to
          FROM request_assignments ra
          WHERE ra.contact_request_id = NEW.contact_request_id
            AND ra.is_active = true
          ORDER BY ra.assigned_at DESC NULLS LAST
          LIMIT 1
        ),
            updated_at = NOW()
        WHERE cr.id = NEW.contact_request_id;
      END IF;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_active THEN
      IF NOT EXISTS (
        SELECT 1 FROM request_assignments ra
        WHERE ra.contact_request_id = OLD.contact_request_id
          AND ra.is_active = true
      ) THEN
        UPDATE contact_requests
        SET assigned_to = NULL,
            updated_at = NOW()
        WHERE id = OLD.contact_request_id;
      ELSE
        UPDATE contact_requests cr
        SET assigned_to = (
          SELECT ra.assigned_to
          FROM request_assignments ra
          WHERE ra.contact_request_id = OLD.contact_request_id
            AND ra.is_active = true
          ORDER BY ra.assigned_at DESC NULLS LAST
          LIMIT 1
        ),
            updated_at = NOW()
        WHERE cr.id = OLD.contact_request_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL; -- should not reach
END;
$$ LANGUAGE plpgsql;

-- Create triggers (idempotent: drop if exist first)
DROP TRIGGER IF EXISTS trg_sync_cr_assignee_ins ON request_assignments;
DROP TRIGGER IF EXISTS trg_sync_cr_assignee_upd ON request_assignments;
DROP TRIGGER IF EXISTS trg_sync_cr_assignee_del ON request_assignments;

CREATE TRIGGER trg_sync_cr_assignee_ins
AFTER INSERT ON request_assignments
FOR EACH ROW EXECUTE FUNCTION sync_contact_request_assignee();

CREATE TRIGGER trg_sync_cr_assignee_upd
AFTER UPDATE ON request_assignments
FOR EACH ROW EXECUTE FUNCTION sync_contact_request_assignee();

CREATE TRIGGER trg_sync_cr_assignee_del
AFTER DELETE ON request_assignments
FOR EACH ROW EXECUTE FUNCTION sync_contact_request_assignee();

COMMENT ON FUNCTION sync_contact_request_assignee() IS
'Keeps contact_requests.assigned_to synchronized with active request_assignments to support non-recursive RLS policies.';

-- ============================================================================
-- OPTIONAL: SANITY CHECK
-- ============================================================================

DO $$
DECLARE
  has_policy BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND policyname = 'employee_requests_select'
  ) INTO has_policy;

  RAISE NOTICE 'contact_requests.employee_requests_select present: %', CASE WHEN has_policy THEN 'YES' ELSE 'NO' END;
END $$;

