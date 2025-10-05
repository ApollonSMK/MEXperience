
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
      bookings: {
        Row: {
          created_at: string
          date: string
          duration: number
          email: string | null
          id: number
          name: string | null
          service_id: string
          status: "Pendente" | "Confirmado" | "Cancelado"
          time: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          duration: number
          email?: string | null
          id?: number
          name?: string | null
          service_id: string
          status?: "Pendente" | "Confirmado" | "Cancelado"
          time: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          duration?: number
          email?: string | null
          id?: number
          name?: string | null
          service_id?: string
          status?: "Pendente" | "Confirmado" | "Cancelado"
          time?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: "user" | "admin" | null
          subscription_plan: string | null
          refunded_minutes: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: "user" | "admin" | null
          subscription_plan?: string | null
          refunded_minutes?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: "user" | "admin" | null
          subscription_plan?: string | null
          refunded_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          allowed_plans: string[] | null
          created_at: string
          description: string | null
          durations: number[]
          icon: string | null
          id: string
          imageId: string | null
          longDescription: string | null
          name: string
        }
        Insert: {
          allowed_plans?: string[] | null
          created_at?: string
          description?: string | null
          durations: number[]
          icon?: string | null
          id: string
          imageId?: string | null
          longDescription?: string | null
          name: string
        }
        Update: {
          allowed_plans?: string[] | null
          created_at?: string
          description?: string | null
          durations?: number[]
          icon?: string | null
          id?: string
          imageId?: string | null
          longDescription?: string | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_booking_and_refund_minutes: {
        Args: {
          p_booking_id: number
          p_user_id: string
          p_minutes_to_refund: number
        }
        Returns: undefined
      }
      create_booking_as_admin: {
        Args: {
          p_user_id: string
          p_service_id: string
          p_date: string
          p_time: string
          p_status: string
          p_duration: number
          p_name: string
          p_email: string
        }
        Returns: undefined
      }
      delete_booking_as_admin: {
        Args: {
          booking_id: number
        }
        Returns: undefined
      }
      get_all_bookings_with_details: {
        Args: {
          start_date: string
          end_date: string
        }
        Returns: {
          id: number
          created_at: string
          user_id: string
          service_id: string
          date: string
          time: string
          status: string
          duration: number
          name: string
          email: string
          avatar_url: string
        }[]
      }
      get_all_users_with_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          created_at: string
          full_name: string
          avatar_url: string
          email: string
          phone: string
          subscription_plan: string
          role: string
        }[]
      }
      update_booking_status_as_admin: {
        Args: {
          booking_id: number
          new_status: string
        }
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    _
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    _
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
