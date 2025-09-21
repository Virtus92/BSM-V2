-- Create admin user profile for current authenticated user
-- This fixes the 403 error when accessing the contact API

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
SELECT
    auth.uid(),
    'admin',
    'Admin',
    'User',
    'Europe/Berlin',
    'en',
    true
WHERE auth.uid() IS NOT NULL
ON CONFLICT (id)
DO UPDATE SET
    user_type = 'admin',
    updated_at = NOW();

-- Verify the user profile was created/updated
SELECT
    id,
    user_type,
    first_name,
    last_name,
    created_at,
    updated_at
FROM user_profiles
WHERE id = auth.uid();