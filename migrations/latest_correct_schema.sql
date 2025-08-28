-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.adaptive_filters (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  filter_type text NOT NULL CHECK (filter_type = ANY (ARRAY['author'::text, 'journal'::text, 'year'::text, 'citation'::text, 'topic'::text, 'quality'::text])),
  condition_type text NOT NULL CHECK (condition_type = ANY (ARRAY['include'::text, 'exclude'::text, 'boost'::text, 'penalize'::text])),
  filter_value text NOT NULL,
  weight numeric DEFAULT 0.5 CHECK (weight >= 0::numeric AND weight <= 1::numeric),
  confidence numeric DEFAULT 0.5 CHECK (confidence >= 0::numeric AND confidence <= 1::numeric),
  source_type text NOT NULL CHECK (source_type = ANY (ARRAY['explicit_feedback'::text, 'implicit_behavior'::text, 'pattern_recognition'::text])),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT adaptive_filters_pkey PRIMARY KEY (id)
);
CREATE TABLE public.builder_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT builder_content_pkey PRIMARY KEY (id),
  CONSTRAINT builder_content_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chats(id)
);
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.citation_instances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  citation_style USER-DEFINED NOT NULL,
  citation_text text NOT NULL,
  document_position integer,
  context text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT citation_instances_pkey PRIMARY KEY (id),
  CONSTRAINT citation_instances_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chats(id),
  CONSTRAINT citation_instances_reference_id_fkey FOREIGN KEY (reference_id) REFERENCES public.references(id)
);
CREATE TABLE public.ideas (
  id bigint NOT NULL DEFAULT nextval('ideas_id_seq'::regclass),
  title character varying NOT NULL,
  description text,
  conversationid uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ideas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_ideas_conversationid FOREIGN KEY (conversationid) REFERENCES public.chats(id)
);
CREATE TABLE public.learning_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  total_feedback_count integer DEFAULT 0,
  positive_ratings integer DEFAULT 0,
  negative_ratings integer DEFAULT 0,
  average_rating numeric DEFAULT 0 CHECK (average_rating >= 0::numeric AND average_rating <= 5::numeric),
  improvement_trend numeric DEFAULT 0,
  confidence_level numeric DEFAULT 0 CHECK (confidence_level >= 0::numeric AND confidence_level <= 1::numeric),
  pattern_stability numeric DEFAULT 0 CHECK (pattern_stability >= 0::numeric AND pattern_stability <= 1::numeric),
  learning_effectiveness numeric DEFAULT 0 CHECK (learning_effectiveness >= 0::numeric AND learning_effectiveness <= 1::numeric),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT learning_metrics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid,
  role text NOT NULL,
  content text NOT NULL,
  message_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id)
);
CREATE TABLE public.privacy_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  conversation_id uuid,
  data_retention_days integer NOT NULL DEFAULT 365 CHECK (data_retention_days > 0),
  auto_delete_enabled boolean NOT NULL DEFAULT false,
  analytics_enabled boolean NOT NULL DEFAULT true,
  learning_enabled boolean NOT NULL DEFAULT true,
  export_format text NOT NULL DEFAULT 'json'::text CHECK (export_format = ANY (ARRAY['json'::text, 'csv'::text])),
  consent_given boolean NOT NULL DEFAULT false,
  consent_date timestamp with time zone,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT privacy_settings_pkey PRIMARY KEY (id),
  CONSTRAINT privacy_settings_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chats(id)
);
CREATE TABLE public.proofreading_concerns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  category USER-DEFINED NOT NULL,
  severity USER-DEFINED NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  location jsonb,
  suggestions ARRAY,
  related_ideas ARRAY,
  status USER-DEFINED NOT NULL DEFAULT 'to_be_done'::concern_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT proofreading_concerns_pkey PRIMARY KEY (id),
  CONSTRAINT proofreading_concerns_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chats(id)
);
CREATE TABLE public.proofreading_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  content_hash character varying NOT NULL,
  analysis_metadata jsonb,
  concerns_generated integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT proofreading_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT proofreading_sessions_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chats(id)
);
CREATE TABLE public.references (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  authors jsonb NOT NULL DEFAULT '[]'::jsonb,
  publication_date date,
  url text CHECK (url IS NULL OR url ~ '^https?://.*'::text),
  doi text CHECK (doi IS NULL OR doi ~ '^10\.\d{4,}/.*'::text),
  journal text,
  volume text,
  issue text,
  pages text,
  publisher text,
  isbn text,
  edition text,
  chapter text,
  editor text,
  access_date date,
  notes text,
  tags ARRAY DEFAULT '{}'::text[],
  metadata_confidence numeric DEFAULT 1.0 CHECK (metadata_confidence >= 0.0 AND metadata_confidence <= 1.0),
  ai_search_source text,
  ai_confidence numeric DEFAULT 0.8 CHECK (ai_confidence >= 0.0 AND ai_confidence <= 1.0),
  ai_relevance_score numeric DEFAULT 0,
  ai_search_query text,
  ai_search_timestamp timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT references_pkey PRIMARY KEY (id),
  CONSTRAINT references_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chats(id)
);
CREATE TABLE public.search_analytics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  user_id text NOT NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  total_searches integer DEFAULT 0,
  successful_searches integer DEFAULT 0,
  total_results integer DEFAULT 0,
  results_added integer DEFAULT 0,
  results_rejected integer DEFAULT 0,
  average_results_per_search numeric DEFAULT 0,
  average_relevance_score numeric DEFAULT 0,
  average_processing_time_ms integer DEFAULT 0,
  success_rate numeric DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  popular_topics jsonb DEFAULT '[]'::jsonb,
  popular_sources jsonb DEFAULT '[]'::jsonb,
  search_frequency jsonb DEFAULT '{}'::jsonb,
  user_satisfaction_score numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT search_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT search_analytics_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chats(id)
);
CREATE TABLE public.search_feedback (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  search_session_id uuid NOT NULL,
  user_id text NOT NULL,
  overall_satisfaction integer CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
  relevance_rating integer CHECK (relevance_rating >= 1 AND relevance_rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  ease_of_use_rating integer CHECK (ease_of_use_rating >= 1 AND ease_of_use_rating <= 5),
  feedback_comments text,
  would_recommend boolean,
  improvement_suggestions text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT search_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT search_feedback_search_session_id_fkey FOREIGN KEY (search_session_id) REFERENCES public.search_sessions(id)
);
CREATE TABLE public.search_results (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  search_session_id uuid NOT NULL,
  reference_id uuid,
  result_title text NOT NULL,
  result_authors jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_journal text,
  result_year integer,
  result_doi text,
  result_url text,
  relevance_score numeric DEFAULT 0,
  confidence_score numeric DEFAULT 0,
  quality_score numeric DEFAULT 0,
  citation_count integer DEFAULT 0,
  user_action text CHECK (user_action = ANY (ARRAY['viewed'::text, 'added'::text, 'rejected'::text, 'bookmarked'::text, 'ignored'::text])),
  user_feedback_rating integer CHECK (user_feedback_rating >= 1 AND user_feedback_rating <= 5),
  user_feedback_comments text,
  added_to_library boolean DEFAULT false,
  added_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT search_results_pkey PRIMARY KEY (id),
  CONSTRAINT search_results_reference_id_fkey FOREIGN KEY (reference_id) REFERENCES public.references(id),
  CONSTRAINT search_results_search_session_id_fkey FOREIGN KEY (search_session_id) REFERENCES public.search_sessions(id)
);
CREATE TABLE public.search_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  user_id text NOT NULL,
  search_query text NOT NULL,
  content_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  search_filters jsonb DEFAULT '{}'::jsonb,
  results_count integer DEFAULT 0,
  results_accepted integer DEFAULT 0,
  results_rejected integer DEFAULT 0,
  search_success boolean DEFAULT false,
  processing_time_ms integer DEFAULT 0 CHECK (processing_time_ms >= 0),
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT search_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT search_sessions_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chats(id)
);
CREATE TABLE public.user_feedback_learning (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  search_session_id uuid NOT NULL,
  result_id text NOT NULL,
  is_relevant boolean NOT NULL,
  quality_rating integer NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
  comments text,
  result_title text NOT NULL,
  result_authors jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_journal text,
  result_year integer,
  citation_count integer DEFAULT 0 CHECK (citation_count >= 0),
  result_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_feedback_learning_pkey PRIMARY KEY (id),
  CONSTRAINT user_feedback_learning_search_session_id_fkey FOREIGN KEY (search_session_id) REFERENCES public.search_sessions(id)
);
CREATE TABLE public.user_preference_patterns (
  user_id text NOT NULL,
  preferred_authors jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_journals jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_year_range jsonb NOT NULL DEFAULT '{"max": 2024, "min": 2010}'::jsonb,
  preferred_citation_range jsonb NOT NULL DEFAULT '{"max": 10000, "min": 0}'::jsonb,
  topic_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  quality_threshold numeric DEFAULT 0.5 CHECK (quality_threshold >= 0::numeric AND quality_threshold <= 1::numeric),
  relevance_threshold numeric DEFAULT 0.5 CHECK (relevance_threshold >= 0::numeric AND relevance_threshold <= 1::numeric),
  rejection_patterns jsonb NOT NULL DEFAULT '{"authors": [], "journals": [], "keywords": []}'::jsonb,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preference_patterns_pkey PRIMARY KEY (user_id)
);