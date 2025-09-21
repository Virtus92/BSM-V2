-- N8N Workflow Integration Tables
-- Stores local workflow metadata and execution tracking for customer automation dashboard

-- Workflow registry table
CREATE TABLE IF NOT EXISTS workflow_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  n8n_workflow_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT false,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  created_by UUID REFERENCES user_profiles(id),
  category TEXT CHECK (category IN ('customer_automation', 'lead_processing', 'communication', 'reporting', 'integration')),
  tags TEXT[] DEFAULT '{}',
  webhook_url TEXT,
  trigger_type TEXT CHECK (trigger_type IN ('webhook', 'cron', 'manual', 'event')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_execution_at TIMESTAMPTZ,
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0
);

-- Workflow execution logs
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_registry_id UUID REFERENCES workflow_registry(id) ON DELETE CASCADE,
  n8n_execution_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'running', 'waiting', 'canceled')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  customer_id UUID REFERENCES customers(id),
  contact_request_id UUID REFERENCES contact_requests(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer automation preferences
CREATE TABLE IF NOT EXISTS customer_automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
  auto_lead_processing BOOLEAN DEFAULT false,
  auto_email_responses BOOLEAN DEFAULT false,
  auto_slack_notifications BOOLEAN DEFAULT true,
  auto_task_creation BOOLEAN DEFAULT false,
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow templates for easy customer setup
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  n8n_template_data JSONB NOT NULL,
  required_credentials TEXT[] DEFAULT '{}',
  setup_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_registry_customer_id ON workflow_registry(customer_id);
CREATE INDEX IF NOT EXISTS idx_workflow_registry_active ON workflow_registry(active);
CREATE INDEX IF NOT EXISTS idx_workflow_registry_n8n_id ON workflow_registry(n8n_workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_registry_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_automation_customer_id ON customer_automation_settings(customer_id);

-- RLS Policies
ALTER TABLE workflow_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all workflows
CREATE POLICY "Admin can manage all workflows" ON workflow_registry
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Customers can view their own workflows
CREATE POLICY "Customers can view own workflows" ON workflow_registry
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Admin users can manage all executions
CREATE POLICY "Admin can manage all executions" ON workflow_executions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Customers can view their own executions
CREATE POLICY "Customers can view own executions" ON workflow_executions
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Admin users can manage automation settings
CREATE POLICY "Admin can manage automation settings" ON customer_automation_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Customers can manage their own settings
CREATE POLICY "Customers can manage own automation settings" ON customer_automation_settings
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Everyone can view workflow templates
CREATE POLICY "Anyone can view workflow templates" ON workflow_templates
  FOR SELECT USING (is_active = true);

-- Only admins can manage templates
CREATE POLICY "Admin can manage workflow templates" ON workflow_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflow_registry_updated_at
  BEFORE UPDATE ON workflow_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_automation_settings_updated_at
  BEFORE UPDATE ON customer_automation_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at
  BEFORE UPDATE ON workflow_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to sync workflow execution stats
CREATE OR REPLACE FUNCTION sync_workflow_execution_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE workflow_registry
    SET
      total_executions = total_executions + 1,
      successful_executions = CASE
        WHEN NEW.status = 'success' THEN successful_executions + 1
        ELSE successful_executions
      END,
      failed_executions = CASE
        WHEN NEW.status = 'error' THEN failed_executions + 1
        ELSE failed_executions
      END,
      last_execution_at = NEW.started_at
    WHERE id = NEW.workflow_registry_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    UPDATE workflow_registry
    SET
      successful_executions = CASE
        WHEN NEW.status = 'success' AND OLD.status != 'success' THEN successful_executions + 1
        WHEN OLD.status = 'success' AND NEW.status != 'success' THEN successful_executions - 1
        ELSE successful_executions
      END,
      failed_executions = CASE
        WHEN NEW.status = 'error' AND OLD.status != 'error' THEN failed_executions + 1
        WHEN OLD.status = 'error' AND NEW.status != 'error' THEN failed_executions - 1
        ELSE failed_executions
      END
    WHERE id = NEW.workflow_registry_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_workflow_stats_trigger
  AFTER INSERT OR UPDATE ON workflow_executions
  FOR EACH ROW EXECUTE FUNCTION sync_workflow_execution_stats();

-- Sample workflow templates
INSERT INTO workflow_templates (name, description, category, n8n_template_data, required_credentials, setup_instructions) VALUES
(
  'Customer Lead Processing',
  'Automatically process new customer inquiries and create follow-up tasks',
  'customer_automation',
  '{
    "nodes": [
      {"name": "Webhook Trigger", "type": "webhook"},
      {"name": "Create Customer", "type": "supabase"},
      {"name": "Send Welcome Email", "type": "email"},
      {"name": "Create Follow-up Task", "type": "supabase"}
    ]
  }',
  ARRAY['supabase_connection', 'email_smtp'],
  'Configure webhook URL in your contact form and set up email credentials'
),
(
  'Slack Notifications',
  'Send notifications to Slack when important events occur',
  'communication',
  '{
    "nodes": [
      {"name": "Event Trigger", "type": "webhook"},
      {"name": "Format Message", "type": "function"},
      {"name": "Send to Slack", "type": "slack"}
    ]
  }',
  ARRAY['slack_bot_token'],
  'Create Slack app and configure bot token with appropriate permissions'
),
(
  'Weekly Customer Report',
  'Generate and send weekly customer activity reports',
  'reporting',
  '{
    "nodes": [
      {"name": "Schedule Trigger", "type": "cron"},
      {"name": "Fetch Customer Data", "type": "supabase"},
      {"name": "Generate Report", "type": "function"},
      {"name": "Send Email Report", "type": "email"}
    ]
  }',
  ARRAY['supabase_connection', 'email_smtp'],
  'Configure email recipients and customize report template'
)
ON CONFLICT DO NOTHING;