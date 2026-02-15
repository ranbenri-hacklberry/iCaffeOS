-- Create missing update_inventory_stock function overload for prepared items
-- The frontend calls this function with business_id, which suggests a new signature is needed.
CREATE OR REPLACE FUNCTION public.update_inventory_stock(
        p_business_id uuid,
        p_counted_by uuid,
        p_item_id integer,
        p_new_stock numeric,
        p_source text
    ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_name TEXT;
v_target_table TEXT;
BEGIN -- 1. Identify which table the item belongs to (Raw Ingredient vs Prepared Item)
-- We assume it's a prepared item if it exists in prepared_items_inventory
IF EXISTS (
    SELECT 1
    FROM prepared_items_inventory
    WHERE item_id = p_item_id
) THEN v_target_table := 'prepared_items_inventory';
UPDATE prepared_items_inventory
SET current_stock = p_new_stock,
    last_updated = NOW()
WHERE item_id = p_item_id
    AND business_id = p_business_id;
ELSE v_target_table := 'inventory_items';
UPDATE inventory_items
SET current_stock = p_new_stock,
    last_counted_at = NOW(),
    last_counted_by = p_counted_by,
    last_count_source = p_source,
    last_updated = NOW()
WHERE id = p_item_id -- Note: inventory_items might not have business_id on all rows if legacy,
    -- but typically they should.
    AND business_id = p_business_id;
END IF;
-- Get counter name
IF p_counted_by IS NOT NULL THEN
SELECT name INTO v_user_name
FROM employees
WHERE id = p_counted_by;
END IF;
RETURN jsonb_build_object(
    'success',
    true,
    'item_id',
    p_item_id,
    'new_stock',
    p_new_stock,
    'target_table',
    v_target_table,
    'counted_by',
    v_user_name
);
END;
$$;