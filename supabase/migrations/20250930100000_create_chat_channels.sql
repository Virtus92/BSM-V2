-- Chat Channel System for Temporary and Permanent Chat Connections
-- Enables context-based chat (permanent assignment, request-based, task-based)

-- Chat channel types enum
CREATE TYPE chat_channel_type AS ENUM ('permanent', 'request', 'task');
CREATE TYPE chat_channel_status AS ENUM ('active', 'closed');

-- Chat Channels Table
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Channel metadata
  channel_type chat_channel_type NOT NULL DEFAULT 'permanent',
  channel_status chat_channel_status NOT NULL DEFAULT 'active',

  -- Source context (for temporary channels)
  source_type TEXT, -- 'contact_request' or 'task'
  source_id UUID, -- ID of the request or task

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT unique_active_channel UNIQUE (customer_id, employee_id, channel_type, source_id),
  CONSTRAINT source_required_for_temporary CHECK (
    (channel_type = 'permanent' AND source_id IS NULL) OR
    (channel_type IN ('request', 'task') AND source_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_chat_channels_customer ON chat_channels(customer_id);
CREATE INDEX idx_chat_channels_employee ON chat_channels(employee_id);
CREATE INDEX idx_chat_channels_status ON chat_channels(channel_status);
CREATE INDEX idx_chat_channels_source ON chat_channels(source_type, source_id);
CREATE INDEX idx_chat_channels_active ON chat_channels(customer_id, employee_id) WHERE channel_status = 'active';

-- Add channel_id to customer_chat_messages (keeping customer_id for backward compatibility)
ALTER TABLE customer_chat_messages
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE;

-- Index for channel-based message queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON customer_chat_messages(channel_id, created_at DESC);

-- RLS Policies for chat_channels
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;

-- Admins can see all channels
CREATE POLICY "Admins can view all chat channels"
  ON chat_channels
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Employees can see channels they are part of
CREATE POLICY "Employees can view their chat channels"
  ON chat_channels
  FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Customers can see their own channels
CREATE POLICY "Customers can view their chat channels"
  ON chat_channels
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = chat_channels.customer_id
      AND customers.user_id = auth.uid()
    )
  );

-- Only employees and admins can create channels
CREATE POLICY "Employees and admins can create chat channels"
  ON chat_channels
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('employee', 'admin')
    )
  );

-- Only employees and admins can close channels
CREATE POLICY "Employees and admins can update chat channels"
  ON chat_channels
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('employee', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('employee', 'admin')
    )
  );

-- Update RLS for customer_chat_messages to work with channels
DROP POLICY IF EXISTS "Users can read messages" ON customer_chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON customer_chat_messages;

-- New RLS: Employees can read messages from their active channels
CREATE POLICY "Employees can read channel messages"
  ON customer_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    -- Employee is part of an active channel
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = customer_chat_messages.channel_id
      AND chat_channels.employee_id = auth.uid()
      AND chat_channels.channel_status = 'active'
    )
    -- OR employee is assigned to the customer permanently
    OR EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_chat_messages.customer_id
      AND customers.assigned_employee_id = auth.uid()
    )
    -- OR user is admin
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Customers can read messages from their channels
CREATE POLICY "Customers can read their channel messages"
  ON customer_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = customer_chat_messages.channel_id
      AND EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = chat_channels.customer_id
        AND customers.user_id = auth.uid()
      )
    )
    -- Backward compatibility: customer_id based access
    OR EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_chat_messages.customer_id
      AND customers.user_id = auth.uid()
    )
  );

-- Users can send messages to their active channels
CREATE POLICY "Users can send channel messages"
  ON customer_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Employee sending to their active channel
    (
      EXISTS (
        SELECT 1 FROM chat_channels
        WHERE chat_channels.id = customer_chat_messages.channel_id
        AND chat_channels.employee_id = auth.uid()
        AND chat_channels.channel_status = 'active'
      )
      AND sender_id = auth.uid()
      AND is_from_customer = false
    )
    -- OR customer sending to their channel
    OR (
      EXISTS (
        SELECT 1 FROM chat_channels
        WHERE chat_channels.id = customer_chat_messages.channel_id
        AND EXISTS (
          SELECT 1 FROM customers
          WHERE customers.id = chat_channels.customer_id
          AND customers.user_id = auth.uid()
        )
      )
      AND sender_id = auth.uid()
      AND is_from_customer = true
    )
    -- OR admin
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Function: Auto-create permanent channel when customer is assigned
CREATE OR REPLACE FUNCTION auto_create_permanent_chat_channel()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if assigned_employee_id is set and not null
  IF NEW.assigned_employee_id IS NOT NULL THEN
    -- Check if permanent channel already exists
    IF NOT EXISTS (
      SELECT 1 FROM chat_channels
      WHERE customer_id = NEW.id
      AND employee_id = NEW.assigned_employee_id
      AND channel_type = 'permanent'
      AND channel_status = 'active'
    ) THEN
      -- Create permanent channel
      INSERT INTO chat_channels (
        customer_id,
        employee_id,
        channel_type,
        channel_status,
        source_type,
        source_id
      ) VALUES (
        NEW.id,
        NEW.assigned_employee_id,
        'permanent',
        'active',
        NULL,
        NULL
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for permanent channel creation
DROP TRIGGER IF EXISTS trigger_auto_create_permanent_channel ON customers;
CREATE TRIGGER trigger_auto_create_permanent_channel
  AFTER INSERT OR UPDATE OF assigned_employee_id ON customers
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_permanent_chat_channel();

-- Function: Auto-create temporary channel when request/task is assigned
CREATE OR REPLACE FUNCTION auto_create_temporary_chat_channel()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_channel_type chat_channel_type;
  v_source_type TEXT;
BEGIN
  -- Determine customer_id and channel type based on table
  IF TG_TABLE_NAME = 'contact_requests' THEN
    v_customer_id := NEW.customer_id;
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
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for request-based temporary channels
DROP TRIGGER IF EXISTS trigger_auto_create_request_channel ON contact_requests;
CREATE TRIGGER trigger_auto_create_request_channel
  AFTER UPDATE OF assigned_to, status ON contact_requests
  FOR EACH ROW
  WHEN (NEW.status = 'in_progress' AND NEW.assigned_to IS NOT NULL)
  EXECUTE FUNCTION auto_create_temporary_chat_channel();

-- Function: Auto-close temporary channel when request/task is completed
CREATE OR REPLACE FUNCTION auto_close_temporary_chat_channel()
RETURNS TRIGGER AS $$
DECLARE
  v_source_type TEXT;
BEGIN
  -- Determine source type based on table
  IF TG_TABLE_NAME = 'contact_requests' THEN
    v_source_type := 'contact_request';
  ELSIF TG_TABLE_NAME = 'tasks' THEN
    v_source_type := 'task';
  ELSE
    RETURN NEW;
  END IF;

  -- Close active temporary channels for this request/task
  UPDATE chat_channels
  SET
    channel_status = 'closed',
    closed_at = NOW()
  WHERE
    source_type = v_source_type
    AND source_id = NEW.id
    AND channel_status = 'active'
    AND channel_type != 'permanent'; -- Never close permanent channels

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for closing channels when request is completed
DROP TRIGGER IF EXISTS trigger_auto_close_request_channel ON contact_requests;
CREATE TRIGGER trigger_auto_close_request_channel
  AFTER UPDATE OF status ON contact_requests
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'responded', 'closed'))
  EXECUTE FUNCTION auto_close_temporary_chat_channel();

-- Trigger for closing channels when task is completed
DROP TRIGGER IF EXISTS trigger_auto_close_task_channel ON tasks;
CREATE TRIGGER trigger_auto_close_task_channel
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  WHEN (NEW.status IN ('done', 'completed'))
  EXECUTE FUNCTION auto_close_temporary_chat_channel();

-- Comment the tables
COMMENT ON TABLE chat_channels IS 'Chat channels for permanent and temporary customer-employee connections';
COMMENT ON COLUMN chat_channels.channel_type IS 'Type of channel: permanent (assigned), request (temporary), task (temporary)';
COMMENT ON COLUMN chat_channels.channel_status IS 'Channel status: active or closed';
COMMENT ON COLUMN chat_channels.source_id IS 'ID of the source request or task for temporary channels';
