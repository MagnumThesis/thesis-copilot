-- Migration version: v2
-- Description: Alter ideas table to add foreign key constraint for conversationId

-- First, alter the column type to UUID if it's not already.
-- If the existing data is not in UUID format, this might fail.
-- Assuming existing conversationIds are compatible with UUID or can be cast.
ALTER TABLE ideas
ALTER COLUMN conversationId TYPE UUID
USING conversationId::UUID;

-- Add the foreign key constraint
ALTER TABLE ideas
ADD CONSTRAINT fk_ideas_conversationId
FOREIGN KEY (conversationId) REFERENCES chats (id) ON DELETE SET NULL; -- Or ON DELETE CASCADE, depending on desired behavior
