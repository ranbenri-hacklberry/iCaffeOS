-- Fix complete_order_part_v2 to prevent Zombie Orders
-- Previous logic blindly set order status to 'in_progress' if keep_open was true.
-- New logic checks if there are ANY remaining active items. If not, it forces completion.
CREATE OR REPLACE FUNCTION public.complete_order_part_v2(
        p_order_id uuid,
        p_item_ids uuid [],
        p_keep_order_open boolean
    ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE v_remaining_active_count INT;
BEGIN -- 1. Update the specific items to completed
UPDATE order_items
SET item_status = 'completed',
    updated_at = NOW()
WHERE id = ANY(p_item_ids);
-- 2. Check if ANY active items remain for this order
SELECT COUNT(*) INTO v_remaining_active_count
FROM order_items
WHERE order_id = p_order_id
    AND item_status IN ('in_progress', 'pending', 'new', 'held', 'ready');
-- 3. Smart Status Logic
IF v_remaining_active_count = 0 THEN -- SAFETY: If no active items remain, we MUST complete the order, 
-- overriding the frontend's request to keep it open (which prevents zombies).
UPDATE orders
SET order_status = 'completed',
    completed_at = COALESCE(completed_at, NOW()),
    updated_at = NOW()
WHERE id = p_order_id;
ELSIF p_keep_order_open THEN -- Keep open (or reopen) only if there are actually items left
UPDATE orders
SET order_status = 'in_progress',
    updated_at = NOW()
WHERE id = p_order_id;
ELSE -- Explicit completion requested
UPDATE orders
SET order_status = 'completed',
    completed_at = COALESCE(completed_at, NOW()),
    updated_at = NOW()
WHERE id = p_order_id;
END IF;
END;
$function$