-- Create admin user safely without touching RLS policies
-- This creates an admin user for the first authenticated user

DO $$
DECLARE
    first_user_id UUID;
    existing_admin_count INTEGER;
BEGIN
    -- Check if any admin already exists
    SELECT COUNT(*) INTO existing_admin_count
    FROM user_profiles
    WHERE user_type = 'admin';

    -- Only create admin if none exists (single-tenant setup)
    IF existing_admin_count = 0 THEN
        -- Get first user from auth.users
        SELECT id INTO first_user_id
        FROM auth.users
        ORDER BY created_at
        LIMIT 1;

        IF first_user_id IS NOT NULL THEN
            -- Create admin profile (will work because service role bypasses RLS)
            INSERT INTO user_profiles (
                id,
                user_type,
                first_name,
                last_name,
                timezone,
                language
            ) VALUES (
                first_user_id,
                'admin',
                'Admin',
                'User',
                'Europe/Berlin',
                'en'
            ) ON CONFLICT (id) DO UPDATE SET
                user_type = 'admin',
                updated_at = NOW();

            RAISE NOTICE 'Admin user created for: %', first_user_id;
        ELSE
            RAISE NOTICE 'No users found in auth.users';
        END IF;
    ELSE
        RAISE NOTICE 'Admin user already exists, skipping creation';
    END IF;
END $$;

-- Verify admin user exists
SELECT
    'Admin users:' as status,
    id,
    user_type,
    first_name,
    last_name,
    created_at
FROM user_profiles
WHERE user_type = 'admin';