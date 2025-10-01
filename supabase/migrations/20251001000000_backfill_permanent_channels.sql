-- Backfill permanent channels for existing customer-employee assignments
-- This creates permanent channels for all customers who already have an assigned employee
-- but don't yet have a permanent channel

-- Create permanent channels for all existing assignments
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
  c.id AS customer_id,
  c.assigned_employee_id AS employee_id,
  'permanent'::chat_channel_type AS channel_type,
  'active'::chat_channel_status AS channel_status,
  NULL AS source_type,
  NULL AS source_id,
  NOW() AS created_at
FROM customers c
WHERE c.assigned_employee_id IS NOT NULL
  -- Only create if permanent channel doesn't already exist
  AND NOT EXISTS (
    SELECT 1 FROM chat_channels ch
    WHERE ch.customer_id = c.id
      AND ch.employee_id = c.assigned_employee_id
      AND ch.channel_type = 'permanent'
      AND ch.channel_status = 'active'
  );

-- Log the number of channels created
DO $$
DECLARE
  channel_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO channel_count
  FROM chat_channels
  WHERE channel_type = 'permanent';

  RAISE NOTICE 'Total permanent channels after backfill: %', channel_count;
END $$;
