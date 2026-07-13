-- Migration: Database-Level Triggers for Automatic Order Completion
-- Automatically completes orders when:
-- 1. The last active preparation item is completed (on order_items update)
-- 2. An order is paid and has no active preparation items (on orders update)

-- 1. Trigger Function for order_items updates
CREATE OR REPLACE FUNCTION public.check_order_auto_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_is_paid boolean;
    v_order_status text;
    v_has_prep_items boolean;
BEGIN
    -- Check if the parent order is paid and currently in_progress
    SELECT is_paid, order_status INTO v_is_paid, v_order_status
    FROM orders
    WHERE id = NEW.order_id;

    IF v_is_paid = true AND v_order_status = 'in_progress' THEN
        -- Check if there are any remaining items that require preparation
        SELECT EXISTS (
            SELECT 1 
            FROM order_items oi
            LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
            WHERE oi.order_id = NEW.order_id
              AND oi.item_status NOT IN ('completed', 'shipped', 'cancelled')
              AND (
                  mi.kds_routing_logic = 'MADE_TO_ORDER'
                  OR COALESCE(mi.kds_routing_logic, '') LIKE 'routeTo%'
                  OR mi.is_hot_drink = true
                  OR mi.category IN ('שתיה חמה', 'hot-drinks')
                  OR COALESCE(oi.mods::text, '') LIKE '%__KDS_OVERRIDE__%'
                  OR COALESCE(oi.mods::text, '') LIKE '%__KDS_OVER_RIDE__%'
              )
        ) INTO v_has_prep_items;

        -- If no prep items are active, complete the order
        IF NOT v_has_prep_items THEN
            -- Update parent order
            UPDATE orders 
            SET order_status = 'completed', updated_at = NOW()
            WHERE id = NEW.order_id;
            
            -- Update any remaining non-completed items of this order to completed (e.g. GRAB_AND_GO items)
            IF pg_trigger_depth() = 1 THEN
                UPDATE order_items
                SET item_status = 'completed', updated_at = NOW()
                WHERE order_id = NEW.order_id 
                  AND item_status NOT IN ('completed', 'shipped', 'cancelled');
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger on order_items
DROP TRIGGER IF EXISTS trg_check_order_auto_completion ON order_items;

CREATE TRIGGER trg_check_order_auto_completion
AFTER UPDATE OF item_status ON order_items
FOR EACH ROW
WHEN (OLD.item_status IS DISTINCT FROM NEW.item_status AND NEW.item_status IN ('completed', 'shipped', 'cancelled'))
EXECUTE FUNCTION public.check_order_auto_completion();


-- 2. Trigger Function for orders updates (when is_paid changes to true)
CREATE OR REPLACE FUNCTION public.check_order_payment_auto_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_has_prep_items boolean;
BEGIN
    IF NEW.is_paid = true AND NEW.order_status = 'in_progress' AND COALESCE(NEW.order_type, 'dine_in') != 'delivery' THEN
        -- Check if there are any active items that require preparation
        SELECT EXISTS (
            SELECT 1 
            FROM order_items oi
            LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
            WHERE oi.order_id = NEW.id
              AND oi.item_status NOT IN ('completed', 'shipped', 'cancelled')
              AND (
                  mi.kds_routing_logic = 'MADE_TO_ORDER'
                  OR COALESCE(mi.kds_routing_logic, '') LIKE 'routeTo%'
                  OR mi.is_hot_drink = true
                  OR mi.category IN ('שתיה חמה', 'hot-drinks')
                  OR COALESCE(oi.mods::text, '') LIKE '%__KDS_OVERRIDE__%'
                  OR COALESCE(oi.mods::text, '') LIKE '%__KDS_OVER_RIDE__%'
              )
        ) INTO v_has_prep_items;

        IF NOT v_has_prep_items THEN
            -- Complete the order and its items
            IF pg_trigger_depth() = 1 THEN
                UPDATE orders 
                SET order_status = 'completed', updated_at = NOW()
                WHERE id = NEW.id;

                UPDATE order_items
                SET item_status = 'completed', updated_at = NOW()
                WHERE order_id = NEW.id 
                  AND item_status NOT IN ('completed', 'shipped', 'cancelled');
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger on orders
DROP TRIGGER IF EXISTS trg_check_order_payment_auto_completion ON orders;

CREATE TRIGGER trg_check_order_payment_auto_completion
AFTER UPDATE OF is_paid ON orders
FOR EACH ROW
WHEN (OLD.is_paid IS DISTINCT FROM NEW.is_paid AND NEW.is_paid = true)
EXECUTE FUNCTION public.check_order_payment_auto_completion();
