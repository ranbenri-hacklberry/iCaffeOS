-- Add youtube_api_key to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS youtube_api_key TEXT;