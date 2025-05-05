export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      "1": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      addresses: {
        Row: {
          city: string
          country: string
          id: number
          is_default_from: boolean | null
          is_default_to: boolean | null
          name: string | null
          state: string
          street1: string
          street2: string | null
          user_id: string | null
          zip: string
        }
        Insert: {
          city: string
          country: string
          id?: number
          is_default_from?: boolean | null
          is_default_to?: boolean | null
          name?: string | null
          state: string
          street1: string
          street2?: string | null
          user_id?: string | null
          zip: string
        }
        Update: {
          city?: string
          country?: string
          id?: number
          is_default_from?: boolean | null
          is_default_to?: boolean | null
          name?: string | null
          state?: string
          street1?: string
          street2?: string | null
          user_id?: string | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_parcels: {
        Row: {
          height: number
          id: number
          length: number
          name: string | null
          user_id: string | null
          weight: number
          width: number
        }
        Insert: {
          height: number
          id?: number
          length: number
          name?: string | null
          user_id?: string | null
          weight: number
          width: number
        }
        Update: {
          height?: number
          id?: number
          length?: number
          name?: string | null
          user_id?: string | null
          weight?: number
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "saved_parcels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_records: {
        Row: {
          carrier: string | null
          charged_rate: number | null
          contents_description: string | null
          contents_type: string | null
          created_at: string | null
          currency: string | null
          customs_certify: boolean | null
          customs_items_json: Json | null
          customs_signer: string | null
          delivery_days: number | null
          document_urls_json: Json | null
          easypost_rate: number | null
          from_address_json: Json | null
          id: number
          label_url: string | null
          non_delivery_option: string | null
          parcel_json: Json | null
          rate_id: string | null
          service: string | null
          shipment_id: string | null
          status: string | null
          to_address_json: Json | null
          tracking_code: string | null
          user_id: string | null
        }
        Insert: {
          carrier?: string | null
          charged_rate?: number | null
          contents_description?: string | null
          contents_type?: string | null
          created_at?: string | null
          currency?: string | null
          customs_certify?: boolean | null
          customs_items_json?: Json | null
          customs_signer?: string | null
          delivery_days?: number | null
          document_urls_json?: Json | null
          easypost_rate?: number | null
          from_address_json?: Json | null
          id?: number
          label_url?: string | null
          non_delivery_option?: string | null
          parcel_json?: Json | null
          rate_id?: string | null
          service?: string | null
          shipment_id?: string | null
          status?: string | null
          to_address_json?: Json | null
          tracking_code?: string | null
          user_id?: string | null
        }
        Update: {
          carrier?: string | null
          charged_rate?: number | null
          contents_description?: string | null
          contents_type?: string | null
          created_at?: string | null
          currency?: string | null
          customs_certify?: boolean | null
          customs_items_json?: Json | null
          customs_signer?: string | null
          delivery_days?: number | null
          document_urls_json?: Json | null
          easypost_rate?: number | null
          from_address_json?: Json | null
          id?: number
          label_url?: string | null
          non_delivery_option?: string | null
          parcel_json?: Json | null
          rate_id?: string | null
          service?: string | null
          shipment_id?: string | null
          status?: string | null
          to_address_json?: Json | null
          tracking_code?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          default_pickup_address_id: number | null
          home_address: Json | null
          id: string
          onboarding_completed: boolean | null
          payment_info: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_pickup_address_id?: number | null
          home_address?: Json | null
          id: string
          onboarding_completed?: boolean | null
          payment_info?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_pickup_address_id?: number | null
          home_address?: Json | null
          id?: string
          onboarding_completed?: boolean | null
          payment_info?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_onboarding_status: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
