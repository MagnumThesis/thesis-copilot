-- Migration v6: Create search analytics and tracking tables
-- This migration adds tables for tracking AI search results and analytics

-- Create search sessions table to track individual search operations
CREATE TABLE search_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- For analytics grouping
  search_query TEXT NOT NULL,
  content_sources JSONB NOT NULL DEFAULT '[]', -- ['ideas', 'builder']
  search_filters JSONB DEFAULT '{}', -- Date ranges, author filters, etc.
  results_count INTEGER DEFAULT 0,
  results_accepted INTEGER DEFAULT 0,
  results_rejected INTEGER DEFAULT 0,
  search_success BOOLEAN DEFAULT false,
  processing_time_ms INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search results table to track individual search result interactions
CREATE TABLE search_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_session_id UUID NOT NULL REFERENCES search_sessions(id) ON DELETE CASCADE,
  reference_id UUID REFERENCES "references"(id) ON DELETE SET NULL,
  result_title TEXT NOT NULL,
  result_authors JSONB NOT NULL DEFAULT '[]',
  result_journal TEXT,
  result_year INTEGER,
  result_doi TEXT,
  result_url TEXT,
  relevance_score DECIMAL(5,3) DEFAULT 0,
  confidence_score DECIMAL(5,3) DEFAULT 0,
  quality_score DECIMAL(5,3) DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  user_action TEXT CHECK (user_action IN ('viewed', 'added', 'rejected', 'bookmarked', 'ignored')),
  user_feedback_rating INTEGER CHECK (user_feedback_rating >= 1 AND user_feedback_rating <= 5),
  user_feedback_comments TEXT,
  added_to_library BOOLEAN DEFAULT false,
  added_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search analytics summary table for aggregated metrics
CREATE TABLE search_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_searches INTEGER DEFAULT 0,
  successful_searches INTEGER DEFAULT 0,
  total_results INTEGER DEFAULT 0,
  results_added INTEGER DEFAULT 0,
  results_rejected INTEGER DEFAULT 0,
  average_results_per_search DECIMAL(5,2) DEFAULT 0,
  average_relevance_score DECIMAL(5,3) DEFAULT 0,
  average_processing_time_ms INTEGER DEFAULT 0,
  success_rate DECIMAL(5,3) DEFAULT 0,
  conversion_rate DECIMAL(5,3) DEFAULT 0, -- results_added / total_results
  popular_topics JSONB DEFAULT '[]',
  popular_sources JSONB DEFAULT '[]', -- ['ideas', 'builder']
  search_frequency JSONB DEFAULT '{}', -- Daily/weekly frequency data
  user_satisfaction_score DECIMAL(3,2) DEFAULT 0, -- Average of user feedback ratings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search feedback table for user feedback on search quality
CREATE TABLE search_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_session_id UUID NOT NULL REFERENCES search_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
  relevance_rating INTEGER CHECK (relevance_rating >= 1 AND relevance_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  ease_of_use_rating INTEGER CHECK (ease_of_use_rating >= 1 AND ease_of_use_rating <= 5),
  feedback_comments TEXT,
  would_recommend BOOLEAN,
  improvement_suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_search_sessions_conversation_id ON search_sessions(conversation_id);
CREATE INDEX idx_search_sessions_user_id ON search_sessions(user_id);
CREATE INDEX idx_search_sessions_created_at ON search_sessions(created_at);
CREATE INDEX idx_search_sessions_search_success ON search_sessions(search_success);

CREATE INDEX idx_search_results_search_session_id ON search_results(search_session_id);
CREATE INDEX idx_search_results_reference_id ON search_results(reference_id);
CREATE INDEX idx_search_results_user_action ON search_results(user_action);
CREATE INDEX idx_search_results_added_to_library ON search_results(added_to_library);
CREATE INDEX idx_search_results_relevance_score ON search_results(relevance_score);

CREATE INDEX idx_search_analytics_conversation_id ON search_analytics(conversation_id);
CREATE INDEX idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX idx_search_analytics_period ON search_analytics(period_start, period_end);

CREATE INDEX idx_search_feedback_search_session_id ON search_feedback(search_session_id);
CREATE INDEX idx_search_feedback_user_id ON search_feedback(user_id);
CREATE INDEX idx_search_feedback_overall_satisfaction ON search_feedback(overall_satisfaction);

-- Create trigger for search_analytics updated_at
CREATE TRIGGER update_search_analytics_updated_at 
    BEFORE UPDATE ON search_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE search_sessions ADD CONSTRAINT check_results_counts 
    CHECK (results_accepted >= 0 AND results_rejected >= 0 AND results_count >= 0);

ALTER TABLE search_sessions ADD CONSTRAINT check_processing_time 
    CHECK (processing_time_ms >= 0);

ALTER TABLE search_results ADD CONSTRAINT check_scores_range 
    CHECK (relevance_score >= 0 AND relevance_score <= 1 AND 
           confidence_score >= 0 AND confidence_score <= 1 AND 
           quality_score >= 0 AND quality_score <= 1);

ALTER TABLE search_analytics ADD CONSTRAINT check_analytics_counts 
    CHECK (total_searches >= 0 AND successful_searches >= 0 AND 
           total_results >= 0 AND results_added >= 0 AND results_rejected >= 0);

ALTER TABLE search_analytics ADD CONSTRAINT check_analytics_rates 
    CHECK (success_rate >= 0 AND success_rate <= 1 AND 
           conversion_rate >= 0 AND conversion_rate <= 1);

ALTER TABLE search_analytics ADD CONSTRAINT check_period_order 
    CHECK (period_end >= period_start);