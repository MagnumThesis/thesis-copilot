-- Complete database schema for Thesis Copilot application
-- This file creates all necessary tables and relationships for fresh installations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create chats table (main conversations)
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ideas table
CREATE TABLE ideas (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  conversationid UUID REFERENCES chats(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enums for proofreading
CREATE TYPE concern_category AS ENUM (
  'clarity',
  'coherence', 
  'structure',
  'academic_style',
  'consistency',
  'completeness',
  'citations',
  'grammar',
  'terminology'
);

CREATE TYPE concern_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE concern_status AS ENUM (
  'to_be_done',
  'addressed',
  'rejected'
);

-- Create proofreading concerns table
CREATE TABLE proofreading_concerns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  category concern_category NOT NULL,
  severity concern_severity NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location JSONB,
  suggestions TEXT[],
  related_ideas TEXT[],
  status concern_status NOT NULL DEFAULT 'to_be_done',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proofreading sessions table
CREATE TABLE proofreading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  content_hash VARCHAR(64) NOT NULL,
  analysis_metadata JSONB,
  concerns_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create all indexes for performance
CREATE INDEX idx_chats_created_at ON chats(created_at);
CREATE INDEX idx_chats_updated_at ON chats(updated_at);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_role ON messages(role);

CREATE INDEX idx_ideas_conversationid ON ideas(conversationid);
CREATE INDEX idx_ideas_created_at ON ideas(created_at);
CREATE INDEX idx_ideas_updated_at ON ideas(updated_at);

CREATE INDEX idx_proofreading_concerns_conversation_id ON proofreading_concerns(conversation_id);
CREATE INDEX idx_proofreading_concerns_status ON proofreading_concerns(status);
CREATE INDEX idx_proofreading_concerns_category ON proofreading_concerns(category);
CREATE INDEX idx_proofreading_concerns_severity ON proofreading_concerns(severity);
CREATE INDEX idx_proofreading_concerns_created_at ON proofreading_concerns(created_at);
CREATE INDEX idx_proofreading_concerns_updated_at ON proofreading_concerns(updated_at);

CREATE INDEX idx_proofreading_sessions_conversation_id ON proofreading_sessions(conversation_id);
CREATE INDEX idx_proofreading_sessions_content_hash ON proofreading_sessions(content_hash);
CREATE INDEX idx_proofreading_sessions_created_at ON proofreading_sessions(created_at);

-- Create update timestamp function and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_chats_updated_at 
    BEFORE UPDATE ON chats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at 
    BEFORE UPDATE ON ideas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proofreading_concerns_updated_at 
    BEFORE UPDATE ON proofreading_concerns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();-
- Create enums for referencer
CREATE TYPE reference_type AS ENUM (
  'journal_article',
  'book',
  'book_chapter',
  'conference_paper',
  'thesis',
  'website',
  'report',
  'patent',
  'other'
);

CREATE TYPE citation_style AS ENUM (
  'apa',
  'mla',
  'chicago',
  'harvard',
  'ieee',
  'vancouver'
);

-- Create references table
CREATE TABLE references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  type reference_type NOT NULL,
  title TEXT NOT NULL,
  authors JSONB NOT NULL DEFAULT '[]',
  publication_date DATE,
  url TEXT,
  doi TEXT,
  journal TEXT,
  volume TEXT,
  issue TEXT,
  pages TEXT,
  publisher TEXT,
  isbn TEXT,
  edition TEXT,
  chapter TEXT,
  editor TEXT,
  access_date DATE,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata_confidence DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create citation instances table
CREATE TABLE citation_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id UUID NOT NULL REFERENCES references(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  citation_style citation_style NOT NULL,
  citation_text TEXT NOT NULL,
  document_position INTEGER,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for referencer tables
CREATE INDEX idx_references_conversation_id ON references(conversation_id);
CREATE INDEX idx_references_type ON references(type);
CREATE INDEX idx_references_title ON references(title);
CREATE INDEX idx_references_authors ON references USING GIN(authors);
CREATE INDEX idx_references_tags ON references USING GIN(tags);
CREATE INDEX idx_references_doi ON references(doi) WHERE doi IS NOT NULL;
CREATE INDEX idx_references_created_at ON references(created_at);
CREATE INDEX idx_references_updated_at ON references(updated_at);

CREATE INDEX idx_citation_instances_reference_id ON citation_instances(reference_id);
CREATE INDEX idx_citation_instances_conversation_id ON citation_instances(conversation_id);
CREATE INDEX idx_citation_instances_style ON citation_instances(citation_style);

-- Create trigger for references updated_at
CREATE TRIGGER update_references_updated_at 
    BEFORE UPDATE ON references 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for references table
ALTER TABLE references ADD CONSTRAINT check_doi_format 
    CHECK (doi IS NULL OR doi ~ '^10\.\d{4,}/.*');

ALTER TABLE references ADD CONSTRAINT check_url_format 
    CHECK (url IS NULL OR url ~ '^https?://.*');

ALTER TABLE references ADD CONSTRAINT check_confidence_range 
    CHECK (metadata_confidence >= 0.0 AND metadata_confidence <= 1.0);