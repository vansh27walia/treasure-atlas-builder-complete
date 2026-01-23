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
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          company: string | null
          country: string
          created_at: string | null
          id: number
          is_default_from: boolean | null
          is_default_to: boolean | null
          name: string | null
          phone: string | null
          state: string
          street1: string
          street2: string | null
          user_id: string | null
          zip: string
        }
        Insert: {
          city: string
          company?: string | null
          country: string
          created_at?: string | null
          id?: number
          is_default_from?: boolean | null
          is_default_to?: boolean | null
          name?: string | null
          phone?: string | null
          state: string
          street1: string
          street2?: string | null
          user_id?: string | null
          zip: string
        }
        Update: {
          city?: string
          company?: string | null
          country?: string
          created_at?: string | null
          id?: number
          is_default_from?: boolean | null
          is_default_to?: boolean | null
          name?: string | null
          phone?: string | null
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
      ai_alerts: {
        Row: {
          alert_type: string
          carrier: string | null
          created_at: string
          description: string
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          resolved_at: string | null
          severity: string | null
          shipment_id: string | null
          suggested_action: string | null
          title: string
          tracking_code: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          carrier?: string | null
          created_at?: string
          description: string
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          shipment_id?: string | null
          suggested_action?: string | null
          title: string
          tracking_code?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          carrier?: string | null
          created_at?: string
          description?: string
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          shipment_id?: string | null
          suggested_action?: string | null
          title?: string
          tracking_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_carrier_scores: {
        Row: {
          ai_recommendation: string | null
          analysis_period_end: string | null
          analysis_period_start: string | null
          average_delay_hours: number | null
          best_lanes: Json | null
          carrier: string
          cost_efficiency_score: number | null
          created_at: string
          id: string
          on_time_percentage: number | null
          overall_score: number | null
          performance_trend: string | null
          reliability_score: number | null
          service: string | null
          speed_score: number | null
          total_shipments_analyzed: number | null
          updated_at: string
          user_id: string
          worst_lanes: Json | null
        }
        Insert: {
          ai_recommendation?: string | null
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          average_delay_hours?: number | null
          best_lanes?: Json | null
          carrier: string
          cost_efficiency_score?: number | null
          created_at?: string
          id?: string
          on_time_percentage?: number | null
          overall_score?: number | null
          performance_trend?: string | null
          reliability_score?: number | null
          service?: string | null
          speed_score?: number | null
          total_shipments_analyzed?: number | null
          updated_at?: string
          user_id: string
          worst_lanes?: Json | null
        }
        Update: {
          ai_recommendation?: string | null
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          average_delay_hours?: number | null
          best_lanes?: Json | null
          carrier?: string
          cost_efficiency_score?: number | null
          created_at?: string
          id?: string
          on_time_percentage?: number | null
          overall_score?: number | null
          performance_trend?: string | null
          reliability_score?: number | null
          service?: string | null
          speed_score?: number | null
          total_shipments_analyzed?: number | null
          updated_at?: string
          user_id?: string
          worst_lanes?: Json | null
        }
        Relationships: []
      }
      ai_customer_messages: {
        Row: {
          created_at: string
          customer_ready_message: string
          escalation_needed: boolean | null
          escalation_reason: string | null
          id: string
          internal_notes: string | null
          message_type: string | null
          sentiment: string | null
          shipment_id: string | null
          tracking_code: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_ready_message: string
          escalation_needed?: boolean | null
          escalation_reason?: string | null
          id?: string
          internal_notes?: string | null
          message_type?: string | null
          sentiment?: string | null
          shipment_id?: string | null
          tracking_code?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          customer_ready_message?: string
          escalation_needed?: boolean | null
          escalation_reason?: string | null
          id?: string
          internal_notes?: string | null
          message_type?: string | null
          sentiment?: string | null
          shipment_id?: string | null
          tracking_code?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_decision_logs: {
        Row: {
          confidence_score: number | null
          created_at: string
          decision_type: string
          id: string
          input_data: Json
          model_used: string | null
          output_data: Json
          processing_time_ms: number | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          decision_type: string
          id?: string
          input_data: Json
          model_used?: string | null
          output_data: Json
          processing_time_ms?: number | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          decision_type?: string
          id?: string
          input_data?: Json
          model_used?: string | null
          output_data?: Json
          processing_time_ms?: number | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_delay_predictions: {
        Row: {
          confidence_score: number | null
          created_at: string
          delay_probability: number
          delay_type: string | null
          expires_at: string | null
          id: string
          predicted_delay_hours: number | null
          reasoning: string | null
          root_cause: string | null
          shipment_id: string
          similar_shipments_analyzed: number | null
          suggested_actions: Json | null
          tracking_code: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          delay_probability?: number
          delay_type?: string | null
          expires_at?: string | null
          id?: string
          predicted_delay_hours?: number | null
          reasoning?: string | null
          root_cause?: string | null
          shipment_id: string
          similar_shipments_analyzed?: number | null
          suggested_actions?: Json | null
          tracking_code?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          delay_probability?: number
          delay_type?: string | null
          expires_at?: string | null
          id?: string
          predicted_delay_hours?: number | null
          reasoning?: string | null
          root_cause?: string | null
          shipment_id?: string
          similar_shipments_analyzed?: number | null
          suggested_actions?: Json | null
          tracking_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_shipment_insights: {
        Row: {
          ai_summary: string
          confidence_score: number | null
          created_at: string
          current_interpretation: string | null
          delay_probability: number | null
          delay_reason: string | null
          id: string
          predicted_delivery_date: string | null
          raw_analysis: Json | null
          recommendations: Json | null
          risk_level: string | null
          shipment_id: string
          tracking_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary: string
          confidence_score?: number | null
          created_at?: string
          current_interpretation?: string | null
          delay_probability?: number | null
          delay_reason?: string | null
          id?: string
          predicted_delivery_date?: string | null
          raw_analysis?: Json | null
          recommendations?: Json | null
          risk_level?: string | null
          shipment_id: string
          tracking_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string
          confidence_score?: number | null
          created_at?: string
          current_interpretation?: string | null
          delay_probability?: number | null
          delay_reason?: string | null
          id?: string
          predicted_delivery_date?: string | null
          raw_analysis?: Json | null
          recommendations?: Json | null
          risk_level?: string | null
          shipment_id?: string
          tracking_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          service_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      batch_processing_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          download_url: string | null
          error_message: string | null
          failed_row_count: number | null
          filename: string
          id: string
          original_row_count: number
          processed_row_count: number
          processing_status: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          download_url?: string | null
          error_message?: string | null
          failed_row_count?: number | null
          filename: string
          id?: string
          original_row_count: number
          processed_row_count: number
          processing_status?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          download_url?: string | null
          error_message?: string | null
          failed_row_count?: number | null
          filename?: string
          id?: string
          original_row_count?: number
          processed_row_count?: number
          processing_status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bulk_label_batches: {
        Row: {
          batch_reference: string
          created_at: string | null
          id: string
          total_labels: number
          updated_at: string | null
          user_id: string | null
          zip_file_path: string | null
          zip_file_url: string | null
        }
        Insert: {
          batch_reference: string
          created_at?: string | null
          id?: string
          total_labels?: number
          updated_at?: string | null
          user_id?: string | null
          zip_file_path?: string | null
          zip_file_url?: string | null
        }
        Update: {
          batch_reference?: string
          created_at?: string | null
          id?: string
          total_labels?: number
          updated_at?: string | null
          user_id?: string | null
          zip_file_path?: string | null
          zip_file_url?: string | null
        }
        Relationships: []
      }
      bulk_label_uploads: {
        Row: {
          batch_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          shipment_id: string | null
          tracking_code: string | null
          updated_at: string
          upload_status: string | null
          user_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          shipment_id?: string | null
          tracking_code?: string | null
          updated_at?: string
          upload_status?: string | null
          user_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          shipment_id?: string | null
          tracking_code?: string | null
          updated_at?: string
          upload_status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bulk_shipments: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          insurance_amount: number | null
          insurance_cost: number | null
          rates: Json
          selected_rate_id: string | null
          shipment_data: Json
          status: string
          total_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          insurance_amount?: number | null
          insurance_cost?: number | null
          rates?: Json
          selected_rate_id?: string | null
          shipment_data: Json
          status?: string
          total_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          insurance_amount?: number | null
          insurance_cost?: number | null
          rates?: Json
          selected_rate_id?: string | null
          shipment_data?: Json
          status?: string
          total_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      external_trackings: {
        Row: {
          carrier: string | null
          created_at: string | null
          estimated_delivery: Json | null
          id: string
          last_fetched: string | null
          status: string | null
          tracking_code: string
          tracking_data: Json | null
          tracking_events: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          estimated_delivery?: Json | null
          id?: string
          last_fetched?: string | null
          status?: string | null
          tracking_code: string
          tracking_data?: Json | null
          tracking_events?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          estimated_delivery?: Json | null
          id?: string
          last_fetched?: string | null
          status?: string | null
          tracking_code?: string
          tracking_data?: Json | null
          tracking_events?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          id: string
          platform: string | null
          shop_domain: string
          state_value: string
          time: string | null
          user_id: string
        }
        Insert: {
          id?: string
          platform?: string | null
          shop_domain: string
          state_value: string
          time?: string | null
          user_id: string
        }
        Update: {
          id?: string
          platform?: string | null
          shop_domain?: string
          state_value?: string
          time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string | null
          exp_month: number | null
          exp_year: number | null
          id: string
          is_default: boolean | null
          last4: string | null
          stripe_payment_method_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          stripe_payment_method_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          stripe_payment_method_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          shipping_details: Json | null
          status: string
          stripe_payment_intent_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          shipping_details?: Json | null
          status: string
          stripe_payment_intent_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          shipping_details?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          est_delivery_date: string | null
          from_address_json: Json | null
          id: number
          is_international: boolean | null
          label_format: string | null
          label_size: string | null
          label_url: string | null
          markup_percentage: number | null
          non_delivery_option: string | null
          parcel_json: Json | null
          png_label_url: string | null
          rate_id: string | null
          service: string | null
          shipment_id: string | null
          status: string | null
          to_address_json: Json | null
          tracking_code: string | null
          tracking_details: Json | null
          updated_at: string | null
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
          est_delivery_date?: string | null
          from_address_json?: Json | null
          id?: number
          is_international?: boolean | null
          label_format?: string | null
          label_size?: string | null
          label_url?: string | null
          markup_percentage?: number | null
          non_delivery_option?: string | null
          parcel_json?: Json | null
          png_label_url?: string | null
          rate_id?: string | null
          service?: string | null
          shipment_id?: string | null
          status?: string | null
          to_address_json?: Json | null
          tracking_code?: string | null
          tracking_details?: Json | null
          updated_at?: string | null
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
          est_delivery_date?: string | null
          from_address_json?: Json | null
          id?: number
          is_international?: boolean | null
          label_format?: string | null
          label_size?: string | null
          label_url?: string | null
          markup_percentage?: number | null
          non_delivery_option?: string | null
          parcel_json?: Json | null
          png_label_url?: string | null
          rate_id?: string | null
          service?: string | null
          shipment_id?: string | null
          status?: string | null
          to_address_json?: Json | null
          tracking_code?: string | null
          tracking_details?: Json | null
          updated_at?: string | null
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
      shipments: {
        Row: {
          carrier: string | null
          created_at: string | null
          eta: string | null
          id: string
          label_url: string | null
          package_details: Json | null
          recipient_address: string | null
          recipient_name: string | null
          service: string | null
          shipment_id: string | null
          status: string | null
          tracking_code: string
          tracking_history: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          eta?: string | null
          id?: string
          label_url?: string | null
          package_details?: Json | null
          recipient_address?: string | null
          recipient_name?: string | null
          service?: string | null
          shipment_id?: string | null
          status?: string | null
          tracking_code: string
          tracking_history?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          eta?: string | null
          id?: string
          label_url?: string | null
          package_details?: Json | null
          recipient_address?: string | null
          recipient_name?: string | null
          service?: string | null
          shipment_id?: string | null
          status?: string | null
          tracking_code?: string
          tracking_history?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shipping_label_files: {
        Row: {
          created_at: string | null
          easypost_shipment_id: string | null
          file_path: string
          file_size: number | null
          id: string
          label_type: string
          order_reference: string | null
          shipment_id: string
          supabase_url: string
          tracking_code: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          easypost_shipment_id?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          label_type: string
          order_reference?: string | null
          shipment_id: string
          supabase_url: string
          tracking_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          easypost_shipment_id?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          label_type?: string
          order_reference?: string | null
          shipment_id?: string
          supabase_url?: string
          tracking_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shopify_connections: {
        Row: {
          access_token: string
          created_at: string
          id: string
          scopes: string | null
          shop: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          scopes?: string | null
          shop: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          scopes?: string | null
          shop?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_records: {
        Row: {
          carrier: string | null
          created_at: string
          easypost_id: string | null
          id: string
          label_url: string | null
          recipient_address: string | null
          recipient_name: string | null
          service: string | null
          shipment_id: string | null
          status: string | null
          tracking_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          easypost_id?: string | null
          id?: string
          label_url?: string | null
          recipient_address?: string | null
          recipient_name?: string | null
          service?: string | null
          shipment_id?: string | null
          status?: string | null
          tracking_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          easypost_id?: string | null
          id?: string
          label_url?: string | null
          recipient_address?: string | null
          recipient_name?: string | null
          service?: string | null
          shipment_id?: string | null
          status?: string | null
          tracking_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          default_pickup_address_id: number | null
          home_address: Json | null
          id: string
          onboarding_completed: boolean | null
          payment_info: Json | null
          phone_number: string | null
          shopify_access_token: string | null
          shopify_store_url: string | null
          stripe_customer_id: string | null
          updated_at: string | null
          uship_api_key: string | null
          uship_test_mode: boolean | null
        }
        Insert: {
          created_at?: string | null
          default_pickup_address_id?: number | null
          home_address?: Json | null
          id: string
          onboarding_completed?: boolean | null
          payment_info?: Json | null
          phone_number?: string | null
          shopify_access_token?: string | null
          shopify_store_url?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          uship_api_key?: string | null
          uship_test_mode?: boolean | null
        }
        Update: {
          created_at?: string | null
          default_pickup_address_id?: number | null
          home_address?: Json | null
          id?: string
          onboarding_completed?: boolean | null
          payment_info?: Json | null
          phone_number?: string | null
          shopify_access_token?: string | null
          shopify_store_url?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          uship_api_key?: string | null
          uship_test_mode?: boolean | null
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
      user_onboarding_status:
        | { Args: never; Returns: undefined }
        | { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
