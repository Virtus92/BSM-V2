-- Update landing page settings with comprehensive customization options
-- This migration adds all the new landing page settings fields

-- First, let's add default values for the new landing page settings
INSERT INTO system_settings (category, key, value, data_type, is_public, description) VALUES
-- Template Management
('landing', 'template_type', '"default"', 'string', true, 'Landing page template type (default, custom, html)'),
('landing', 'is_active', 'false', 'boolean', true, 'Whether the custom landing page is active'),

-- Enhanced Default Template Settings
('landing', 'cta_button_url', '"/auth/sign-up"', 'string', true, 'URL for the call-to-action button'),

-- Custom Template Settings
('landing', 'custom_html', '""', 'string', false, 'Custom HTML for the landing page'),
('landing', 'custom_css', '""', 'string', false, 'Custom CSS for the landing page'),
('landing', 'custom_js', '""', 'string', false, 'Custom JavaScript for the landing page'),

-- SEO Settings
('landing', 'meta_title', '""', 'string', true, 'SEO meta title for the landing page'),
('landing', 'meta_description', '""', 'string', true, 'SEO meta description for the landing page'),
('landing', 'meta_keywords', '""', 'string', true, 'SEO keywords for the landing page'),

-- Advanced Settings
('landing', 'enable_analytics', 'false', 'boolean', true, 'Enable analytics tracking on landing page'),
('landing', 'google_analytics_id', '""', 'string', false, 'Google Analytics tracking ID'),
('landing', 'enable_chat', 'true', 'boolean', true, 'Enable chat widget on landing page'),
('landing', 'custom_head_tags', '""', 'string', false, 'Custom HTML tags for the head section'),
('landing', 'custom_body_tags', '""', 'string', false, 'Custom HTML tags for the body section'),

-- Layout Settings
('landing', 'show_navigation', 'true', 'boolean', true, 'Show navigation on landing page'),
('landing', 'show_footer', 'true', 'boolean', true, 'Show footer on landing page'),
('landing', 'background_type', '"gradient"', 'string', true, 'Background type (color, gradient, image)'),
('landing', 'background_value', '"linear-gradient(135deg, #667eea 0%, #764ba2 100%)"', 'string', true, 'Background value (color, gradient, or image URL)'),

-- Content Sections
('landing', 'show_hero', 'true', 'boolean', true, 'Show hero section on landing page'),
('landing', 'show_features', 'true', 'boolean', true, 'Show features section on landing page'),
('landing', 'show_testimonials', 'false', 'boolean', true, 'Show testimonials section on landing page'),
('landing', 'show_contact', 'true', 'boolean', true, 'Show contact section on landing page'),

-- Template Presets
('landing', 'saved_templates', '"[]"', 'string', false, 'JSON array of saved landing page templates')

ON CONFLICT (category, key) DO UPDATE SET
  value = EXCLUDED.value,
  data_type = EXCLUDED.data_type,
  is_public = EXCLUDED.is_public,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Update the existing hero_title and hero_subtitle with better defaults if they are empty
UPDATE system_settings
SET value = '"Willkommen bei Rising BSM V2"'
WHERE category = 'landing' AND key = 'hero_title' AND (value = '""' OR value IS NULL);

UPDATE system_settings
SET value = '"Die moderne Business Service Management Plattform für Ihr Unternehmen"'
WHERE category = 'landing' AND key = 'hero_subtitle' AND (value = '""' OR value IS NULL);

UPDATE system_settings
SET value = '"Jetzt starten"'
WHERE category = 'landing' AND key = 'cta_button_text' AND (value = '""' OR value IS NULL);

-- Also add missing integration settings that we implemented
INSERT INTO system_settings (category, key, value, data_type, is_public, description) VALUES
-- Global Integration Toggles
('integrations', 'analytics_enabled', 'false', 'boolean', true, 'Enable analytics integrations'),
('integrations', 'marketing_enabled', 'false', 'boolean', true, 'Enable marketing integrations'),
('integrations', 'payment_enabled', 'false', 'boolean', true, 'Enable payment integrations'),
('integrations', 'notifications_enabled', 'false', 'boolean', true, 'Enable notification integrations'),

-- Facebook Integration
('integrations', 'facebook_app_id', '""', 'string', false, 'Facebook App ID'),
('integrations', 'facebook_app_secret', '""', 'string', false, 'Facebook App Secret'),
('integrations', 'facebook_pixel_id', '""', 'string', false, 'Facebook Pixel ID'),

-- Google Integration
('integrations', 'google_analytics_id', '""', 'string', false, 'Google Analytics ID'),
('integrations', 'google_ads_id', '""', 'string', false, 'Google Ads ID'),
('integrations', 'google_client_id', '""', 'string', false, 'Google OAuth Client ID'),
('integrations', 'google_client_secret', '""', 'string', false, 'Google OAuth Client Secret'),

-- Stripe Integration
('integrations', 'stripe_publishable_key', '""', 'string', false, 'Stripe Publishable Key'),
('integrations', 'stripe_secret_key', '""', 'string', false, 'Stripe Secret Key'),
('integrations', 'stripe_webhook_secret', '""', 'string', false, 'Stripe Webhook Secret'),

-- Mailchimp Integration
('integrations', 'mailchimp_api_key', '""', 'string', false, 'Mailchimp API Key'),
('integrations', 'mailchimp_list_id', '""', 'string', false, 'Mailchimp List ID'),

-- Slack Integration
('integrations', 'slack_webhook_url', '""', 'string', false, 'Slack Webhook URL'),
('integrations', 'slack_bot_token', '""', 'string', false, 'Slack Bot Token')

ON CONFLICT (category, key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings (is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_system_settings_category_key ON system_settings (category, key);

-- Add a comment to track this migration
COMMENT ON TABLE system_settings IS 'System settings with enhanced landing page customization and integration support';

-- Verify the settings
DO $$
DECLARE
    landing_count INTEGER;
    integration_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO landing_count FROM system_settings WHERE category = 'landing';
    SELECT COUNT(*) INTO integration_count FROM system_settings WHERE category = 'integrations';

    RAISE NOTICE 'Landing settings count: %', landing_count;
    RAISE NOTICE 'Integration settings count: %', integration_count;

    IF landing_count < 20 THEN
        RAISE WARNING 'Landing settings count is lower than expected. Expected at least 20, got %', landing_count;
    END IF;

    IF integration_count < 15 THEN
        RAISE WARNING 'Integration settings count is lower than expected. Expected at least 15, got %', integration_count;
    END IF;
END $$;