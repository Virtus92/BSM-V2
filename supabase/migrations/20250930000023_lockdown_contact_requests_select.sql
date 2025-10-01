-- Lock down employee SELECT on contact_requests to only:
--  - unassigned (assigned_to IS NULL)
--  - assigned to the current user (assigned_to = auth.uid())
-- No visibility for requests assigned to other employees, regardless of customer relations.

-- Remove previous employee SELECT policies to avoid OR-ing effects
DROP POLICY IF EXISTS "employee_assigned_requests_select" ON contact_requests;
DROP POLICY IF EXISTS "employee_requests_select" ON contact_requests;

-- Recreate strict non-recursive employee SELECT policy
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

COMMENT ON POLICY "employee_requests_select" ON contact_requests IS
'Employees can only see unassigned requests or requests assigned to themselves. Admins can see all. No cross-table references.';

