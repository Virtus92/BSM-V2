-- Fix request channel trigger to use correct column name
-- contact_requests has 'converted_to_customer_id' not 'customer_id'

DROP TRIGGER IF EXISTS trigger_auto_create_request_channel ON contact_requests;

-- Updated function to use converted_to_customer_id
CREATE OR REPLACE FUNCTION auto_create_temporary_chat_channel()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_channel_type chat_channel_type;
  v_source_type TEXT;
BEGIN
  -- Determine customer_id and channel type based on table
  IF TG_TABLE_NAME = 'contact_requests' THEN
    v_customer_id := NEW.converted_to_customer_id;  -- FIXED: was NEW.customer_id
    v_channel_type := 'request';
    v_source_type := 'contact_request';
  ELSIF TG_TABLE_NAME = 'tasks' THEN
    -- Tasks need to find customer_id from related request or other source
    -- For now, skip task-based channels (can be added later)
    RETURN NEW;
  END IF;

  -- Only proceed if assigned_to is set and customer_id exists
  IF NEW.assigned_to IS NOT NULL AND v_customer_id IS NOT NULL THEN
    -- Check if temporary channel already exists for this request/task
    IF NOT EXISTS (
      SELECT 1 FROM chat_channels
      WHERE customer_id = v_customer_id
      AND employee_id = NEW.assigned_to
      AND source_type = v_source_type
      AND source_id = NEW.id
      AND channel_status = 'active'
    ) THEN
      -- Create temporary channel
      INSERT INTO chat_channels (
        customer_id,
        employee_id,
        channel_type,
        channel_status,
        source_type,
        source_id
      ) VALUES (
        v_customer_id,
        NEW.assigned_to,
        v_channel_type,
        'active',
        v_source_type,
        NEW.id
      );

      RAISE NOTICE 'Created request channel for request % (customer: %, employee: %)',
        NEW.id, v_customer_id, NEW.assigned_to;
    END IF;
  ELSE
    RAISE NOTICE 'Skipping channel creation for request %: assigned_to=%, customer_id=%',
      NEW.id, NEW.assigned_to, v_customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER trigger_auto_create_request_channel
  AFTER UPDATE OF assigned_to, status ON contact_requests
  FOR EACH ROW
  WHEN (NEW.status = 'in_progress' AND NEW.assigned_to IS NOT NULL)
  EXECUTE FUNCTION auto_create_temporary_chat_channel();

-- Test: Create channels for existing in_progress requests that have converted_to_customer_id
INSERT INTO chat_channels (
  customer_id,
  employee_id,
  channel_type,
  channel_status,
  source_type,
  source_id,
  created_at
)
SELECT
  cr.converted_to_customer_id,
  cr.assigned_to,
  'request'::chat_channel_type,
  'active'::chat_channel_status,
  'contact_request',
  cr.id,
  NOW()
FROM contact_requests cr
WHERE cr.status = 'in_progress'
  AND cr.assigned_to IS NOT NULL
  AND cr.converted_to_customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM chat_channels ch
    WHERE ch.source_type = 'contact_request'
      AND ch.source_id = cr.id
      AND ch.channel_status = 'active'
  );

-- Log results
DO $$
DECLARE
  request_channel_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO request_channel_count
  FROM chat_channels
  WHERE channel_type = 'request' AND channel_status = 'active';

  RAISE NOTICE 'Total active request channels: %', request_channel_count;
END $$;
