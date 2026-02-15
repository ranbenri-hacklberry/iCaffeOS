-- Add Claude API key and Kling API key columns to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS claude_api_key TEXT,
ADD COLUMN IF NOT EXISTS kling_api_key TEXT;

-- Add comments for documentation
COMMENT ON COLUMN businesses.claude_api_key IS 'Anthropic Claude API key for advanced AI chat, document analysis, and coding tasks';
COMMENT ON COLUMN businesses.kling_api_key IS 'Kling AI API key for AI video generation from text';
