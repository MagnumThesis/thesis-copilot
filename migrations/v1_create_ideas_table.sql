-- Migration version: v1
-- Description: Create the ideas table

CREATE TABLE IF NOT EXISTS ideas (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    conversationId VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Add indexes if needed for performance, e.g., on conversationId
-- CREATE INDEX IF NOT EXISTS idx_ideas_conversationId ON ideas (conversationId);
