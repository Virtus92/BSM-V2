-- Fix the RLS policy infinite recursion issue
-- This creates a proper admin user without recursion

-- First, disable RLS temporarily to create the admin user
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Create admin user profile for current authenticated user
-- Replace 'your-user-id-here' with your actual user ID from auth.users
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the first user from auth.users (assuming that's you)
    SELECT id INTO current_user_id FROM auth.users ORDER BY created_at LIMIT 1;

    IF current_user_id IS NOT NULL THEN
        -- Insert or update user profile with admin privileges
        INSERT INTO user_profiles (
            id,
            user_type,
            first_name,
            last_name,
            timezone,
            language,
            notifications_enabled
        )
        VALUES (
            current_user_id,
            'admin',
            'Admin',
            'User',
            'Europe/Berlin',
            'en',
            true
        )
        ON CONFLICT (id)
        DO UPDATE SET
            user_type = 'admin',
            updated_at = NOW();

        RAISE NOTICE 'Admin user profile created/updated for user ID: %', current_user_id;
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
END
$$;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify the admin user was created
SELECT
    'Admin user created:' as status,
    id,
    user_type,
    first_name,
    last_name,
    created_at
FROM user_profiles
WHERE user_type = 'admin';
