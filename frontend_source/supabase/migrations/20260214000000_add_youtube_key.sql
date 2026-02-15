-- Add youtube_api_key to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS youtube_api_key TEXT;
COMMENT ON COLUMN businesses.youtube_api_key IS 'API Key for YouTube Data API v3 (Smart Search & Quota)';