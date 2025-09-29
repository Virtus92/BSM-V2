-- Fix circular RLS dependency in user_profiles policy
-- The policy was trying to check user_profiles to allow access to user_profiles

-- Drop the problematic policy
DROP POLICY IF EXISTS "employee_relevant_profiles_select" ON user_profiles;

-- Create a corrected policy using helper functions to avoid circular dependency
CREATE POLICY "users_can_see_relevant_profiles" ON user_profiles
FOR SELECT USING (
    -- Users can always see their own profile
    id = auth.uid()
    -- Admins can see all profiles (using helper function)
    OR is_admin()
    -- Employees can see profiles of their assigned customers
    OR (
        is_staff()
        AND id IN (
            SELECT c.user_id FROM customers c
            WHERE c.assigned_employee_id = auth.uid()
        )
    )
);