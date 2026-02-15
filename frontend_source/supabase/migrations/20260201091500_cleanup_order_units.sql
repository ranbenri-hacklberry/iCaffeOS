-- Final cleanup: Convert order settings from grams back to units in the DB
-- Only for items that have a weight_per_unit > 0
UPDATE inventory_items
SET order_step = order_step / weight_per_unit,
    min_order = min_order / weight_per_unit
WHERE weight_per_unit > 0
    AND order_step >= weight_per_unit;
-- Ensure current_stock remains grams (no change needed there as per user request)