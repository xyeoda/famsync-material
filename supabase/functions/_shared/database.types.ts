// Simplified types for edge functions
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      system_roles: {
        Row: {
          id: string
          user_id: string
          role: 'site_admin' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'site_admin' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'site_admin' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      admin_audit_log: {
        Row: {
          id: string
          action_type: string
          performed_by: string
          target_user_id: string | null
          target_household_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          action_type: string
          performed_by: string
          target_user_id?: string | null
          target_household_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          action_type?: string
          performed_by?: string
          target_user_id?: string | null
          target_household_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      households: {
        Row: {
          id: string
          name: string
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pending_invitations: {
        Row: {
          id: string
          email: string
          household_id: string
          invited_by: string
          role: 'parent' | 'helper' | 'kid'
          token: string
          expires_at: string
          created_at: string
          is_first_parent: boolean
        }
        Insert: {
          id?: string
          email: string
          household_id: string
          invited_by: string
          role: 'parent' | 'helper' | 'kid'
          token: string
          expires_at?: string
          created_at?: string
          is_first_parent?: boolean
        }
        Update: {
          id?: string
          email?: string
          household_id?: string
          invited_by?: string
          role?: 'parent' | 'helper' | 'kid'
          token?: string
          expires_at?: string
          created_at?: string
          is_first_parent?: boolean
        }
      }
      calendar_tokens: {
        Row: {
          id: string
          household_id: string
          user_id: string
          token: string
          filter_person: string | null
          name: string
          last_accessed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          token: string
          filter_person?: string | null
          name: string
          last_accessed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string
          token?: string
          filter_person?: string | null
          name?: string
          last_accessed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          must_change_password: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          must_change_password?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          must_change_password?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          household_id: string
          role: 'parent' | 'helper' | 'kid'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          household_id: string
          role: 'parent' | 'helper' | 'kid'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          household_id?: string
          role?: 'parent' | 'helper' | 'kid'
          created_at?: string
          updated_at?: string
        }
      }
      family_settings: {
        Row: {
          id: string
          user_id: string
          household_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          household_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          household_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_instances: {
        Row: {
          id: string
          event_id: string
          household_id: string | null
          user_id: string
          date: string
          cancelled: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          household_id?: string | null
          user_id: string
          date: string
          cancelled?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          household_id?: string | null
          user_id?: string
          date?: string
          cancelled?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      family_events: {
        Row: {
          id: string
          household_id: string | null
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id?: string | null
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string | null
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: 'parent' | 'helper' | 'kid'
      system_role: 'site_admin' | 'user'
    }
  }
}
