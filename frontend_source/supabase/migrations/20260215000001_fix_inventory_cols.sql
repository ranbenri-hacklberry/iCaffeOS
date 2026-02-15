-- 🛠️ Fix: Ensure inventory_items has low_stock_alert column
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'inventory_items'
        AND column_name = 'low_stock_alert'
) THEN
ALTER TABLE inventory_items
ADD COLUMN low_stock_alert NUMERIC DEFAULT 5;
END IF;
END $$;