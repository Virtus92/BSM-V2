-- Fix circular dependency in helper functions
-- Helper functions need to access user_profiles directly without RLS to avoid circular dependency

-- Create new helper functions that bypass RLS using SECURITY DEFINER
-- These will not have circular dependencies

-- Create a direct role check function that bypasses RLS
CREATE OR REPLACE FUNCTION get_user_role_direct()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Return null if no user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    -- Use SECURITY DEFINER to bypass RLS and access user_profiles directly
    SELECT user_type INTO user_role
    FROM public.user_profiles
    WHERE id = auth.uid() AND is_active = true;

    -- Return the role or default to customer
    RETURN COALESCE(user_role, 'customer');
END;
$$;

-- Create direct admin check function
CREATE OR REPLACE FUNCTION is_admin_direct()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN get_user_role_direct() = 'admin';
END;
$$;

-- Create direct staff check function
CREATE OR REPLACE FUNCTION is_staff_direct()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN get_user_role_direct() IN ('admin', 'employee');
END;
$$;

-- Update the user_profiles policy to use the new direct functions
DROP POLICY IF EXISTS "users_can_see_relevant_profiles" ON user_profiles;

CREATE POLICY "users_can_see_relevant_profiles_fixed" ON user_profiles
FOR SELECT USING (
    -- Users can always see their own profile
    id = auth.uid()
    -- Admins can see all profiles (using direct function)
    OR is_admin_direct()
    -- Employees can see profiles of their assigned customers
    OR (
        is_staff_direct()
        AND id IN (
            SELECT c.user_id FROM customers c
            WHERE c.assigned_employee_id = auth.uid()
        )
    )
);

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role_direct() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_direct() TO authenticated;
GRANT EXECUTE ON FUNCTION is_staff_direct() TO authenticated;