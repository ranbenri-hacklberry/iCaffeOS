-- Fix Update Order Status Function to ensure comprehensive updates
-- This fix ensures that when an order status changes, ALL non-cancelled items are updated to match,
-- unless specific logic dictates otherwise.
CREATE OR REPLACE FUNCTION public.update_order_status_v3(
        p_order_id text,
        p_new_status text,
        p_business_id uuid,
        p_item_status text DEFAULT NULL::text
    ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_current_status TEXT;
v_now TIMESTAMP WITH TIME ZONE DEFAULT NOW();
v_rows_affected INT;
BEGIN -- 1. Get current status & Verify
SELECT order_status INTO v_current_status
FROM orders
WHERE id = p_order_id::UUID
    AND (
        p_business_id IS NULL
        OR business_id = p_business_id
    );
IF NOT FOUND THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Order not found'
);
END IF;
-- 2. Update Order Status
UPDATE orders
SET order_status = p_new_status,
    ready_at = (
        CASE
            WHEN p_new_status = 'ready' THEN v_now
            ELSE ready_at
        END
    ),
    completed_at = (
        CASE
            WHEN p_new_status = 'completed' THEN v_now
            ELSE completed_at
        END
    ),
    fired_at = (
        CASE
            WHEN p_new_status = 'in_progress'
            AND fired_at IS NULL THEN v_now
            ELSE fired_at
        END
    ),
    updated_at = v_now
WHERE id = p_order_id::UUID;
GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
-- 3. Update Item Statuses (Cascade Logic)
-- We enforce stricter syncing between Order and Item statuses here.
IF p_item_status IS NOT NULL THEN -- Explicit override provided
UPDATE order_items
SET item_status = p_item_status,
    updated_at = v_now
WHERE order_id = p_order_id::UUID
    AND item_status != 'cancelled';
ELSE -- 🛡️ LOGIC FIX: Always align item status with order status for main transitions
-- This prevents the "Mixed State" bug where Order is Ready but items differ.
IF p_new_status = 'ready' THEN -- Verify: Set ALL non-cancelled/completed items to ready
UPDATE order_items
SET item_status = 'ready',
    updated_at = v_now
WHERE order_id = p_order_id::UUID
    AND item_status != 'cancelled'
    AND item_status != 'completed';
-- Respect if some were already done independently? 
-- Actually, in Ready state, usually everything is ready.
ELSIF p_new_status = 'completed' THEN -- Verify: Set ALL non-cancelled items to completed
UPDATE order_items
SET item_status = 'completed',
    updated_at = v_now
WHERE order_id = p_order_id::UUID
    AND item_status != 'cancelled';
ELSIF p_new_status = 'in_progress' THEN -- Verify: Set ALL non-cancelled/completed items to in_progress
-- (e.g. if moving from New -> In Progress)
UPDATE order_items
SET item_status = 'in_progress',
    updated_at = v_now
WHERE order_id = p_order_id::UUID
    AND item_status != 'cancelled'
    AND item_status != 'completed';
-- Don't reopen completed items if partially done?
-- But if it's a full "Start", maybe we should?
-- Let's stick to safe logic: Touch everything that isn't definitive.
ELSIF p_new_status = 'new' THEN -- Reset
UPDATE order_items
SET item_status = 'new',
    updated_at = v_now
WHERE order_id = p_order_id::UUID
    AND item_status != 'cancelled';
END IF;
END IF;
RETURN jsonb_build_object(
    'success',
    v_rows_affected > 0,
    'order_id',
    p_order_id,
    'new_status',
    p_new_status,
    'rows_affected',
    v_rows_affected
);
END;
$$;