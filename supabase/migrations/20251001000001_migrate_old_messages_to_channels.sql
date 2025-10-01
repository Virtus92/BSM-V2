-- Migrate old messages (without channel_id) to their respective permanent channels
-- This ensures backward compatibility by assigning existing messages to the correct channel

-- Update messages to use the permanent channel between customer and their assigned employee
UPDATE customer_chat_messages msg
SET channel_id = ch.id
FROM customers c
LEFT JOIN chat_channels ch ON (
  ch.customer_id = c.id
  AND ch.employee_id = c.assigned_employee_id
  AND ch.channel_type = 'permanent'
  AND ch.channel_status = 'active'
)
WHERE msg.customer_id = c.id
  AND msg.channel_id IS NULL  -- Only update messages without channel_id
  AND ch.id IS NOT NULL;  -- Only if permanent channel exists

-- Log migration results
DO $$
DECLARE
  migrated_count INTEGER;
  orphaned_count INTEGER;
BEGIN
  -- Count migrated messages
  SELECT COUNT(*) INTO migrated_count
  FROM customer_chat_messages
  WHERE channel_id IS NOT NULL;

  -- Count orphaned messages (still no channel_id)
  SELECT COUNT(*) INTO orphaned_count
  FROM customer_chat_messages
  WHERE channel_id IS NULL;

  RAISE NOTICE 'Messages migrated to channels: %', migrated_count;
  RAISE NOTICE 'Orphaned messages (no permanent channel): %', orphaned_count;

  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % messages without a channel. These are from customers without assigned employees.', orphaned_count;
  END IF;
END $$;
