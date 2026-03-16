-- Add language column to businesses table for i18n support
ALTER TABLE businesses
ADD COLUMN language TEXT DEFAULT 'he' CHECK (language IN ('he', 'en'));

-- Add comment for documentation
COMMENT ON COLUMN businesses.language IS 'User preferred language for the application interface (he=Hebrew, en=English)';