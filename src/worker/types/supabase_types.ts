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
      adaptive_filters: {
        Row: {
          condition_type: string
          confidence: number | null
          created_at: string | null
          filter_type: string
          filter_value: string
          id: string
          is_active: boolean | null
          source_type: string
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          condition_type: string
          confidence?: number | null
          created_at?: string | null
          filter_type: string
          filter_value: string
          id?: string
          is_active?: boolean | null
          source_type: string
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          condition_type?: string
          confidence?: number | null
          created_at?: string | null
          filter_type?: string
          filter_value?: string
          id?: string
          is_active?: boolean | null
          source_type?: string
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      builder_content: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "builder_content_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      citation_instances: {
        Row: {
          citation_style: Database["public"]["Enums"]["citation_style"]
          citation_text: string
          context: string | null
          conversation_id: string
          created_at: string | null
          document_position: number | null
          id: string
          reference_id: string
        }
        Insert: {
          citation_style: Database["public"]["Enums"]["citation_style"]
          citation_text: string
          context?: string | null
          conversation_id: string
          created_at?: string | null
          document_position?: number | null
          id?: string
          reference_id: string
        }
        Update: {
          citation_style?: Database["public"]["Enums"]["citation_style"]
          citation_text?: string
          context?: string | null
          conversation_id?: string
          created_at?: string | null
          document_position?: number | null
          id?: string
          reference_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "citation_instances_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citation_instances_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "references"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          conversationid: string | null
          created_at: string | null
          description: string | null
          id: number
          title: string
          updated_at: string | null
        }
        Insert: {
          conversationid?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          conversationid?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ideas_conversationid"
            columns: ["conversationid"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_metrics: {
        Row: {
          average_rating: number | null
          confidence_level: number | null
          created_at: string | null
          id: string
          improvement_trend: number | null
          learning_effectiveness: number | null
          negative_ratings: number | null
          pattern_stability: number | null
          period_end: string
          period_start: string
          positive_ratings: number | null
          total_feedback_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_rating?: number | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          improvement_trend?: number | null
          learning_effectiveness?: number | null
          negative_ratings?: number | null
          pattern_stability?: number | null
          period_end: string
          period_start: string
          positive_ratings?: number | null
          total_feedback_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_rating?: number | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          improvement_trend?: number | null
          learning_effectiveness?: number | null
          negative_ratings?: number | null
          pattern_stability?: number | null
          period_end?: string
          period_start?: string
          positive_ratings?: number | null
          total_feedback_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string | null
          content: string
          created_at: string | null
          id: string
          message_id: string
          role: string
        }
        Insert: {
          chat_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          message_id: string
          role: string
        }
        Update: {
          chat_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          message_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_settings: {
        Row: {
          analytics_enabled: boolean
          auto_delete_enabled: boolean
          consent_date: string | null
          consent_given: boolean
          conversation_id: string | null
          created_at: string | null
          data_retention_days: number
          export_format: string
          id: string
          last_updated: string | null
          learning_enabled: boolean
          user_id: string
        }
        Insert: {
          analytics_enabled?: boolean
          auto_delete_enabled?: boolean
          consent_date?: string | null
          consent_given?: boolean
          conversation_id?: string | null
          created_at?: string | null
          data_retention_days?: number
          export_format?: string
          id?: string
          last_updated?: string | null
          learning_enabled?: boolean
          user_id: string
        }
        Update: {
          analytics_enabled?: boolean
          auto_delete_enabled?: boolean
          consent_date?: string | null
          consent_given?: boolean
          conversation_id?: string | null
          created_at?: string | null
          data_retention_days?: number
          export_format?: string
          id?: string
          last_updated?: string | null
          learning_enabled?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "privacy_settings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      proofreading_concerns: {
        Row: {
          category: Database["public"]["Enums"]["concern_category"]
          conversation_id: string
          created_at: string | null
          description: string
          ai_generated: boolean
          id: string
          location: Json | null
          related_ideas: string[] | null
          severity: Database["public"]["Enums"]["concern_severity"]
          status: Database["public"]["Enums"]["concern_status"]
          suggestions: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["concern_category"]
          conversation_id: string
          created_at?: string | null
          description: string
          ai_generated?: boolean
          id?: string
          location?: Json | null
          related_ideas?: string[] | null
          severity: Database["public"]["Enums"]["concern_severity"]
          status?: Database["public"]["Enums"]["concern_status"]
          suggestions?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["concern_category"]
          conversation_id?: string
          created_at?: string | null
          description?: string
          ai_generated?: boolean
          id?: string
          location?: Json | null
          related_ideas?: string[] | null
          severity?: Database["public"]["Enums"]["concern_severity"]
          status?: Database["public"]["Enums"]["concern_status"]
          suggestions?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proofreading_concerns_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      proofreading_sessions: {
        Row: {
          analysis_metadata: Json | null
          concerns_generated: number | null
          content_hash: string
          conversation_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          analysis_metadata?: Json | null
          concerns_generated?: number | null
          content_hash: string
          conversation_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          analysis_metadata?: Json | null
          concerns_generated?: number | null
          content_hash?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proofreading_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      references: {
        Row: {
          access_date: string | null
          ai_confidence: number | null
          ai_relevance_score: number | null
          ai_search_query: string | null
          ai_search_source: string | null
          ai_search_timestamp: string | null
          authors: Json
          chapter: string | null
          conversation_id: string
          created_at: string | null
          doi: string | null
          edition: string | null
          editor: string | null
          id: string
          isbn: string | null
          issue: string | null
          journal: string | null
          metadata_confidence: number | null
          notes: string | null
          pages: string | null
          publication_date: string | null
          publisher: string | null
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["reference_type"]
          updated_at: string | null
          url: string | null
          volume: string | null
        }
        Insert: {
          access_date?: string | null
          ai_confidence?: number | null
          ai_relevance_score?: number | null
          ai_search_query?: string | null
          ai_search_source?: string | null
          ai_search_timestamp?: string | null
          authors?: Json
          chapter?: string | null
          conversation_id: string
          created_at?: string | null
          doi?: string | null
          edition?: string | null
          editor?: string | null
          id?: string
          isbn?: string | null
          issue?: string | null
          journal?: string | null
          metadata_confidence?: number | null
          notes?: string | null
          pages?: string | null
          publication_date?: string | null
          publisher?: string | null
          tags?: string[] | null
          title: string
          type: Database["public"]["Enums"]["reference_type"]
          updated_at?: string | null
          url?: string | null
          volume?: string | null
        }
        Update: {
          access_date?: string | null
          ai_confidence?: number | null
          ai_relevance_score?: number | null
          ai_search_query?: string | null
          ai_search_source?: string | null
          ai_search_timestamp?: string | null
          authors?: Json
          chapter?: string | null
          conversation_id?: string
          created_at?: string | null
          doi?: string | null
          edition?: string | null
          editor?: string | null
          id?: string
          isbn?: string | null
          issue?: string | null
          journal?: string | null
          metadata_confidence?: number | null
          notes?: string | null
          pages?: string | null
          publication_date?: string | null
          publisher?: string | null
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["reference_type"]
          updated_at?: string | null
          url?: string | null
          volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "references_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      search_analytics: {
        Row: {
          average_processing_time_ms: number | null
          average_relevance_score: number | null
          average_results_per_search: number | null
          conversation_id: string
          conversion_rate: number | null
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          popular_sources: Json | null
          popular_topics: Json | null
          results_added: number | null
          results_rejected: number | null
          search_frequency: Json | null
          success_rate: number | null
          successful_searches: number | null
          total_results: number | null
          total_searches: number | null
          updated_at: string | null
          user_id: string
          user_satisfaction_score: number | null
        }
        Insert: {
          average_processing_time_ms?: number | null
          average_relevance_score?: number | null
          average_results_per_search?: number | null
          conversation_id: string
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          popular_sources?: Json | null
          popular_topics?: Json | null
          results_added?: number | null
          results_rejected?: number | null
          search_frequency?: Json | null
          success_rate?: number | null
          successful_searches?: number | null
          total_results?: number | null
          total_searches?: number | null
          updated_at?: string | null
          user_id: string
          user_satisfaction_score?: number | null
        }
        Update: {
          average_processing_time_ms?: number | null
          average_relevance_score?: number | null
          average_results_per_search?: number | null
          conversation_id?: string
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          popular_sources?: Json | null
          popular_topics?: Json | null
          results_added?: number | null
          results_rejected?: number | null
          search_frequency?: Json | null
          success_rate?: number | null
          successful_searches?: number | null
          total_results?: number | null
          total_searches?: number | null
          updated_at?: string | null
          user_id?: string
          user_satisfaction_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "search_analytics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      search_feedback: {
        Row: {
          created_at: string | null
          ease_of_use_rating: number | null
          feedback_comments: string | null
          id: string
          improvement_suggestions: string | null
          overall_satisfaction: number | null
          quality_rating: number | null
          relevance_rating: number | null
          search_session_id: string
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          created_at?: string | null
          ease_of_use_rating?: number | null
          feedback_comments?: string | null
          id?: string
          improvement_suggestions?: string | null
          overall_satisfaction?: number | null
          quality_rating?: number | null
          relevance_rating?: number | null
          search_session_id: string
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          created_at?: string | null
          ease_of_use_rating?: number | null
          feedback_comments?: string | null
          id?: string
          improvement_suggestions?: string | null
          overall_satisfaction?: number | null
          quality_rating?: number | null
          relevance_rating?: number | null
          search_session_id?: string
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "search_feedback_search_session_id_fkey"
            columns: ["search_session_id"]
            isOneToOne: false
            referencedRelation: "search_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      search_results: {
        Row: {
          added_at: string | null
          added_to_library: boolean | null
          citation_count: number | null
          confidence_score: number | null
          created_at: string | null
          id: string
          quality_score: number | null
          reference_id: string | null
          relevance_score: number | null
          result_authors: Json
          result_doi: string | null
          result_journal: string | null
          result_title: string
          result_url: string | null
          result_year: number | null
          search_session_id: string
          user_action: string | null
          user_feedback_comments: string | null
          user_feedback_rating: number | null
        }
        Insert: {
          added_at?: string | null
          added_to_library?: boolean | null
          citation_count?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          quality_score?: number | null
          reference_id?: string | null
          relevance_score?: number | null
          result_authors?: Json
          result_doi?: string | null
          result_journal?: string | null
          result_title: string
          result_url?: string | null
          result_year?: number | null
          search_session_id: string
          user_action?: string | null
          user_feedback_comments?: string | null
          user_feedback_rating?: number | null
        }
        Update: {
          added_at?: string | null
          added_to_library?: boolean | null
          citation_count?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          quality_score?: number | null
          reference_id?: string | null
          relevance_score?: number | null
          result_authors?: Json
          result_doi?: string | null
          result_journal?: string | null
          result_title?: string
          result_url?: string | null
          result_year?: number | null
          search_session_id?: string
          user_action?: string | null
          user_feedback_comments?: string | null
          user_feedback_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "search_results_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_results_search_session_id_fkey"
            columns: ["search_session_id"]
            isOneToOne: false
            referencedRelation: "search_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      search_sessions: {
        Row: {
          content_sources: Json
          conversation_id: string
          created_at: string | null
          error_message: string | null
          id: string
          processing_time_ms: number | null
          results_accepted: number | null
          results_count: number | null
          results_rejected: number | null
          search_filters: Json | null
          search_query: string
          search_success: boolean | null
          user_id: string
        }
        Insert: {
          content_sources?: Json
          conversation_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          processing_time_ms?: number | null
          results_accepted?: number | null
          results_count?: number | null
          results_rejected?: number | null
          search_filters?: Json | null
          search_query: string
          search_success?: boolean | null
          user_id: string
        }
        Update: {
          content_sources?: Json
          conversation_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          processing_time_ms?: number | null
          results_accepted?: number | null
          results_count?: number | null
          results_rejected?: number | null
          search_filters?: Json | null
          search_query?: string
          search_success?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback_learning: {
        Row: {
          citation_count: number | null
          comments: string | null
          created_at: string | null
          id: string
          is_relevant: boolean
          quality_rating: number
          result_authors: Json
          result_id: string
          result_journal: string | null
          result_title: string
          result_topics: Json
          result_year: number | null
          search_session_id: string
          user_id: string
        }
        Insert: {
          citation_count?: number | null
          comments?: string | null
          created_at?: string | null
          id?: string
          is_relevant: boolean
          quality_rating: number
          result_authors?: Json
          result_id: string
          result_journal?: string | null
          result_title: string
          result_topics?: Json
          result_year?: number | null
          search_session_id: string
          user_id: string
        }
        Update: {
          citation_count?: number | null
          comments?: string | null
          created_at?: string | null
          id?: string
          is_relevant?: boolean
          quality_rating?: number
          result_authors?: Json
          result_id?: string
          result_journal?: string | null
          result_title?: string
          result_topics?: Json
          result_year?: number | null
          search_session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_learning_search_session_id_fkey"
            columns: ["search_session_id"]
            isOneToOne: false
            referencedRelation: "search_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preference_patterns: {
        Row: {
          last_updated: string | null
          preferred_authors: Json
          preferred_citation_range: Json
          preferred_journals: Json
          preferred_year_range: Json
          quality_threshold: number | null
          rejection_patterns: Json
          relevance_threshold: number | null
          topic_preferences: Json
          user_id: string
        }
        Insert: {
          last_updated?: string | null
          preferred_authors?: Json
          preferred_citation_range?: Json
          preferred_journals?: Json
          preferred_year_range?: Json
          quality_threshold?: number | null
          rejection_patterns?: Json
          relevance_threshold?: number | null
          topic_preferences?: Json
          user_id: string
        }
        Update: {
          last_updated?: string | null
          preferred_authors?: Json
          preferred_citation_range?: Json
          preferred_journals?: Json
          preferred_year_range?: Json
          quality_threshold?: number | null
          rejection_patterns?: Json
          relevance_threshold?: number | null
          topic_preferences?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_user_data: {
        Args: { target_user_id: string }
        Returns: number
      }
      cleanup_old_data_for_user: {
        Args: { target_conversation_id?: string; target_user_id: string }
        Returns: number
      }
      run_automatic_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: {
          conversation_id: string
          deleted_count: number
          user_id: string
        }[]
      }
      update_learning_metrics_for_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      citation_style:
        | "apa"
        | "mla"
        | "chicago"
        | "harvard"
        | "ieee"
        | "vancouver"
      concern_category:
        | "clarity"
        | "coherence"
        | "structure"
        | "academic_style"
        | "consistency"
        | "completeness"
        | "citations"
        | "grammar"
        | "terminology"
      concern_severity: "low" | "medium" | "high" | "critical"
      concern_status: "to_be_done" | "addressed" | "rejected"
      message_role: "user" | "assistant"
      reference_type:
        | "journal_article"
        | "book"
        | "book_chapter"
        | "conference_paper"
        | "thesis"
        | "website"
        | "report"
        | "patent"
        | "other"
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
      citation_style: ["apa", "mla", "chicago", "harvard", "ieee", "vancouver"],
      concern_category: [
        "clarity",
        "coherence",
        "structure",
        "academic_style",
        "consistency",
        "completeness",
        "citations",
        "grammar",
        "terminology",
      ],
      concern_severity: ["low", "medium", "high", "critical"],
      concern_status: ["to_be_done", "addressed", "rejected"],
      message_role: ["user", "assistant"],
      reference_type: [
        "journal_article",
        "book",
        "book_chapter",
        "conference_paper",
        "thesis",
        "website",
        "report",
        "patent",
        "other",
      ],
    },
  },
} as const
