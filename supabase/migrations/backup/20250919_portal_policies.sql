-- Set default user_type to 'customer' for new profiles
ALTER TABLE user_profiles ALTER COLUMN user_type SET DEFAULT 'customer';

-- RLS: Allow customers to manage their own contact requests
-- Enable RLS (if not already)
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests (created_by must equal auth.uid())
DO $$ BEGIN
  CREATE POLICY contact_requests_insert_own ON contact_requests
    FOR INSERT WITH CHECK (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users can read their own requests
DO $$ BEGIN
  CREATE POLICY contact_requests_select_own ON contact_requests
    FOR SELECT USING (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users can update their own requests until converted
DO $$ BEGIN
  CREATE POLICY contact_requests_update_own ON contact_requests
    FOR UPDATE USING (created_by = auth.uid() AND converted_to_customer_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

