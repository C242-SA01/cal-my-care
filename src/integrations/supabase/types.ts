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
  public: {
    Tables: {
      bazar_events: {
        Row: {
          banner_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string
          id: string
          location: string
          start_date: string
          title: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          location: string
          start_date: string
          title: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          location?: string
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      bazar_registrations: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bazar_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "bazar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_comments: {
        Row: {
          body: string
          complaint_id: string
          created_at: string | null
          created_by: string
          id: string
        }
        Insert: {
          body: string
          complaint_id: string
          created_at?: string | null
          created_by: string
          id?: string
        }
        Update: {
          body?: string
          complaint_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_comments_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          category: string
          created_at: string | null
          created_by: string
          description: string
          id: string
          lat: number | null
          lng: number | null
          photo_url: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          lat?: number | null
          lng?: number | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          lat?: number | null
          lng?: number | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title?: string
        }
        Relationships: []
      }
      bookmarked_educations: {
        Row: {
          created_at: string
          education_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          education_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          education_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarked_educations_education_id_fkey"
            columns: ["education_id"]
            isOneToOne: false
            referencedRelation: "educations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarked_educations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      educations: {
        Row: {
          id: number
          title: string
          description: string | null
          cover_image_url: string | null
          pdf_url: string | null
          embed_url: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          title: string
          description?: string | null
          cover_image_url?: string | null
          pdf_url?: string | null
          embed_url?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never
          title?: string
          description?: string | null
          cover_image_url?: string | null
          pdf_url?: string | null
          embed_url?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      gad7_questions: {
        Row: {
          created_at: string | null
          id: string
          question_order: number
          question_text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_order: number
          question_text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_order?: number
          question_text?: string
        }
        Relationships: []
      }
      menus: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: number
          image: string | null
          name: string | null
          price: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: number
          image?: string | null
          name?: string | null
          price?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: number
          image?: string | null
          name?: string | null
          price?: number | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          consent_date: string | null
          consent_given: boolean | null
          created_at: string | null
          email: string | null
          full_name: string | null
          gestational_age: number | null
          id: string
          is_primigravida: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          consent_date?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gestational_age?: number | null
          id: string
          is_primigravida?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          consent_date?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gestational_age?: number | null
          id?: string
          is_primigravida?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_options: {
        Row: {
          created_at: string | null
          id: string
          is_correct: boolean | null
          option_order: number
          option_text: string
          question_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          option_order: number
          option_text: string
          question_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          option_order?: number
          option_text?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string | null
          id: string
          question_order: number
          question_text: string
          quiz_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_order: number
          question_text: string
          quiz_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_order?: number
          question_text?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          material_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          material_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          material_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "educational_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      screening_answers: {
        Row: {
          created_at: string | null
          id: string
          question_id: string
          score: number
          screening_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id: string
          score: number
          screening_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string
          score?: number
          screening_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screening_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "gad7_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screening_answers_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      screenings: {
        Row: {
          anxiety_level: Database["public"]["Enums"]["anxiety_level"] | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["screening_status"]
          total_score: number | null
          user_id: string
        }
        Insert: {
          anxiety_level?: Database["public"]["Enums"]["anxiety_level"] | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["screening_status"]
          total_score?: number | null
          user_id: string
        }
        Update: {
          anxiety_level?: Database["public"]["Enums"]["anxiety_level"] | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["screening_status"]
          total_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screenings_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          quiz_id: string
          score?: number
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_attempts_user_id_fkey"
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
      [_ in never]: never
    }
    Enums: {
      anxiety_level: "minimal" | "mild" | "moderate" | "severe"
      complaint_status: "baru" | "proses" | "selesai"
      screening_status: "in_progress" | "completed" | "reviewed"
      user_role: "patient" | "midwife" | "admin"
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
      anxiety_level: ["minimal", "mild", "moderate", "severe"],
      complaint_status: ["baru", "proses", "selesai"],
      screening_status: ["in_progress", "completed", "reviewed"],
      user_role: ["patient", "midwife", "admin"],
    },
  },
} as const
