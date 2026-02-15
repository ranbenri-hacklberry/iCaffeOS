#!/bin/bash

# iCaffe Local DB Sync- iCaffe עגלת קפה - סקריפט סנכרון לוקאלי
# This script applies the inventory unit & weight fixes to the local Supabase instance.

DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

echo "🚀 Starting Local Inventory Sync for עגלת קפה..."

psql "$DB_URL" <<EOF
-- 1. Sync Weights and Units (Gram to Units Conversion)
UPDATE inventory_items SET weight_per_unit = 100, unit = 'יח׳' WHERE id = 387; -- ערמונים
UPDATE inventory_items SET weight_per_unit = 1000, unit = 'יח׳' WHERE id = 443; -- אגוז מלך
UPDATE inventory_items SET weight_per_unit = 5000, unit = 'יח׳' WHERE id = 442; -- ממרח קקאו ולוז
UPDATE inventory_items SET weight_per_unit = 3600, unit = 'יח׳' WHERE id = 364; -- גבינה בולגרית
UPDATE inventory_items SET weight_per_unit = 1000, unit = 'יח׳' WHERE id = 414; -- אבקת סוכר
UPDATE inventory_items SET weight_per_unit = 1000, unit = 'יח׳' WHERE id = 417; -- סוכר
UPDATE inventory_items SET weight_per_unit = 2000, unit = 'יח׳' WHERE id = 365; -- גבינה צהובה מגורדת
UPDATE inventory_items SET weight_per_unit = 1000, unit = 'יח׳' WHERE id = 367; -- רוטב פסטו
UPDATE inventory_items SET weight_per_unit = 2000, unit = 'יח׳' WHERE id = 425; -- גבינת שמנת
UPDATE inventory_items SET weight_per_unit = 5000, unit = 'יח׳' WHERE id = 439; -- פסטה
UPDATE inventory_items SET weight_per_unit = 1000, unit = 'יח׳' WHERE id = 436; -- אגוז מוסקט
UPDATE inventory_items SET weight_per_unit = 1000, unit = 'יח׳' WHERE id = 438; -- אורגנו
UPDATE inventory_items SET weight_per_unit = 1000, unit = 'יח׳' WHERE id = 441; -- ג'עלה
UPDATE inventory_items SET weight_per_unit = 5000, unit = 'יח׳' WHERE id = 444; -- ממרח שוקולד לבן
UPDATE inventory_items SET weight_per_unit = 1000, unit = 'יח׳' WHERE id = 447; -- אבקת אייס קפה

-- 2. Remove Duplicates
DELETE FROM inventory_items WHERE id IN (423, 424);

-- 3. Update Column Name (Structural Change if not applied)
DO \$\$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='low_stock_alert') THEN
        ALTER TABLE inventory_items RENAME COLUMN low_stock_alert TO low_stock_threshold_units;
    END IF;
END \$\$;

EOF

echo "✅ Sync Completed Successfully!"
