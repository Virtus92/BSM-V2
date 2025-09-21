-- Fix admin profile to match the correct logged-in user
-- Connect admin profile to info@dinel.at user

DO $$
DECLARE
    correct_user_id UUID;
BEGIN
    -- Get the user ID for info@dinel.at
    SELECT id INTO correct_user_id
    FROM auth.users
    WHERE email = 'info@dinel.at';

    IF correct_user_id IS NOT NULL THEN
        -- Create admin profile for the correct user
        INSERT INTO user_profiles (
            id,
            user_type,
            first_name,
            last_name,
            timezone,
            language,
            notifications_enabled
        ) VALUES (
            correct_user_id,
            'admin',
            'Admin',
            'User',
            'Europe/Berlin',
            'en',
            true
        ) ON CONFLICT (id) DO UPDATE SET
            user_type = 'admin',
            updated_at = NOW();

        RAISE NOTICE 'Admin profile created/updated for info@dinel.at: %', correct_user_id;
    ELSE
        RAISE NOTICE 'User info@dinel.at not found in auth.users';
    END IF;
END $$;

-- Clean up: Remove the old admin profile that doesn't match any user
DELETE FROM user_profiles
WHERE user_type = 'admin'
AND id NOT IN (SELECT id FROM auth.users);

-- Verify the fix
SELECT
    'Corrected admin user:' as status,
    up.id,
    au.email,
    up.user_type,
    up.first_name,
    up.last_name
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.user_type = 'admin';