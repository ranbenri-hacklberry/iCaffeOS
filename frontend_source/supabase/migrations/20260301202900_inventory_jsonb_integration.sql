-- 🔄 Inventory-JSONB Integration Migration (Robust Version)
-- Step 0: Ensure schema columns exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'inventory_items'
        AND column_name = 'low_stock_alert'
) THEN
ALTER TABLE inventory_items
ADD COLUMN low_stock_alert NUMERIC DEFAULT 5;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'inventory_items'
        AND column_name = 'last_updated'
) THEN
ALTER TABLE inventory_items
ADD COLUMN last_updated TIMESTAMPTZ DEFAULT NOW();
END IF;
END $$;
-- Step 1: Update deduct_inventory_for_order to support JSONB modifiers & Inhibition Logic
CREATE OR REPLACE FUNCTION public.deduct_inventory_for_order(p_order_id uuid, p_business_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_item RECORD;
v_mod_json JSONB;
v_ing RECORD;
v_qty_to_deduct NUMERIC;
v_inhibited_ids BIGINT [];
v_inv_item_id_mod BIGINT;
v_inhibits_id BIGINT;
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
-- A. Identify Inhibition Logic & Deduct Modifiers
IF v_order_item.mods IS NOT NULL
AND jsonb_array_length(v_order_item.mods) > 0 THEN FOR v_mod_json IN
SELECT *
FROM jsonb_array_elements(v_order_item.mods) LOOP -- Track Inhibition
    v_inhibits_id := (v_mod_json->>'inhibits_ingredient_id')::BIGINT;
IF v_inhibits_id IS NOT NULL THEN v_inhibited_ids := array_append(v_inhibited_ids, v_inhibits_id);
END IF;
-- Deduct Modifier Stock
v_inv_item_id_mod := (v_mod_json->>'inventory_item_id')::BIGINT;
IF v_inv_item_id_mod IS NOT NULL THEN -- Use provided quantity, or price (if quantity missing but relevant), fallback to 1 unit
v_qty_to_deduct := COALESCE((v_mod_json->>'quantity')::NUMERIC, 1.0) * v_order_item.quantity;
UPDATE inventory_items
SET current_stock = GREATEST(0, current_stock - v_qty_to_deduct),
    last_updated = NOW()
WHERE id = v_inv_item_id_mod;
END IF;
END LOOP;
END IF;
-- B. Deduct Base Ingredients (Skip if inhibited)
FOR v_ing IN
SELECT ri.inventory_item_id,
    ri.quantity_used
FROM recipe_ingredients ri
    JOIN recipes r ON r.id = ri.recipe_id
WHERE r.menu_item_id = v_order_item.menu_item_id LOOP IF NOT (v_ing.inventory_item_id = ANY(v_inhibited_ids)) THEN v_qty_to_deduct := v_ing.quantity_used * v_order_item.quantity;
UPDATE inventory_items
SET current_stock = GREATEST(0, current_stock - v_qty_to_deduct),
    last_updated = NOW()
WHERE id = v_ing.inventory_item_id;
END IF;
END LOOP;
END LOOP;
END;
$$;
-- Step 2: Create Low Stock Notification Logic
CREATE OR REPLACE FUNCTION public.check_low_stock_and_notify() RETURNS TRIGGER AS $$ BEGIN IF NEW.current_stock <= NEW.low_stock_alert
    AND (
        OLD.current_stock > OLD.low_stock_alert
        OR OLD.current_stock IS NULL
    ) THEN
INSERT INTO notifications (
        business_id,
        title,
        message,
        type,
        priority,
        metadata
    )
VALUES (
        NEW.business_id,
        '🚨 התראת מלאי נמוך',
        'הפריט "' || NEW.name || '" הגיע לרמת המלאי המינימלית (' || NEW.current_stock || ' יחידות נותרו).',
        'inventory_alert',
        'high',
        jsonb_build_object(
            'inventory_item_id',
            NEW.id,
            'current_stock',
            NEW.current_stock
        )
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Step 3: Attach Trigger
DROP TRIGGER IF EXISTS trg_low_stock_notify ON inventory_items;
CREATE TRIGGER trg_low_stock_notify
AFTER
UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION public.check_low_stock_and_notify();