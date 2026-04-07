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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          break_duration_ms: number
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          id: string
          project_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          break_duration_ms?: number
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          project_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          break_duration_ms?: number
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          project_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      correction_requests: {
        Row: {
          created_at: string
          id: string
          note: string | null
          request_date: string
          request_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          request_date: string
          request_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          request_date?: string
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      location_employees: {
        Row: {
          created_at: string
          id: string
          location_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_employees_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          assigned_employees: number
          created_at: string
          end_date: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          radius_meters: number
          start_date: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_employees?: number
          created_at?: string
          end_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          radius_meters?: number
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_employees?: number
          created_at?: string
          end_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          radius_meters?: number
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      note_employees: {
        Row: {
          created_at: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_employees_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          note_date: string
          note_end_date: string | null
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          note_date: string
          note_end_date?: string | null
          project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          note_date?: string
          note_end_date?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          created_at: string
          hourly_rate: number
          id: string
          paid_amount: number
          payment_date: string | null
          period_end: string
          period_start: string
          period_type: string
          status: string
          total_hours: number
          total_salary: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hourly_rate?: number
          id?: string
          paid_amount?: number
          payment_date?: string | null
          period_end: string
          period_start: string
          period_type?: string
          status?: string
          total_hours?: number
          total_salary?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hourly_rate?: number
          id?: string
          paid_amount?: number
          payment_date?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          status?: string
          total_hours?: number
          total_salary?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          hourly_rate: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          hourly_rate?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          hourly_rate?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_employees: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_employees_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_expenses: {
        Row: {
          amount: number
          created_at: string
          expense_date: string
          id: string
          invoice_reference: string
          note: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          expense_date?: string
          id?: string
          invoice_reference: string
          note?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          expense_date?: string
          id?: string
          invoice_reference?: string
          note?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_revenues: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          project_id: string
          revenue_date: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          project_id: string
          revenue_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          project_id?: string
          revenue_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_revenues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          end_date: string | null
          expenses: number
          id: string
          location: string
          name: string
          start_date: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          expenses?: number
          id?: string
          location: string
          name: string
          start_date?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          expenses?: number
          id?: string
          location?: string
          name?: string
          start_date?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee"
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
      app_role: ["admin", "employee"],
    },
  },
} as const
