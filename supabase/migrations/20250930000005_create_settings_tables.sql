-- Settings System Tables
-- Clean architecture with proper validation and structure

-- 1. System Settings (global configuration)
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL CHECK (category IN ('general', 'automation', 'display', 'landing', 'legal', 'integrations')),
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
  is_public BOOLEAN DEFAULT false, -- if setting can be accessed by non-admin users
  description TEXT,
  validation_schema JSONB, -- JSON schema for validation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(category, key)
);

-- 2. User Profile Settings (per-user preferences)
CREATE TABLE IF NOT EXISTS user_profile_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('display', 'notifications', 'workspace', 'privacy')),
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, key)
);

-- 3. Third-party Integrations
CREATE TABLE IF NOT EXISTS third_party_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'facebook', 'google', 'linkedin', etc.
  display_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}', -- API keys, settings, etc.
  oauth_config JSONB DEFAULT '{}', -- OAuth configuration
  webhook_url TEXT,
  webhook_secret TEXT,
  rate_limit_per_minute INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 4. Legal Documents (GDPR, Privacy Policy, etc.)
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('privacy_policy', 'terms_of_service', 'cookie_policy', 'imprint', 'gdpr_notice')),
  language_code VARCHAR(5) DEFAULT 'de', -- 'de', 'en', etc.
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  is_active BOOLEAN DEFAULT false,
  effective_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(type, language_code, version)
);

-- 5. Landing Page Configuration
CREATE TABLE IF NOT EXISTS landing_page_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR(50) NOT NULL, -- 'hero', 'features', 'pricing', 'contact', etc.
  component_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'cta_button', 'form', etc.
  position INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}', -- component-specific configuration
  content JSONB DEFAULT '{}', -- multilingual content
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(section, position)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_user_profile_settings_user ON user_profile_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_enabled ON third_party_integrations(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_legal_docs_active ON legal_documents(type, language_code, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_landing_config_section ON landing_page_config(section, position);

-- RLS Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_config ENABLE ROW LEVEL SECURITY;

-- System Settings: Admins can read/write, public settings readable by all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_settings' AND policyname = 'Admins can manage system settings'
  ) THEN
    CREATE POLICY "Admins can manage system settings" ON system_settings
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.user_type = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_settings' AND policyname = 'Public settings readable by authenticated users'
  ) THEN
    CREATE POLICY "Public settings readable by authenticated users" ON system_settings
      FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');
  END IF;
END $$;

-- User Profile Settings: Users can only manage their own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profile_settings' AND policyname = 'Users can manage own profile settings'
  ) THEN
    CREATE POLICY "Users can manage own profile settings" ON user_profile_settings
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Third-party Integrations: Admin only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'third_party_integrations' AND policyname = 'Admins can manage integrations'
  ) THEN
    CREATE POLICY "Admins can manage integrations" ON third_party_integrations
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.user_type = 'admin'
        )
      );
  END IF;
END $$;

-- Legal Documents: Admins can manage, all can read active ones
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'legal_documents' AND policyname = 'Admins can manage legal documents'
  ) THEN
    CREATE POLICY "Admins can manage legal documents" ON legal_documents
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.user_type = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'legal_documents' AND policyname = 'Active legal documents readable by all'
  ) THEN
    CREATE POLICY "Active legal documents readable by all" ON legal_documents
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- Landing Page Config: Admin only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'landing_page_config' AND policyname = 'Admins can manage landing page'
  ) THEN
    CREATE POLICY "Admins can manage landing page" ON landing_page_config
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.user_type = 'admin'
        )
      );
  END IF;
END $$;

-- Insert default system settings
INSERT INTO system_settings (category, key, value, data_type, is_public, description) VALUES
-- General Settings
('general', 'site_name', '"BSM V2"', 'string', true, 'Website name displayed in header and titles'),
('general', 'site_description', '"Business Service Management Platform"', 'string', true, 'Site description for SEO'),
('general', 'contact_email', '"info@bsm-v2.com"', 'string', true, 'Main contact email address'),
('general', 'support_email', '"support@bsm-v2.com"', 'string', true, 'Support email address'),
('general', 'company_name', '"BSM Solutions GmbH"', 'string', true, 'Legal company name'),

-- Display Settings
('display', 'default_theme', '"dark"', 'string', true, 'Default color theme (light/dark/system)'),
('display', 'primary_color', '"#3b82f6"', 'string', true, 'Primary brand color'),
('display', 'secondary_color', '"#8b5cf6"', 'string', true, 'Secondary brand color'),
('display', 'logo_url', '"/logo.png"', 'string', true, 'Company logo URL'),
('display', 'favicon_url', '"/favicon.ico"', 'string', true, 'Favicon URL'),

-- Automation Settings
('automation', 'auto_assign_enabled', 'true', 'boolean', false, 'Enable automatic task assignment'),
('automation', 'notification_delay_minutes', '5', 'number', false, 'Delay before sending notifications'),
('automation', 'max_concurrent_workflows', '10', 'number', false, 'Maximum concurrent automation workflows'),

-- Landing Page Settings
('landing', 'hero_title', '"Moderne Business Service Management Lösung"', 'string', true, 'Hero section title'),
('landing', 'hero_subtitle', '"Optimieren Sie Ihre Geschäftsprozesse mit unserer fortschrittlichen Plattform"', 'string', true, 'Hero section subtitle'),
('landing', 'cta_button_text', '"Jetzt starten"', 'string', true, 'Call-to-action button text'),
('landing', 'show_pricing', 'true', 'boolean', true, 'Show pricing section on landing page'),

-- Legal Settings
('legal', 'gdpr_enabled', 'true', 'boolean', true, 'Enable GDPR compliance features'),
('legal', 'cookie_consent_required', 'true', 'boolean', true, 'Require cookie consent'),
('legal', 'data_retention_days', '365', 'number', false, 'Default data retention period in days'),

-- Integration Settings
('integrations', 'analytics_enabled', 'false', 'boolean', false, 'Enable analytics tracking'),
('integrations', 'social_login_enabled', 'false', 'boolean', true, 'Enable social media login'),
('integrations', 'email_service', '"smtp"', 'string', false, 'Email service provider')

ON CONFLICT (category, key) DO NOTHING;

-- Insert default third-party integrations
INSERT INTO third_party_integrations (name, display_name, config) VALUES
('google', 'Google Services', '{"analytics_id": "", "oauth_client_id": "", "oauth_client_secret": ""}'),
('facebook', 'Facebook Integration', '{"app_id": "", "app_secret": "", "pixel_id": ""}'),
('linkedin', 'LinkedIn Integration', '{"client_id": "", "client_secret": ""}'),
('microsoft', 'Microsoft Services', '{"tenant_id": "", "client_id": "", "client_secret": ""}'),
('stripe', 'Stripe Payments', '{"publishable_key": "", "secret_key": "", "webhook_secret": ""}'),
('mailchimp', 'Mailchimp Marketing', '{"api_key": "", "server_prefix": ""}'),
('slack', 'Slack Notifications', '{"webhook_url": "", "bot_token": ""}')
ON CONFLICT (name) DO NOTHING;
