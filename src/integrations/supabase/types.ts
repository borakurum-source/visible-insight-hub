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
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string
          created_at: string
          detail: Json
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id: string
          created_at?: string
          detail?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string
          created_at?: string
          detail?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          note: string
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          note: string
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          note?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          kind: string
          payload: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at: string
          kind: string
          payload: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          kind?: string
          payload?: Json
        }
        Relationships: []
      }
      analytics_snapshots: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          payload: Json
          provider: string
          snapshot_date: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          payload?: Json
          provider: string
          snapshot_date?: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          payload?: Json
          provider?: string
          snapshot_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_log: {
        Row: {
          brand_id: string | null
          cached: boolean
          cost_usd: number
          created_at: string
          duration_ms: number
          error: string | null
          id: string
          input_tokens: number
          model: string | null
          operation: string
          output_tokens: number
          provider: string
          status: string
          user_id: string | null
        }
        Insert: {
          brand_id?: string | null
          cached?: boolean
          cost_usd?: number
          created_at?: string
          duration_ms?: number
          error?: string | null
          id?: string
          input_tokens?: number
          model?: string | null
          operation: string
          output_tokens?: number
          provider: string
          status?: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string | null
          cached?: boolean
          cost_usd?: number
          created_at?: string
          duration_ms?: number
          error?: string | null
          id?: string
          input_tokens?: number
          model?: string | null
          operation?: string
          output_tokens?: number
          provider?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bing_webmaster_accounts: {
        Row: {
          api_key: string
          brand_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          api_key: string
          brand_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          brand_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bing_webmaster_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          answer_summary: string
          author: string
          body: string
          canonical_url: string | null
          category: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string
          faq: Json
          id: string
          og_image_url: string | null
          published_at: string | null
          read_minutes: number
          slug: string
          sources: Json
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          answer_summary?: string
          author?: string
          body?: string
          canonical_url?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          faq?: Json
          id?: string
          og_image_url?: string | null
          published_at?: string | null
          read_minutes?: number
          slug: string
          sources?: Json
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          answer_summary?: string
          author?: string
          body?: string
          canonical_url?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          faq?: Json
          id?: string
          og_image_url?: string | null
          published_at?: string | null
          read_minutes?: number
          slug?: string
          sources?: Json
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          detailed_description: string | null
          id: string
          industry: string | null
          key_features: Json
          keywords: Json
          language: string | null
          location: string | null
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
          detailed_description?: string | null
          id?: string
          industry?: string | null
          key_features?: Json
          keywords?: Json
          language?: string | null
          location?: string | null
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
          detailed_description?: string | null
          id?: string
          industry?: string | null
          key_features?: Json
          keywords?: Json
          language?: string | null
          location?: string | null
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
          engines: string[]
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
          engines?: string[]
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
          engines?: string[]
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
          citation_type: string
          created_at: string
          domain: string
          id: string
          is_own_domain: boolean
          prompt_id: string | null
          run_id: string | null
          title: string | null
          url: string
        }
        Insert: {
          brand_id: string
          citation_type?: string
          created_at?: string
          domain: string
          id?: string
          is_own_domain?: boolean
          prompt_id?: string | null
          run_id?: string | null
          title?: string | null
          url: string
        }
        Update: {
          brand_id?: string
          citation_type?: string
          created_at?: string
          domain?: string
          id?: string
          is_own_domain?: boolean
          prompt_id?: string | null
          run_id?: string | null
          title?: string | null
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
            foreignKeyName: "citations_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
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
      competitor_candidates: {
        Row: {
          brand_id: string
          created_at: string
          domain: string | null
          first_seen_prompt_id: string | null
          first_seen_run_id: string | null
          id: string
          name: string
          prompt_count: number
          status: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          domain?: string | null
          first_seen_prompt_id?: string | null
          first_seen_run_id?: string | null
          id?: string
          name: string
          prompt_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          domain?: string | null
          first_seen_prompt_id?: string | null
          first_seen_run_id?: string | null
          id?: string
          name?: string
          prompt_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_candidates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_candidates_first_seen_prompt_id_fkey"
            columns: ["first_seen_prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_candidates_first_seen_run_id_fkey"
            columns: ["first_seen_run_id"]
            isOneToOne: false
            referencedRelation: "prompt_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      content_drafts: {
        Row: {
          body: string
          brand_id: string
          created_at: string
          id: string
          prompt_id: string | null
          sources: Json
          status: string
          target_prompt: string | null
          title: string
          updated_at: string
          word_count: number
        }
        Insert: {
          body?: string
          brand_id: string
          created_at?: string
          id?: string
          prompt_id?: string | null
          sources?: Json
          status?: string
          target_prompt?: string | null
          title: string
          updated_at?: string
          word_count?: number
        }
        Update: {
          body?: string
          brand_id?: string
          created_at?: string
          id?: string
          prompt_id?: string | null
          sources?: Json
          status?: string
          target_prompt?: string | null
          title?: string
          updated_at?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_drafts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_drafts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json
          status: string
          subject: string
          template_key: string | null
          to_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          status?: string
          subject: string
          template_key?: string | null
          to_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          status?: string
          subject?: string
          template_key?: string | null
          to_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          key: string
          subject: string
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          key: string
          subject: string
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          key?: string
          subject?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          brand_id: string | null
          context: Json
          created_at: string
          fingerprint: string | null
          id: string
          level: string
          message: string
          path: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          source: string
          stack: string | null
          user_id: string | null
        }
        Insert: {
          brand_id?: string | null
          context?: Json
          created_at?: string
          fingerprint?: string | null
          id?: string
          level?: string
          message: string
          path?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string
          stack?: string | null
          user_id?: string | null
        }
        Update: {
          brand_id?: string | null
          context?: Json
          created_at?: string
          fingerprint?: string | null
          id?: string
          level?: string
          message?: string
          path?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string
          stack?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      google_oauth_accounts: {
        Row: {
          access_token: string | null
          access_token_expires_at: string | null
          brand_id: string
          created_at: string
          created_by: string
          google_email: string | null
          id: string
          refresh_token: string
          scopes: string[]
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          access_token_expires_at?: string | null
          brand_id: string
          created_at?: string
          created_by?: string
          google_email?: string | null
          id?: string
          refresh_token: string
          scopes?: string[]
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          access_token_expires_at?: string | null
          brand_id?: string
          created_at?: string
          created_by?: string
          google_email?: string | null
          id?: string
          refresh_token?: string
          scopes?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_oauth_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_edges: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          relation: string
          source_key: string
          target_key: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          relation?: string
          source_key: string
          target_key: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          relation?: string
          source_key?: string
          target_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_edges_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_entities: {
        Row: {
          brand_id: string
          created_at: string
          entity_type: string
          id: string
          key: string
          label: string
          updated_at: string
          weight: number
        }
        Insert: {
          brand_id: string
          created_at?: string
          entity_type?: string
          id?: string
          key: string
          label: string
          updated_at?: string
          weight?: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          entity_type?: string
          id?: string
          key?: string
          label?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "graph_entities_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          brand_id: string
          config: Json
          created_at: string
          id: string
          last_error: string | null
          last_sync_at: string | null
          property_id: string | null
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          config?: Json
          created_at?: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          property_id?: string | null
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          config?: Json
          created_at?: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          property_id?: string | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_chunks: {
        Row: {
          brand_id: string
          chunk_index: number
          content: string
          content_hash: string
          created_at: string
          embedding: string | null
          heading: string | null
          id: string
          source_id: string | null
          source_type: string
          source_weight: number
          token_estimate: number
          tsv: unknown
          updated_at: string
          x: number | null
          y: number | null
          z: number | null
        }
        Insert: {
          brand_id: string
          chunk_index?: number
          content: string
          content_hash?: string
          created_at?: string
          embedding?: string | null
          heading?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          source_weight?: number
          token_estimate?: number
          tsv?: unknown
          updated_at?: string
          x?: number | null
          y?: number | null
          z?: number | null
        }
        Update: {
          brand_id?: string
          chunk_index?: number
          content?: string
          content_hash?: string
          created_at?: string
          embedding?: string | null
          heading?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          source_weight?: number
          token_estimate?: number
          tsv?: unknown
          updated_at?: string
          x?: number | null
          y?: number | null
          z?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_chunks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          brand_id: string
          chunk_count: number
          content: string | null
          content_hash: string | null
          created_at: string
          etag: string | null
          excluded: boolean
          extract_method: string | null
          id: string
          index_status: string
          indexed_at: string | null
          last_checked_at: string | null
          last_modified: string | null
          noise_ratio: number
          quality_score: number
          source_type: string
          status: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          brand_id: string
          chunk_count?: number
          content?: string | null
          content_hash?: string | null
          created_at?: string
          etag?: string | null
          excluded?: boolean
          extract_method?: string | null
          id?: string
          index_status?: string
          indexed_at?: string | null
          last_checked_at?: string | null
          last_modified?: string | null
          noise_ratio?: number
          quality_score?: number
          source_type?: string
          status?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          brand_id?: string
          chunk_count?: number
          content?: string | null
          content_hash?: string | null
          created_at?: string
          etag?: string | null
          excluded?: boolean
          extract_method?: string | null
          id?: string
          index_status?: string
          indexed_at?: string | null
          last_checked_at?: string | null
          last_modified?: string | null
          noise_ratio?: number
          quality_score?: number
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
      measurement_batches: {
        Row: {
          brand_id: string
          completed_prompts: number
          components: Json
          created_at: string
          engine: string
          error: string | null
          finished_at: string | null
          id: string
          score: number | null
          status: string
          total_prompts: number
        }
        Insert: {
          brand_id: string
          completed_prompts?: number
          components?: Json
          created_at?: string
          engine?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          score?: number | null
          status?: string
          total_prompts?: number
        }
        Update: {
          brand_id?: string
          completed_prompts?: number
          components?: Json
          created_at?: string
          engine?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          score?: number | null
          status?: string
          total_prompts?: number
        }
        Relationships: [
          {
            foreignKeyName: "measurement_batches_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_note: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          plan: string
          plan_expires_at: string | null
          plan_source: string
          suspended: boolean
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          plan?: string
          plan_expires_at?: string | null
          plan_source?: string
          suspended?: boolean
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          plan?: string
          plan_expires_at?: string | null
          plan_source?: string
          suspended?: boolean
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_action_items: {
        Row: {
          action_key: string
          brand_id: string
          created_at: string
          description: string | null
          done: boolean
          done_at: string | null
          id: string
          priority: string
          prompt_id: string
          title: string
          updated_at: string
        }
        Insert: {
          action_key: string
          brand_id: string
          created_at?: string
          description?: string | null
          done?: boolean
          done_at?: string | null
          id?: string
          priority?: string
          prompt_id: string
          title: string
          updated_at?: string
        }
        Update: {
          action_key?: string
          brand_id?: string
          created_at?: string
          description?: string | null
          done?: boolean
          done_at?: string | null
          id?: string
          priority?: string
          prompt_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_action_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_action_items_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_runs: {
        Row: {
          answer_summary: string | null
          brand_id: string
          brand_mentioned: boolean
          created_at: string
          engine: string
          id: string
          mentioned_brands: Json
          position: number | null
          prompt_id: string
          raw_answer: string | null
          run_index: number | null
          visibility: number | null
        }
        Insert: {
          answer_summary?: string | null
          brand_id: string
          brand_mentioned?: boolean
          created_at?: string
          engine?: string
          id?: string
          mentioned_brands?: Json
          position?: number | null
          prompt_id: string
          raw_answer?: string | null
          run_index?: number | null
          visibility?: number | null
        }
        Update: {
          answer_summary?: string | null
          brand_id?: string
          brand_mentioned?: boolean
          created_at?: string
          engine?: string
          id?: string
          mentioned_brands?: Json
          position?: number | null
          prompt_id?: string
          raw_answer?: string | null
          run_index?: number | null
          visibility?: number | null
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
          funnel_stage: string
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
          funnel_stage?: string
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
          funnel_stage?: string
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
      public_reports: {
        Row: {
          category_scores: Json
          citation: Json
          created_at: string
          domain: string
          email: string | null
          findings: Json
          id: string
          score: number
          token: string
          updated_at: string
        }
        Insert: {
          category_scores?: Json
          citation?: Json
          created_at?: string
          domain: string
          email?: string | null
          findings?: Json
          id?: string
          score?: number
          token: string
          updated_at?: string
        }
        Update: {
          category_scores?: Json
          citation?: Json
          created_at?: string
          domain?: string
          email?: string | null
          findings?: Json
          id?: string
          score?: number
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          payload: Json
          title: string
          token: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          payload?: Json
          title: string
          token: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
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
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_prompts: {
        Row: {
          content: string
          created_at: string
          description: string
          id: string
          key: string
          model: string
          stage: string
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          description?: string
          id?: string
          key: string
          model?: string
          stage?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          description?: string
          id?: string
          key?: string
          model?: string
          stage?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
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
      expire_subscription_plans: { Args: never; Returns: undefined }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
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
      match_kb_chunks:
        | {
            Args: {
              _brand_id: string
              match_count?: number
              query_embedding: string
            }
            Returns: {
              content: string
              id: string
              score: number
              similarity: number
              source_id: string
              source_type: string
            }[]
          }
        | {
            Args: {
              _brand_id: string
              match_count?: number
              min_similarity?: number
              per_source_limit?: number
              query_embedding: string
            }
            Returns: {
              content: string
              heading: string
              id: string
              score: number
              similarity: number
              source_id: string
              source_type: string
            }[]
          }
      match_kb_hybrid: {
        Args: {
          _brand_id: string
          match_count?: number
          min_similarity?: number
          per_source_limit?: number
          query_embedding: string
          query_text: string
        }
        Returns: {
          content: string
          heading: string
          id: string
          score: number
          similarity: number
          source_id: string
          source_type: string
        }[]
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
