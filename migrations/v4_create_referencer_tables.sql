-- Migration version: v4
-- Description: Create referencer tables for reference and citation management

-- Create reference type enum
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

-- Create citation style enum
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create citation instances table for tracking citations in documents
CREATE TABLE citation_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id UUID NOT NULL REFERENCES references(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  citation_style citation_style NOT NULL,
  citation_text TEXT NOT NULL,
  document_position INTEGER,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_references_conversation_id ON references(conversation_id);
CREATE INDEX idx_references_type ON references(type);
CREATE INDEX idx_references_title ON references(title);
CREATE INDEX idx_references_authors ON references USING GIN(authors);
CREATE INDEX idx_references_tags ON references USING GIN(tags);
CREATE INDEX idx_references_doi ON references(doi) WHERE doi IS NOT NULL;
CREATE INDEX idx_references_created_at ON references(created_at);

CREATE INDEX idx_citation_instances_reference_id ON citation_instances(reference_id);
CREATE INDEX idx_citation_instances_conversation_id ON citation_instances(conversation_id);
CREATE INDEX idx_citation_instances_style ON citation_instances(citation_style);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_references_updated_at 
    BEFORE UPDATE ON references 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE references ADD CONSTRAINT check_doi_format 
    CHECK (doi IS NULL OR doi ~ '^10\.\d{4,}/.*');

ALTER TABLE references ADD CONSTRAINT check_url_format 
    CHECK (url IS NULL OR url ~ '^https?://.*');

ALTER TABLE references ADD CONSTRAINT check_confidence_range 
    CHECK (metadata_confidence >= 0.0 AND metadata_confidence <= 1.0);