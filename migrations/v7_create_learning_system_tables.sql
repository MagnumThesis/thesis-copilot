-- Migration v7: Create learning system tables for AI Reference Searcher
-- This migration adds tables for storing user feedback and learning patterns

-- Create user feedback learning table for detailed feedback storage
CREATE TABLE user_feedback_learning (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  search_session_id UUID NOT NULL REFERENCES search_sessions(id) ON DELETE CASCADE,
  result_id TEXT NOT NULL,
  is_relevant BOOLEAN NOT NULL,
  quality_rating INTEGER NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
  comments TEXT,
  result_title TEXT NOT NULL,
  result_authors JSONB NOT NULL DEFAULT '[]',
  result_journal TEXT,
  result_year INTEGER,
  citation_count INTEGER DEFAULT 0,
  result_topics JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user preference patterns table for storing learned preferences
CREATE TABLE user_preference_patterns (
  user_id TEXT PRIMARY KEY,
  preferred_authors JSONB NOT NULL DEFAULT '[]',
  preferred_journals JSONB NOT NULL DEFAULT '[]',
  preferred_year_range JSONB NOT NULL DEFAULT '{"min": 2010, "max": 2024}',
  preferred_citation_range JSONB NOT NULL DEFAULT '{"min": 0, "max": 10000}',
  topic_preferences JSONB NOT NULL DEFAULT '{}', -- topic -> preference score mapping
  quality_threshold DECIMAL(3,2) DEFAULT 0.5 CHECK (quality_threshold >= 0 AND quality_threshold <= 1),
  relevance_threshold DECIMAL(3,2) DEFAULT 0.5 CHECK (relevance_threshold >= 0 AND relevance_threshold <= 1),
  rejection_patterns JSONB NOT NULL DEFAULT '{"authors": [], "journals": [], "keywords": []}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create adaptive filters table for storing generated filters
CREATE TABLE adaptive_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  filter_type TEXT NOT NULL CHECK (filter_type IN ('author', 'journal', 'year', 'citation', 'topic', 'quality')),
  condition_type TEXT NOT NULL CHECK (condition_type IN ('include', 'exclude', 'boost', 'penalize')),
  filter_value TEXT NOT NULL,
  weight DECIMAL(3,2) DEFAULT 0.5 CHECK (weight >= 0 AND weight <= 1),
  confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  source_type TEXT NOT NULL CHECK (source_type IN ('explicit_feedback', 'implicit_behavior', 'pattern_recognition')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning metrics table for tracking learning performance
CREATE TABLE learning_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_feedback_count INTEGER DEFAULT 0,
  positive_ratings INTEGER DEFAULT 0,
  negative_ratings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  improvement_trend DECIMAL(5,3) DEFAULT 0, -- positive = improving, negative = declining
  confidence_level DECIMAL(3,2) DEFAULT 0 CHECK (confidence_level >= 0 AND confidence_level <= 1),
  pattern_stability DECIMAL(3,2) DEFAULT 0 CHECK (pattern_stability >= 0 AND pattern_stability <= 1),
  learning_effectiveness DECIMAL(3,2) DEFAULT 0 CHECK (learning_effectiveness >= 0 AND learning_effectiveness <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_feedback_learning_user_id ON user_feedback_learning(user_id);
CREATE INDEX idx_user_feedback_learning_session_id ON user_feedback_learning(search_session_id);
CREATE INDEX idx_user_feedback_learning_result_id ON user_feedback_learning(result_id);
CREATE INDEX idx_user_feedback_learning_is_relevant ON user_feedback_learning(is_relevant);
CREATE INDEX idx_user_feedback_learning_quality_rating ON user_feedback_learning(quality_rating);
CREATE INDEX idx_user_feedback_learning_created_at ON user_feedback_learning(created_at);

CREATE INDEX idx_user_preference_patterns_user_id ON user_preference_patterns(user_id);
CREATE INDEX idx_user_preference_patterns_last_updated ON user_preference_patterns(last_updated);

CREATE INDEX idx_adaptive_filters_user_id ON adaptive_filters(user_id);
CREATE INDEX idx_adaptive_filters_type ON adaptive_filters(filter_type);
CREATE INDEX idx_adaptive_filters_active ON adaptive_filters(is_active);
CREATE INDEX idx_adaptive_filters_confidence ON adaptive_filters(confidence);
CREATE INDEX idx_adaptive_filters_created_at ON adaptive_filters(created_at);

CREATE INDEX idx_learning_metrics_user_id ON learning_metrics(user_id);
CREATE INDEX idx_learning_metrics_period ON learning_metrics(period_start, period_end);
CREATE INDEX idx_learning_metrics_confidence ON learning_metrics(confidence_level);
CREATE INDEX idx_learning_metrics_created_at ON learning_metrics(created_at);

-- Create triggers for updated_at columns
CREATE TRIGGER update_adaptive_filters_updated_at 
    BEFORE UPDATE ON adaptive_filters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_metrics_updated_at 
    BEFORE UPDATE ON learning_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE user_feedback_learning ADD CONSTRAINT check_feedback_rating_range 
    CHECK (quality_rating >= 1 AND quality_rating <= 5);

ALTER TABLE user_feedback_learning ADD CONSTRAINT check_citation_count_positive 
    CHECK (citation_count >= 0);

ALTER TABLE adaptive_filters ADD CONSTRAINT check_weight_range 
    CHECK (weight >= 0 AND weight <= 1);

ALTER TABLE adaptive_filters ADD CONSTRAINT check_confidence_range 
    CHECK (confidence >= 0 AND confidence <= 1);

ALTER TABLE learning_metrics ADD CONSTRAINT check_feedback_counts 
    CHECK (total_feedback_count >= 0 AND positive_ratings >= 0 AND negative_ratings >= 0);

ALTER TABLE learning_metrics ADD CONSTRAINT check_rating_range 
    CHECK (average_rating >= 0 AND average_rating <= 5);

ALTER TABLE learning_metrics ADD CONSTRAINT check_period_order 
    CHECK (period_end >= period_start);

-- Create function to automatically update learning metrics
CREATE OR REPLACE FUNCTION update_learning_metrics_for_user(target_user_id TEXT)
RETURNS VOID AS $$
DECLARE
    start_date TIMESTAMP WITH TIME ZONE;
    end_date TIMESTAMP WITH TIME ZONE;
    metrics_record RECORD;
BEGIN
    -- Calculate metrics for the last 30 days
    end_date := NOW();
    start_date := end_date - INTERVAL '30 days';
    
    -- Calculate metrics from feedback data
    SELECT 
        COUNT(*) as total_feedback,
        COUNT(CASE WHEN is_relevant = true AND quality_rating >= 4 THEN 1 END) as positive_ratings,
        COUNT(CASE WHEN is_relevant = false OR quality_rating <= 2 THEN 1 END) as negative_ratings,
        AVG(quality_rating) as average_rating
    INTO metrics_record
    FROM user_feedback_learning 
    WHERE user_id = target_user_id AND created_at >= start_date;
    
    -- Insert or update learning metrics
    INSERT INTO learning_metrics (
        user_id, period_start, period_end, total_feedback_count,
        positive_ratings, negative_ratings, average_rating,
        confidence_level, created_at, updated_at
    ) VALUES (
        target_user_id, start_date, end_date, 
        COALESCE(metrics_record.total_feedback, 0),
        COALESCE(metrics_record.positive_ratings, 0),
        COALESCE(metrics_record.negative_ratings, 0),
        COALESCE(metrics_record.average_rating, 0),
        LEAST(1.0, COALESCE(metrics_record.total_feedback, 0) / 20.0),
        NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        period_start = start_date,
        period_end = end_date,
        total_feedback_count = COALESCE(metrics_record.total_feedback, 0),
        positive_ratings = COALESCE(metrics_record.positive_ratings, 0),
        negative_ratings = COALESCE(metrics_record.negative_ratings, 0),
        average_rating = COALESCE(metrics_record.average_rating, 0),
        confidence_level = LEAST(1.0, COALESCE(metrics_record.total_feedback, 0) / 20.0),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update learning metrics when feedback is added
CREATE OR REPLACE FUNCTION trigger_update_learning_metrics()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_learning_metrics_for_user(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_learning_metrics
    AFTER INSERT ON user_feedback_learning
    FOR EACH ROW EXECUTE FUNCTION trigger_update_learning_metrics();