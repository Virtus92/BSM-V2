-- Fix user activation status - activate all user profiles
-- This migration fixes the root cause of account_inactive errors

-- Activate all user profiles that should be active
UPDATE user_profiles
SET
  is_active = true,
  updated_at = NOW()
WHERE
  is_active = false
  OR is_active IS NULL;