-- 🔄 RE-APPLY: Inventory-JSONB Integration Migration
-- Step 1: Update deduct_inventory_for_order to support JSONB modifiers & Inhibition Logic
CREATE OR REPLACE FUNCTION public.deduct_inventory_for_order(p_order_id uuid, p_business_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_item RECORD;
v_mod_json JSONB;
v_ing RECORD;
v_qty_to_deduct NUMERIC;
v_inhibited_ids BIGINT [];
v_inv_item_id_mod BIGINT;
v_inhibits_id BIGINT;
v_count_mods int := 0;
BEGIN -- Loop through all active items in the order
FOR v_order_item IN
SELECT oi.id,
    oi.menu_item_id,
    oi.quantity,
    oi.mods
FROM order_items oi
WHERE oi.order_id = p_order_id
    AND oi.item_status != 'cancelled'
    AND (
        oi.business_id = p_business_id
        OR oi.business_id IS NULL
    ) LOOP v_inhibited_ids := '{}';
-- Loop once over mods to handle both Inhibition and Modifier Deduction
IF v_order_item.mods IS NOT NULL
AND jsonb_array_length(v_order_item.mods) > 0 THEN FOR v_mod_json IN
SELECT *
FROM jsonb_array_elements(v_order_item.mods) LOOP -- 1. Track Inhibition (for later use when deducting recipes)
    v_inhibits_id := (v_mod_json->>'inhibits_ingredient_id')::BIGINT;
IF v_inhibits_id IS NOT NULL THEN v_inhibited_ids := array_append(v_inhibited_ids, v_inhibits_id);
END IF;
-- 2. Deduct Modifier Stock
v_inv_item_id_mod := (v_mod_json->>'inventory_item_id')::BIGINT;
IF v_inv_item_id_mod IS NOT NULL THEN v_qty_to_deduct := COALESCE(
    (v_mod_json->>'quantity')::NUMERIC,
    (v_mod_json->>'price')::NUMERIC,
    1.0
) * v_order_item.quantity;
UPDATE inventory_items
SET current_stock = current_stock - v_qty_to_deduct,
    last_updated = NOW()
WHERE id = v_inv_item_id_mod;
-- Note: Relaxed business check temporarily to debug
END IF;
END LOOP;
END IF;
-- 3. Deduct Base Ingredients (Skip if inhibited)
FOR v_ing IN
SELECT ri.inventory_item_id,
    ri.quantity_used
FROM recipe_ingredients ri
    JOIN recipes r ON r.id = ri.recipe_id
WHERE r.menu_item_id = v_order_item.menu_item_id LOOP IF NOT (v_ing.inventory_item_id = ANY(v_inhibited_ids)) THEN v_qty_to_deduct := v_ing.quantity_used * v_order_item.quantity;
UPDATE inventory_items
SET current_stock = current_stock - v_qty_to_deduct,
    last_updated = NOW()
WHERE id = v_ing.inventory_item_id;
END IF;
END LOOP;
END LOOP;
END;
$$;