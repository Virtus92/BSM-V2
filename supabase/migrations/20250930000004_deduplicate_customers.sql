-- Deduplicate customers per user_id and rewire references
DO $$
DECLARE
  rec RECORD;
  keep UUID;
  rest UUID[];
  rid UUID;
BEGIN
  FOR rec IN
    SELECT user_id, array_agg(id ORDER BY (assigned_employee_id IS NULL), updated_at DESC) AS ids
    FROM customers
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  LOOP
    keep := rec.ids[1];
    rest := rec.ids[2:array_length(rec.ids,1)];
    IF rest IS NULL THEN CONTINUE; END IF;

    FOREACH rid IN ARRAY rest LOOP
      -- Repoint references
      UPDATE customer_chat_messages SET customer_id = keep WHERE customer_id = rid;
      UPDATE documents SET customer_id = keep WHERE customer_id = rid;
      UPDATE customer_notes SET customer_id = keep WHERE customer_id = rid;
      UPDATE workflow_registry SET customer_id = keep WHERE customer_id = rid;
      UPDATE workflow_executions SET customer_id = keep WHERE customer_id = rid;
      UPDATE customer_automation_settings SET customer_id = keep WHERE customer_id = rid;
      UPDATE contact_requests SET converted_to_customer_id = keep WHERE converted_to_customer_id = rid;

      -- Merge created_at/updated_at (keep the most recent timestamps)
      UPDATE customers k
      SET
        updated_at = GREATEST(k.updated_at, (SELECT c.updated_at FROM customers c WHERE c.id = rid)),
        assigned_employee_id = COALESCE(k.assigned_employee_id, (SELECT c.assigned_employee_id FROM customers c WHERE c.id = rid))
      WHERE k.id = keep;

      -- Remove duplicate row
      DELETE FROM customers WHERE id = rid;
    END LOOP;
  END LOOP;
END $$;

-- Ensure uniqueness going forward
CREATE UNIQUE INDEX IF NOT EXISTS ux_customers_user_id ON customers(user_id) WHERE user_id IS NOT NULL;

