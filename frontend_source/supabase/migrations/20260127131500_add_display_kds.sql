-- Add display_kds column to menu_items table to support multi-KDS selection
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS display_kds text [] DEFAULT ARRAY ['Checker'];
-- Update existing rows to have a default value based on their current production_area
UPDATE menu_items
SET display_kds = ARRAY [production_area]
WHERE display_kds IS NULL
    AND production_area IS NOT NULL;