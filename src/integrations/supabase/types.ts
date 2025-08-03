export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      automation_settings: {
        Row: {
          auto_mode_enabled: boolean | null
          created_at: string
          id: string
          max_requests_per_day: number | null
          sync_interval_minutes: number | null
          sync_period: string | null
          updated_at: string
        }
        Insert: {
          auto_mode_enabled?: boolean | null
          created_at?: string
          id?: string
          max_requests_per_day?: number | null
          sync_interval_minutes?: number | null
          sync_period?: string | null
          updated_at?: string
        }
        Update: {
          auto_mode_enabled?: boolean | null
          created_at?: string
          id?: string
          max_requests_per_day?: number | null
          sync_interval_minutes?: number | null
          sync_period?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      marketplaces: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          api_parameters: Json | null
          created_at: string
          id: string
          is_active: boolean
          login: string | null
          name: string
          password: string | null
          pricing_action: string | null
          pricing_value: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string | null
          api_parameters?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          login?: string | null
          name: string
          password?: string | null
          pricing_action?: string | null
          pricing_value?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string | null
          api_parameters?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          login?: string | null
          name?: string
          password?: string | null
          pricing_action?: string | null
          pricing_value?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          auto_name_update: boolean | null
          created_at: string
          current_price: number | null
          id: string
          last_updated: string | null
          marketplace_article: string | null
          marketplace_id: string | null
          name_comparison_enabled: boolean | null
          name_marketplace: string | null
          name_supplier: string
          new_price: number | null
          price_status: string | null
          supplier_article: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          auto_name_update?: boolean | null
          created_at?: string
          current_price?: number | null
          id?: string
          last_updated?: string | null
          marketplace_article?: string | null
          marketplace_id?: string | null
          name_comparison_enabled?: boolean | null
          name_marketplace?: string | null
          name_supplier: string
          new_price?: number | null
          price_status?: string | null
          supplier_article: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_name_update?: boolean | null
          created_at?: string
          current_price?: number | null
          id?: string
          last_updated?: string | null
          marketplace_article?: string | null
          marketplace_id?: string | null
          name_comparison_enabled?: boolean | null
          name_marketplace?: string | null
          name_supplier?: string
          new_price?: number | null
          price_status?: string | null
          supplier_article?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_settings: {
        Row: {
          created_at: string
          file_format: string | null
          id: string
          is_active: boolean | null
          storage_login: string | null
          storage_password: string | null
          storage_path: string | null
          storage_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_format?: string | null
          id?: string
          is_active?: boolean | null
          storage_login?: string | null
          storage_password?: string | null
          storage_path?: string | null
          storage_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_format?: string | null
          id?: string
          is_active?: boolean | null
          storage_login?: string | null
          storage_password?: string | null
          storage_path?: string | null
          storage_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_customizations: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean | null
          marketplace_id: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          marketplace_id?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          marketplace_id?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_customizations_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_customizations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          api_endpoint: string | null
          api_key: string | null
          api_parameters: Json | null
          auto_name_update: boolean | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_comparison_enabled: boolean | null
          one_by_one_mode: boolean | null
          updated_at: string
          upload_to_all_marketplaces: boolean | null
          website_login: string | null
          website_password: string | null
        }
        Insert: {
          address?: string | null
          api_endpoint?: string | null
          api_key?: string | null
          api_parameters?: Json | null
          auto_name_update?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_comparison_enabled?: boolean | null
          one_by_one_mode?: boolean | null
          updated_at?: string
          upload_to_all_marketplaces?: boolean | null
          website_login?: string | null
          website_password?: string | null
        }
        Update: {
          address?: string | null
          api_endpoint?: string | null
          api_key?: string | null
          api_parameters?: Json | null
          auto_name_update?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_comparison_enabled?: boolean | null
          one_by_one_mode?: boolean | null
          updated_at?: string
          upload_to_all_marketplaces?: boolean | null
          website_login?: string | null
          website_password?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "manager", "user"],
    },
  },
} as const
