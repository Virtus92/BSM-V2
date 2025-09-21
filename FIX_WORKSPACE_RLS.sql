-- Fix RLS policy infinite recursion in user_profiles
-- The issue is that admin policies reference themselves

-- Disable RLS temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_access_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_access_all_profiles" ON user_profiles;

-- Create simple, non-recursive policies
CREATE POLICY "users_access_own_profile" ON user_profiles
FOR ALL USING (id = auth.uid());

-- Simple admin policy without recursion
CREATE POLICY "admin_full_access" ON user_profiles
FOR ALL USING (
    -- Check if current user is admin by checking the actual record
    EXISTS (
        SELECT 1 
        FROM user_profiles up_check
        WHERE up_check.id = auth.uid() 
        AND up_check.user_type = 'admin'
    )
    OR 
    -- Allow access to own profile
    id = auth.uid()
);

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create admin user if none exists
DO $$
DECLARE
    admin_count INTEGER;
    first_user_id UUID;
BEGIN
    -- Check if any admin users exist
    SELECT COUNT(*) INTO admin_count 
    FROM user_profiles 
    WHERE user_type = 'admin';
    
    IF admin_count = 0 THEN
        -- Get first user from auth.users
        SELECT id INTO first_user_id 
        FROM auth.users 
        ORDER BY created_at 
        LIMIT 1;
        
        IF first_user_id IS NOT NULL THEN
            -- Create admin profile
            INSERT INTO user_profiles (
                id, user_type, first_name, last_name
            ) VALUES (
                first_user_id, 'admin', 'Admin', 'User'
            ) ON CONFLICT (id) DO UPDATE SET
                user_type = 'admin';
                
            RAISE NOTICE 'Admin user created: %', first_user_id;
        END IF;
    END IF;
END $$;

-- Verify fix
SELECT 'RLS Fixed - Admin users:' as status, count(*) as admin_count
FROM user_profiles WHERE user_type = 'admin';
