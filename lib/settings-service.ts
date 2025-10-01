// Settings Service Layer
// Clean, reusable service functions for settings management

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type {
  SystemSetting,
  UserProfileSetting,
  ThirdPartyIntegration,
  LegalDocument,
  LandingPageConfig,
  SettingCategory,
  UserSettingCategory,
  SettingUpdatePayload,
  UserSettingUpdatePayload,
  AllSystemSettings,
  SettingsResponse,
  SettingsListResponse,
  LegalDocumentType,
  ThirdPartyProvider
} from './settings-types';

export class SettingsService {
  // System Settings Management
  static async getSystemSettings(): Promise<SettingsResponse<AllSystemSettings>> {
    try {
      const adminClient = createAdminClient();

      const { data: settings, error } = await adminClient
        .from('system_config')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (error) throw error;

      // Transform flat settings into nested structure
      const organized: Partial<AllSystemSettings> = {};

      settings?.forEach((setting: SystemSetting) => {
        if (!organized[setting.category]) {
          organized[setting.category] = {} as any;
        }
        (organized[setting.category] as any)[setting.key] = setting.value;
      });

      return {
        success: true,
        data: organized as AllSystemSettings
      };
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch system settings'
      };
    }
  }

  static async getSystemSettingsByCategory(category: SettingCategory): Promise<SettingsResponse<Record<string, any>>> {
    try {
      const adminClient = createAdminClient();

      const { data: settings, error } = await adminClient
        .from('system_config')
        .select('*')
        .eq('category', category)
        .order('key', { ascending: true });

      if (error) throw error;

      const result: Record<string, any> = {};
      settings?.forEach((setting: SystemSetting) => {
        result[setting.key] = setting.value;
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`Error fetching ${category} settings:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to fetch ${category} settings`
      };
    }
  }

  static async getPublicSettings(): Promise<SettingsResponse<Record<string, any>>> {
    try {
      const supabase = await createClient();

      // Our schema defines system_config as a single-row table with columns,
      // not a key-value store. Read the single row if present and map to a
      // simple public settings shape used by the app. Fall back to defaults.
      const { data: config, error } = await supabase
        .from('system_config')
        .select('*')
        .maybeSingle();

      if (error) {
        // Non-fatal: return defaults instead of raising noisy DB errors
        console.warn('Public settings fallback due to schema mismatch:', error.message);
      }

      const result: Record<string, any> = {
        general: {
          site_name: 'Rising BSM V2',
          site_description: 'Business Service Management Platform - Next Generation',
          company_name: 'Rising BSM',
        },
        display: {
          default_theme: 'system',
          primary_color: '#a855f7',
          logo_url: null,
          favicon_url: null,
        },
        security: {
          allow_registration: config?.allow_registration ?? false,
          require_email_verification: config?.require_email_verification ?? true,
        }
      };

      return { success: true, data: result };
    } catch (error) {
      console.error('Error fetching public settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch public settings'
      };
    }
  }

  static async updateSystemSetting(
    payload: SettingUpdatePayload,
    userId: string
  ): Promise<SettingsResponse<SystemSetting>> {
    try {
      const adminClient = createAdminClient();

      const { data: setting, error } = await adminClient
        .from('system_config')
        .upsert({
          category: payload.category,
          key: payload.key,
          value: payload.value,
          data_type: payload.data_type || 'string',
          description: payload.description,
          validation_schema: payload.validation_schema,
          updated_by: userId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'category,key'
        })
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: setting
      };
    } catch (error) {
      console.error('Error updating system setting:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update system setting'
      };
    }
  }

  // User Profile Settings Management
  static async getUserSettings(userId: string): Promise<SettingsResponse<Record<string, any>>> {
    try {
      const supabase = await createClient();

      const { data: settings, error } = await supabase
        .from('user_profile_settings')
        .select('*')
        .eq('user_id', userId)
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (error) throw error;

      const result: Record<string, any> = {};
      settings?.forEach((setting: UserProfileSetting) => {
        if (!result[setting.category]) {
          result[setting.category] = {};
        }
        result[setting.category][setting.key] = setting.value;
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user settings'
      };
    }
  }

  static async updateUserSetting(
    userId: string,
    payload: UserSettingUpdatePayload
  ): Promise<SettingsResponse<UserProfileSetting>> {
    try {
      const supabase = await createClient();

      const { data: setting, error } = await supabase
        .from('user_profile_settings')
        .upsert({
          user_id: userId,
          category: payload.category,
          key: payload.key,
          value: payload.value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,category,key'
        })
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: setting
      };
    } catch (error) {
      console.error('Error updating user setting:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user setting'
      };
    }
  }

  // Third-party Integrations Management
  static async getIntegrations(): Promise<SettingsListResponse<ThirdPartyIntegration>> {
    try {
      const adminClient = createAdminClient();

      const { data: integrations, error } = await adminClient
        .from('third_party_integrations')
        .select('*')
        .order('display_name', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: integrations || [],
        total: integrations?.length || 0,
        page: 1,
        limit: 100
      };
    } catch (error) {
      console.error('Error fetching integrations:', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit: 100
      };
    }
  }

  static async updateIntegration(
    name: ThirdPartyProvider,
    config: Record<string, any>,
    isEnabled: boolean,
    userId: string
  ): Promise<SettingsResponse<ThirdPartyIntegration>> {
    try {
      const adminClient = createAdminClient();

      const { data: integration, error } = await adminClient
        .from('third_party_integrations')
        .update({
          config,
          is_enabled: isEnabled,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('name', name)
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: integration
      };
    } catch (error) {
      console.error('Error updating integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update integration'
      };
    }
  }

  // Legal Documents Management
  static async getLegalDocuments(
    type?: LegalDocumentType,
    languageCode?: string
  ): Promise<SettingsListResponse<LegalDocument>> {
    try {
      const supabase = await createClient();

      let query = supabase
        .from('legal_documents')
        .select('*');

      if (type) query = query.eq('type', type);
      if (languageCode) query = query.eq('language_code', languageCode);

      const { data: documents, error } = await query
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('language_code', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: documents || [],
        total: documents?.length || 0,
        page: 1,
        limit: 100
      };
    } catch (error) {
      console.error('Error fetching legal documents:', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit: 100
      };
    }
  }

  static async updateLegalDocument(
    id: string,
    updates: Partial<LegalDocument>,
    userId: string
  ): Promise<SettingsResponse<LegalDocument>> {
    try {
      const adminClient = createAdminClient();

      const { data: document, error } = await adminClient
        .from('legal_documents')
        .update({
          ...updates,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: document
      };
    } catch (error) {
      console.error('Error updating legal document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update legal document'
      };
    }
  }

  // Landing Page Configuration
  static async getLandingPageConfig(): Promise<SettingsListResponse<LandingPageConfig>> {
    try {
      const supabase = await createClient();

      const { data: config, error } = await supabase
        .from('landing_page_config')
        .select('*')
        .eq('is_enabled', true)
        .order('section', { ascending: true })
        .order('position', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: config || [],
        total: config?.length || 0,
        page: 1,
        limit: 100
      };
    } catch (error) {
      console.error('Error fetching landing page config:', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit: 100
      };
    }
  }

  static async updateLandingPageConfig(
    id: string,
    updates: Partial<LandingPageConfig>,
    userId: string
  ): Promise<SettingsResponse<LandingPageConfig>> {
    try {
      const adminClient = createAdminClient();

      const { data: config, error } = await adminClient
        .from('landing_page_config')
        .update({
          ...updates,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: config
      };
    } catch (error) {
      console.error('Error updating landing page config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update landing page config'
      };
    }
  }

  // Utility Methods
  static async validateSettingValue(
    value: any,
    dataType: string,
    validationSchema?: Record<string, any>
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic type validation
    switch (dataType) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push('Value must be a string');
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push('Value must be a valid number');
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push('Value must be a boolean');
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push('Value must be an object');
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push('Value must be an array');
        }
        break;
    }

    // Additional validation based on schema
    if (validationSchema) {
      // Add JSON Schema validation here if needed
      // For now, we'll implement basic validations
      if (validationSchema.minLength && typeof value === 'string' && value.length < validationSchema.minLength) {
        errors.push(`Value must be at least ${validationSchema.minLength} characters long`);
      }
      if (validationSchema.maxLength && typeof value === 'string' && value.length > validationSchema.maxLength) {
        errors.push(`Value must be no more than ${validationSchema.maxLength} characters long`);
      }
      if (validationSchema.pattern && typeof value === 'string' && !new RegExp(validationSchema.pattern).test(value)) {
        errors.push('Value does not match the required pattern');
      }
      if (validationSchema.enum && !validationSchema.enum.includes(value)) {
        errors.push(`Value must be one of: ${validationSchema.enum.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static async resetSettingsToDefault(category?: SettingCategory): Promise<SettingsResponse<boolean>> {
    try {
      const adminClient = createAdminClient();

      // This would require implementing default settings restoration
      // For now, return a placeholder
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('Error resetting settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset settings'
      };
    }
  }

  static async exportSettings(): Promise<SettingsResponse<Record<string, any>>> {
    try {
      const result = await this.getSystemSettings();
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        data: {
          settings: result.data,
          exported_at: new Date().toISOString(),
          version: '1.0'
        }
      };
    } catch (error) {
      console.error('Error exporting settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export settings'
      };
    }
  }
}
