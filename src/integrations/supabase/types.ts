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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      brand_domains: {
        Row: {
          brand_id: string
          created_at: string
          domain: string
          id: string
          is_primary: boolean
          primary_language: string
          status: string
          target_markets: string[]
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          domain: string
          id?: string
          is_primary?: boolean
          primary_language?: string
          status?: string
          target_markets?: string[]
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          domain?: string
          id?: string
          is_primary?: boolean
          primary_language?: string
          status?: string
          target_markets?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_domains_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_intelligence: {
        Row: {
          approved: boolean
          audiences: Json
          brand_id: string
          competitors: Json
          created_at: string
          id: string
          keywords: Json
          positioning: string | null
          products: Json
          summary: string | null
          tone: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          audiences?: Json
          brand_id: string
          competitors?: Json
          created_at?: string
          id?: string
          keywords?: Json
          positioning?: string | null
          products?: Json
          summary?: string | null
          tone?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          audiences?: Json
          brand_id?: string
          competitors?: Json
          created_at?: string
          id?: string
          keywords?: Json
          positioning?: string | null
          products?: Json
          summary?: string | null
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_intelligence_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_members: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_members_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          created_by: string
          domain: string
          id: string
          name: string
          onboarding_completed: boolean
          onboarding_step: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          domain: string
          id?: string
          name: string
          onboarding_completed?: boolean
          onboarding_step?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          domain?: string
          id?: string
          name?: string
          onboarding_completed?: boolean
          onboarding_step?: number
          updated_at?: string
        }
        Relationships: []
      }
      citations: {
        Row: {
          brand_id: string
          created_at: string
          domain: string
          id: string
          is_own_domain: boolean
          run_id: string | null
          url: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          domain: string
          id?: string
          is_own_domain?: boolean
          run_id?: string | null
          url: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          domain?: string
          id?: string
          is_own_domain?: boolean
          run_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "citations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citations_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "prompt_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          brand_id: string
          created_at: string
          evidence_url: string | null
          id: string
          statement: string
          status: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          evidence_url?: string | null
          id?: string
          statement: string
          status?: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          evidence_url?: string | null
          id?: string
          statement?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_tasks: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_tasks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          brand_id: string
          content: string | null
          created_at: string
          id: string
          source_type: string
          status: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          brand_id: string
          content?: string | null
          created_at?: string
          id?: string
          source_type?: string
          status?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          brand_id?: string
          content?: string | null
          created_at?: string
          id?: string
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
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
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_runs: {
        Row: {
          answer_summary: string | null
          brand_id: string
          brand_mentioned: boolean
          created_at: string
          engine: string
          id: string
          position: number | null
          prompt_id: string
          raw_answer: string | null
        }
        Insert: {
          answer_summary?: string | null
          brand_id: string
          brand_mentioned?: boolean
          created_at?: string
          engine?: string
          id?: string
          position?: number | null
          prompt_id: string
          raw_answer?: string | null
        }
        Update: {
          answer_summary?: string | null
          brand_id?: string
          brand_mentioned?: boolean
          created_at?: string
          engine?: string
          id?: string
          position?: number | null
          prompt_id?: string
          raw_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_runs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_runs_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          brand_id: string
          category: string
          created_at: string
          id: string
          intent: string | null
          origin: string
          status: string
          text: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          category?: string
          created_at?: string
          id?: string
          intent?: string | null
          origin?: string
          status?: string
          text: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category?: string
          created_at?: string
          id?: string
          intent?: string | null
          origin?: string
          status?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          is_public: boolean
          payload: Json
          title: string
          token: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          is_public?: boolean
          payload?: Json
          title: string
          token: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          is_public?: boolean
          payload?: Json
          title?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      is_brand_member: {
        Args: { _brand_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
      app_role: ["admin", "member"],
    },
  },
} as const
