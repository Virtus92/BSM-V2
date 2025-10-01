// Settings System Type Definitions
// Clean, type-safe interfaces for all settings

export type SettingDataType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export type SettingCategory =
  | 'general'
  | 'automation'
  | 'display'
  | 'landing'
  | 'legal'
  | 'integrations';

export type UserSettingCategory =
  | 'display'
  | 'notifications'
  | 'workspace'
  | 'privacy';

export type LegalDocumentType =
  | 'privacy_policy'
  | 'terms_of_service'
  | 'cookie_policy'
  | 'imprint'
  | 'gdpr_notice';

export type ThirdPartyProvider =
  | 'google'
  | 'facebook'
  | 'linkedin'
  | 'microsoft'
  | 'stripe'
  | 'mailchimp'
  | 'slack';

export interface SystemSetting {
  id: string;
  category: SettingCategory;
  key: string;
  value: any;
  data_type: SettingDataType;
  is_public: boolean;
  description?: string;
  validation_schema?: Record<string, any>;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface UserProfileSetting {
  id: string;
  user_id: string;
  category: UserSettingCategory;
  key: string;
  value: any;
  created_at: string;
  updated_at: string;
}

export interface ThirdPartyIntegration {
  id: string;
  name: ThirdPartyProvider;
  display_name: string;
  is_enabled: boolean;
  config: Record<string, any>;
  oauth_config?: Record<string, any>;
  webhook_url?: string;
  webhook_secret?: string;
  rate_limit_per_minute: number;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  language_code: string;
  title: string;
  content: string;
  version: string;
  is_active: boolean;
  effective_date?: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface LandingPageConfig {
  id: string;
  section: string;
  component_type: string;
  position: number;
  is_enabled: boolean;
  config: Record<string, any>;
  content?: Record<string, any>;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

// Strongly typed setting values
export interface GeneralSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  support_email: string;
  company_name: string;
}

export interface DisplaySettings {
  default_theme: 'light' | 'dark' | 'system';
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  favicon_url: string;
}

export interface AutomationSettings {
  auto_assign_enabled: boolean;
  notification_delay_minutes: number;
  max_concurrent_workflows: number;
}

export interface LandingSettings {
  // Template Management
  template_type: 'default' | 'custom' | 'html';
  is_active: boolean;

  // Default Template Settings
  hero_title: string;
  hero_subtitle: string;
  cta_button_text: string;
  cta_button_url: string;
  show_pricing: boolean;

  // Custom Template Settings
  custom_html: string;
  custom_css: string;
  custom_js: string;

  // SEO Settings
  meta_title: string;
  meta_description: string;
  meta_keywords: string;

  // Advanced Settings
  enable_analytics: boolean;
  google_analytics_id: string;
  enable_chat: boolean;
  custom_head_tags: string;
  custom_body_tags: string;

  // Layout Settings
  show_navigation: boolean;
  show_footer: boolean;
  background_type: 'color' | 'gradient' | 'image';
  background_value: string;

  // Content Sections
  show_hero: boolean;
  show_features: boolean;
  show_testimonials: boolean;
  show_contact: boolean;

  // Template Presets
  saved_templates: string; // JSON string of saved templates
}

export interface LegalSettings {
  gdpr_enabled: boolean;
  cookie_consent_required: boolean;
  data_retention_days: number;
}

export interface IntegrationSettings {
  // Global Toggles
  analytics_enabled: boolean;
  marketing_enabled: boolean;
  payment_enabled: boolean;
  notifications_enabled: boolean;

  // Facebook Integration
  facebook_app_id: string;
  facebook_app_secret: string;
  facebook_pixel_id: string;

  // Google Integration
  google_analytics_id: string;
  google_ads_id: string;
  google_client_id: string;
  google_client_secret: string;

  // Stripe Integration
  stripe_publishable_key: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;

  // Mailchimp Integration
  mailchimp_api_key: string;
  mailchimp_list_id: string;

  // Slack Integration
  slack_webhook_url: string;
  slack_bot_token: string;
}

// Combined settings interface
export interface AllSystemSettings {
  general: GeneralSettings;
  display: DisplaySettings;
  automation: AutomationSettings;
  landing: LandingSettings;
  legal: LegalSettings;
  integrations: IntegrationSettings;
}

// User preference types
export interface UserDisplaySettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  sidebar_collapsed: boolean;
  notifications_enabled: boolean;
}

export interface UserWorkspaceSettings {
  default_view: 'list' | 'grid' | 'kanban';
  items_per_page: number;
  auto_refresh_enabled: boolean;
  refresh_interval_seconds: number;
}

export interface UserNotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  notification_types: {
    task_assigned: boolean;
    task_completed: boolean;
    customer_message: boolean;
    system_alerts: boolean;
  };
}

export interface UserPrivacySettings {
  profile_visibility: 'public' | 'team' | 'private';
  activity_tracking: boolean;
  analytics_opt_out: boolean;
  data_export_requested: boolean;
}

// API Response types
export interface SettingsResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validation_errors?: Record<string, string[]>;
}

export interface SettingsListResponse<T = any> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Validation schemas
export const SETTING_VALIDATION_SCHEMAS = {
  email: {
    type: 'string',
    format: 'email',
    minLength: 5,
    maxLength: 254
  },
  url: {
    type: 'string',
    format: 'uri',
    maxLength: 2048
  },
  color: {
    type: 'string',
    pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
  },
  theme: {
    type: 'string',
    enum: ['light', 'dark', 'system']
  },
  language: {
    type: 'string',
    pattern: '^[a-z]{2}(-[A-Z]{2})?$'
  }
} as const;

// Setting update payload
export interface SettingUpdatePayload {
  category?: SettingCategory;
  key: string;
  value: any;
  data_type?: SettingDataType;
  description?: string;
  validation_schema?: Record<string, any>;
}

export interface UserSettingUpdatePayload {
  category: UserSettingCategory;
  key: string;
  value: any;
}

// Utility types
export type SettingKey<T extends SettingCategory> =
  T extends 'general' ? keyof GeneralSettings :
  T extends 'display' ? keyof DisplaySettings :
  T extends 'automation' ? keyof AutomationSettings :
  T extends 'landing' ? keyof LandingSettings :
  T extends 'legal' ? keyof LegalSettings :
  T extends 'integrations' ? keyof IntegrationSettings :
  string;

export type SettingValue<T extends SettingCategory, K extends SettingKey<T>> =
  T extends 'general' ? GeneralSettings[K extends keyof GeneralSettings ? K : never] :
  T extends 'display' ? DisplaySettings[K extends keyof DisplaySettings ? K : never] :
  T extends 'automation' ? AutomationSettings[K extends keyof AutomationSettings ? K : never] :
  T extends 'landing' ? LandingSettings[K extends keyof LandingSettings ? K : never] :
  T extends 'legal' ? LegalSettings[K extends keyof LegalSettings ? K : never] :
  T extends 'integrations' ? IntegrationSettings[K extends keyof IntegrationSettings ? K : never] :
  any;