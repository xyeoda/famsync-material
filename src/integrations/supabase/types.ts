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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_locations: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          household_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          phone_secondary: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          household_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          phone_secondary?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          household_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          phone_secondary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_locations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          metadata: Json | null
          performed_by: string
          target_household_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          performed_by: string
          target_household_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          performed_by?: string
          target_household_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_target_household_id_fkey"
            columns: ["target_household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      email_tracking: {
        Row: {
          accepted_at: string | null
          clicked_at: string | null
          created_at: string
          email_type: string
          household_id: string
          id: string
          invitation_id: string | null
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          role: string | null
          sent_at: string
          sent_by: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          clicked_at?: string | null
          created_at?: string
          email_type: string
          household_id: string
          id?: string
          invitation_id?: string | null
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          role?: string | null
          sent_at?: string
          sent_by?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          clicked_at?: string | null
          created_at?: string
          email_type?: string
          household_id?: string
          id?: string
          invitation_id?: string | null
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          role?: string | null
          sent_at?: string
          sent_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tracking_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "pending_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tracking_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_instances: {
        Row: {
          cancelled: boolean | null
          created_at: string
          date: string
          event_id: string
          household_id: string | null
          id: string
          participants: Database["public"]["Enums"]["family_member"][] | null
          transportation: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled?: boolean | null
          created_at?: string
          date: string
          event_id: string
          household_id?: string | null
          id?: string
          participants?: Database["public"]["Enums"]["family_member"][] | null
          transportation?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled?: boolean | null
          created_at?: string
          date?: string
          event_id?: string
          household_id?: string | null
          id?: string
          participants?: Database["public"]["Enums"]["family_member"][] | null
          transportation?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_instances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "family_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_instances_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_instances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_events: {
        Row: {
          category: Database["public"]["Enums"]["activity_category"]
          color: string | null
          created_at: string
          description: string | null
          end_date: string | null
          household_id: string | null
          id: string
          location: string | null
          location_id: string | null
          notes: string | null
          participants: Database["public"]["Enums"]["family_member"][]
          recurrence_slots: Json
          start_date: string
          title: string
          transportation: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["activity_category"]
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          household_id?: string | null
          id?: string
          location?: string | null
          location_id?: string | null
          notes?: string | null
          participants?: Database["public"]["Enums"]["family_member"][]
          recurrence_slots?: Json
          start_date: string
          title: string
          transportation?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["activity_category"]
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          household_id?: string | null
          id?: string
          location?: string | null
          location_id?: string | null
          notes?: string | null
          participants?: Database["public"]["Enums"]["family_member"][]
          recurrence_slots?: Json
          start_date?: string
          title?: string
          transportation?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_events_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "activity_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_settings: {
        Row: {
          created_at: string
          household_id: string | null
          housekeeper_color: string | null
          housekeeper_name: string | null
          id: string
          kid1_color: string | null
          kid1_name: string | null
          kid2_color: string | null
          kid2_name: string | null
          parent1_color: string | null
          parent1_name: string | null
          parent2_color: string | null
          parent2_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id?: string | null
          housekeeper_color?: string | null
          housekeeper_name?: string | null
          id?: string
          kid1_color?: string | null
          kid1_name?: string | null
          kid2_color?: string | null
          kid2_name?: string | null
          parent1_color?: string | null
          parent1_name?: string | null
          parent2_color?: string | null
          parent2_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string | null
          housekeeper_color?: string | null
          housekeeper_name?: string | null
          id?: string
          kid1_color?: string | null
          kid1_name?: string | null
          kid2_color?: string | null
          kid2_name?: string | null
          parent1_color?: string | null
          parent1_name?: string | null
          parent2_color?: string | null
          parent2_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_settings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_errors: {
        Row: {
          created_at: string
          email: string
          error_details: Json | null
          error_message: string | null
          error_type: string
          household_id: string | null
          id: string
          invitation_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          error_details?: Json | null
          error_message?: string | null
          error_type: string
          household_id?: string | null
          id?: string
          invitation_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          error_details?: Json | null
          error_message?: string | null
          error_type?: string
          household_id?: string | null
          id?: string
          invitation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_errors_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_errors_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "pending_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          household_id: string
          id: string
          invited_by: string
          is_first_parent: boolean
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          household_id: string
          id?: string
          invited_by: string
          is_first_parent?: boolean
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          household_id?: string
          id?: string
          invited_by?: string
          is_first_parent?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_invitations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          must_change_password: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          must_change_password?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          must_change_password?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      system_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["system_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["system_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["system_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          household_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _household_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_parent_in_household: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
      is_site_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      activity_category:
        | "sports"
        | "education"
        | "social"
        | "chores"
        | "health"
        | "other"
      app_role: "parent" | "helper" | "kid"
      family_member: "parent1" | "parent2" | "kid1" | "kid2" | "housekeeper"
      system_role: "site_admin" | "user"
      transport_method: "car" | "bus" | "walk" | "bike"
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
      activity_category: [
        "sports",
        "education",
        "social",
        "chores",
        "health",
        "other",
      ],
      app_role: ["parent", "helper", "kid"],
      family_member: ["parent1", "parent2", "kid1", "kid2", "housekeeper"],
      system_role: ["site_admin", "user"],
      transport_method: ["car", "bus", "walk", "bike"],
    },
  },
} as const
