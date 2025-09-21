export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contact_request_notes: {
        Row: {
          contact_request_id: string
          content: string
          created_at: string | null
          created_by: string
          id: string
          is_internal: boolean | null
        }
        Insert: {
          contact_request_id: string
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          is_internal?: boolean | null
        }
        Update: {
          contact_request_id?: string
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_internal?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_request_notes_contact_request_id_fkey"
            columns: ["contact_request_id"]
            isOneToOne: false
            referencedRelation: "contact_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          assigned_to: string | null
          company: string | null
          converted_at: string | null
          converted_to_customer_id: string | null
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          ip_address: unknown | null
          message: string
          name: string
          phone: string | null
          priority: string | null
          source: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          converted_at?: string | null
          converted_to_customer_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          ip_address?: unknown | null
          message: string
          name: string
          phone?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          converted_at?: string | null
          converted_to_customer_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          ip_address?: unknown | null
          message?: string
          name?: string
          phone?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_converted_to_customer_id_fkey"
            columns: ["converted_to_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_automation_settings: {
        Row: {
          auto_email_responses: boolean | null
          auto_lead_processing: boolean | null
          auto_slack_notifications: boolean | null
          auto_task_creation: boolean | null
          created_at: string | null
          customer_id: string | null
          id: string
          notification_preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          auto_email_responses?: boolean | null
          auto_lead_processing?: boolean | null
          auto_slack_notifications?: boolean | null
          auto_task_creation?: boolean | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notification_preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          auto_email_responses?: boolean | null
          auto_lead_processing?: boolean | null
          auto_slack_notifications?: boolean | null
          auto_task_creation?: boolean | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notification_preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_automation_settings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          completed_at: string | null
          content: string
          created_at: string | null
          created_by: string | null
          customer_id: string
          due_date: string | null
          id: string
          is_internal: boolean | null
          note_type: string | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          completed_at?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          due_date?: string | null
          id?: string
          is_internal?: boolean | null
          note_type?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          completed_at?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          due_date?: string | null
          id?: string
          is_internal?: boolean | null
          note_type?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string
          company_size: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          deleted_at: string | null
          discount_rate: number | null
          email: string | null
          id: string
          industry: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          status: Database["public"]["Enums"]["customer_status"] | null
          tags: string[] | null
          tax_id: string | null
          updated_at: string | null
          updated_by: string | null
          user_activated_at: string | null
          user_id: string | null
          user_invited_at: string | null
          vat_id: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name: string
          company_size?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          discount_rate?: number | null
          email?: string | null
          id?: string
          industry?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          tags?: string[] | null
          tax_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_activated_at?: string | null
          user_id?: string | null
          user_invited_at?: string | null
          vat_id?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string
          company_size?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          discount_rate?: number | null
          email?: string | null
          id?: string
          industry?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          tags?: string[] | null
          tax_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_activated_at?: string | null
          user_id?: string | null
          user_invited_at?: string | null
          vat_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          first_name: string | null
          id: string
          language: string | null
          last_name: string | null
          last_seen_at: string | null
          notifications_enabled: boolean | null
          phone: string | null
          timezone: string | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          first_name?: string | null
          id: string
          language?: string | null
          last_name?: string | null
          last_seen_at?: string | null
          notifications_enabled?: boolean | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          first_name?: string | null
          id?: string
          language?: string | null
          last_name?: string | null
          last_seen_at?: string | null
          notifications_enabled?: boolean | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          contact_request_id: string | null
          created_at: string | null
          customer_id: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          n8n_execution_id: string
          output_data: Json | null
          started_at: string
          status: string
          workflow_registry_id: string | null
        }
        Insert: {
          completed_at?: string | null
          contact_request_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          n8n_execution_id: string
          output_data?: Json | null
          started_at: string
          status: string
          workflow_registry_id?: string | null
        }
        Update: {
          completed_at?: string | null
          contact_request_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          n8n_execution_id?: string
          output_data?: Json | null
          started_at?: string
          status?: string
          workflow_registry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_contact_request_id_fkey"
            columns: ["contact_request_id"]
            isOneToOne: false
            referencedRelation: "contact_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_registry_id_fkey"
            columns: ["workflow_registry_id"]
            isOneToOne: false
            referencedRelation: "workflow_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_registry: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          description: string | null
          failed_executions: number | null
          id: string
          last_execution_at: string | null
          n8n_workflow_id: string
          name: string
          successful_executions: number | null
          tags: string[] | null
          total_executions: number | null
          trigger_type: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          failed_executions?: number | null
          id?: string
          last_execution_at?: string | null
          n8n_workflow_id: string
          name: string
          successful_executions?: number | null
          tags?: string[] | null
          total_executions?: number | null
          trigger_type?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          failed_executions?: number | null
          id?: string
          last_execution_at?: string | null
          n8n_workflow_id?: string
          name?: string
          successful_executions?: number | null
          tags?: string[] | null
          total_executions?: number | null
          trigger_type?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_registry_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_registry_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          n8n_template_data: Json
          name: string
          required_credentials: string[] | null
          setup_instructions: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          n8n_template_data: Json
          name: string
          required_credentials?: string[] | null
          setup_instructions?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          n8n_template_data?: Json
          name?: string
          required_credentials?: string[] | null
          setup_instructions?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_customer_from_request: {
        Args: { create_user_account?: boolean; request_id: string }
        Returns: string
      }
    }
    Enums: {
      customer_status: "prospect" | "active" | "inactive" | "archived"
      priority_level: "low" | "medium" | "high" | "critical"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      customer_status: ["prospect", "active", "inactive", "archived"],
      priority_level: ["low", "medium", "high", "critical"],
    },
  },
} as const
