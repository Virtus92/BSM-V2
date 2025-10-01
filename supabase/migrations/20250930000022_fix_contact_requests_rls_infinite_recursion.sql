-- Fix 42P17: infinite recursion detected in policy for relation "contact_requests"
-- Root cause: contact_requests policies referenced request_assignments, which has
-- its own policies referencing contact_requests, creating a circular RLS dependency.
--
-- Resolution: Remove cross-table references from contact_requests policies and rely
-- on a denormalized column contact_requests.assigned_to instead. Keep it in sync via triggers.

-- ============================================================================
-- 1) DROP PROBLEMATIC/OLDER POLICIES THAT MAY REFERENCE request_assignments
-- ============================================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND policyname IN (
        'employee_assigned_requests_select',
        'employee_requests_select',
        'employee_update_requests'
      )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s" ON contact_requests;', pol.policyname);
  END LOOP;
END $$;

-- ============================================================================
-- 2) CREATE NON-RECURSIVE EMPLOYEE POLICIES USING assigned_to ONLY
-- ============================================================================

-- Employees: can see unassigned requests or those assigned to them.
-- Admins: can see all.
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

COMMENT ON POLICY "employee_requests_select" ON contact_requests IS
'Employees see unassigned requests and those assigned to them; admins see all. Avoids cross-table refs to prevent RLS recursion.';

-- Employees: can update unassigned requests or those assigned to them.
-- Admins: can update all.
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

COMMENT ON POLICY "employee_update_requests" ON contact_requests IS
'Employees update unassigned/own assigned requests; admins update all. No cross-table refs to avoid RLS recursion.';

-- Ensure helpful index exists (harmless if already created elsewhere)
CREATE INDEX IF NOT EXISTS idx_contact_requests_assigned_to ON contact_requests(assigned_to);

-- ============================================================================
-- 3) KEEP contact_requests.assigned_to IN SYNC WITH request_assignments
-- ============================================================================

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

-- Refresh triggers idempotently
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
-- 4) SANITY CHECK
-- ============================================================================

DO $$
DECLARE
  select_ok BOOLEAN;
  update_ok BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND policyname = 'employee_requests_select'
  ) INTO select_ok;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_requests'
      AND policyname = 'employee_update_requests'
  ) INTO update_ok;

  RAISE NOTICE 'contact_requests.employee_requests_select present: %', CASE WHEN select_ok THEN 'YES' ELSE 'NO' END;
  RAISE NOTICE 'contact_requests.employee_update_requests present: %', CASE WHEN update_ok THEN 'YES' ELSE 'NO' END;
END $$;

