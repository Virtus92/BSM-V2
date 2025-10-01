-- Backfill and enforce contact_requests.assigned_to based on request_assignments
-- and ensure non-recursive RLS policies produce correct visibility for employees.

-- 1) Ensure triggers exist to keep assigned_to in sync going forward
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

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

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

-- 2) Backfill current assigned_to values from latest active assignment
WITH latest AS (
  SELECT DISTINCT ON (contact_request_id)
         contact_request_id,
         assigned_to
  FROM request_assignments
  WHERE is_active = true
  ORDER BY contact_request_id, assigned_at DESC NULLS LAST, created_at DESC
)
UPDATE contact_requests cr
SET assigned_to = l.assigned_to,
    updated_at = NOW()
FROM latest l
WHERE cr.id = l.contact_request_id
  AND (cr.assigned_to IS DISTINCT FROM l.assigned_to);

-- Clear assigned_to where no active assignment exists
UPDATE contact_requests cr
SET assigned_to = NULL,
    updated_at = NOW()
WHERE cr.assigned_to IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM request_assignments ra
    WHERE ra.contact_request_id = cr.id
      AND ra.is_active = true
  );

-- 3) Ensure SELECT policy is strict (employees see only unassigned or own)
DROP POLICY IF EXISTS "employee_contact_requests_select" ON contact_requests;
DROP POLICY IF EXISTS "employee_assigned_requests_select" ON contact_requests;
DROP POLICY IF EXISTS "employee_requests_select" ON contact_requests;

CREATE POLICY "employee_requests_select" ON contact_requests
FOR SELECT USING (
  is_admin()
  OR (
    is_employee()
    AND (
      assigned_to IS NULL
      OR assigned_to = auth.uid()
    )
  )
);

-- 4) Verify
DO $$
DECLARE r RECORD; BEGIN
  RAISE NOTICE 'contact_requests SELECT policies:';
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='contact_requests' AND cmd='SELECT'
    ORDER BY policyname
  ) LOOP
    RAISE NOTICE ' - %', r.policyname;
  END LOOP;
END $$;

