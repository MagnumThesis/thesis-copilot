-- Create builder_content table to store Builder tool content
-- This addresses the issue where Builder content was only saved to localStorage

-- Create builder_content table
CREATE TABLE builder_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_builder_content_conversation_id ON builder_content(conversation_id);
CREATE UNIQUE INDEX idx_builder_content_conversation_unique ON builder_content(conversation_id);

-- Add trigger for updated_at
CREATE TRIGGER update_builder_content_updated_at
    BEFORE UPDATE ON builder_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE builder_content IS 'Stores Builder tool content for thesis proposals with database persistence';
COMMENT ON COLUMN builder_content.conversation_id IS 'References the conversation this Builder content belongs to';
COMMENT ON COLUMN builder_content.content IS 'The actual markdown content from the Builder tool';
