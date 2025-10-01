-- Fix infinite recursion in user_profiles RLS policy
-- The previous policy caused recursion when checking customers table

DROP POLICY IF EXISTS "user_own_profile_select" ON user_profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "customers_read_assigned_employee_profile" ON user_profiles;

-- Create two separate policies to avoid recursion
CREATE POLICY "users_read_own_profile" ON user_profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "customers_read_assigned_employee_profile" ON user_profiles
FOR SELECT
USING (
  -- Allow reading employee profiles that are assigned to customers
  -- Use direct check without subquery to avoid recursion
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.assigned_employee_id = user_profiles.id
    AND customers.user_id = auth.uid()
  )
);