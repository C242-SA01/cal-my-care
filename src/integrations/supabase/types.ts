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
      // ... (other tables remain unchanged)
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          full_name: string | null
          avatar_url: string | null
          email: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          // Fields expected by the app, which might not be in the auto-generated schema yet
          // We add them here to make TypeScript happy and to define our data model.
          is_first_login: boolean
          age: number | null
          gestational_age_weeks: number | null
          trimester: "I" | "II" | "III" | null
          education: "SD" | "SMP" | "SMA" | "D3" | "S1" | "S2" | "Lainnya" | null
          occupation: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          is_first_login?: boolean
          age?: number | null
          gestational_age_weeks?: number | null
          trimester?: "I" | "II" | "III" | null
          education?: "SD" | "SMP" | "SMA" | "D3" | "S1" | "S2" | "Lainnya" | null
          occupation?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          is_first_login?: boolean
          age?: number | null
          gestational_age_weeks?: number | null
          trimester?: "I" | "II" | "III" | null
          education?: "SD" | "SMP" | "SMA" | "D3" | "S1" | "S2" | "Lainnya" | null
          occupation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      calmy_notes: {
        Row: {
          id: string
          user_id: string
          note_date: string
          title: string | null
          content: string
          mood: Database["public"]["Enums"]["mood_enum"] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          note_date: string
          title?: string | null
          content: string
          mood?: Database["public"]["Enums"]["mood_enum"] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          note_date?: string
          title?: string | null
          content?: string
          mood?: Database["public"]["Enums"]["mood_enum"] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calmy_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // ... (other tables remain unchanged)
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      anxiety_level: "normal" | "ringan" | "sedang" | "berat"
      screening_status: "in_progress" | "completed" | "reviewed"
      user_role: "patient" | "midwife" | "admin"
      mood_enum: "senang" | "sedih" | "lelah" | "bersemangat" | "biasa"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}


// Manually define the Profile type for easier use in the app
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type CalmyNote = Database['public']['Tables']['calmy_notes']['Row'];

