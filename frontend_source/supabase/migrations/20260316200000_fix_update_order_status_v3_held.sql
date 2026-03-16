-- Fix update_order_status_v3 to not overwrite 'held' items when marking as ready/in_progress
CREATE OR REPLACE FUNCTION public.update_order_status_v3(p_order_id text, p_new_status text, p_business_id uuid, p_item_status text DEFAULT NULL::text, p_seen_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE 
    v_current_status TEXT;
    v_now TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    v_rows_affected INT;
BEGIN 
    -- 1. Get current status & Verify
    SELECT order_status INTO v_current_status
    FROM orders
    WHERE id = p_order_id::UUID
      AND (
          p_business_id IS NULL
          OR business_id = p_business_id
      );

    IF NOT FOUND THEN 
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Order not found'
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
                WHEN p_new_status = 'in_progress' AND fired_at IS NULL THEN v_now
                ELSE fired_at
            END
        ),
        updated_at = v_now
    WHERE id = p_order_id::UUID;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    -- 3. Update Item Statuses (Cascade Logic)
    IF p_item_status IS NOT NULL THEN 
        -- Explicit override provided. Protect 'held' items from being marked ready/in_progress
        UPDATE order_items
        SET item_status = p_item_status,
            updated_at = v_now
        WHERE order_id = p_order_id::UUID
            AND item_status != 'cancelled'
            AND (p_item_status IN ('completed', 'cancelled') OR item_status != 'held');
    ELSE 
        -- 🛡️ LOGIC FIX: Always align item status with order status for main transitions
        IF p_new_status = 'ready' THEN
            UPDATE order_items
            SET item_status = 'ready',
                updated_at = v_now
            WHERE order_id = p_order_id::UUID
                AND item_status NOT IN ('cancelled', 'completed', 'held');
        ELSIF p_new_status = 'completed' THEN
            UPDATE order_items
            SET item_status = 'completed',
                updated_at = v_now
            WHERE order_id = p_order_id::UUID
                AND item_status != 'cancelled';
        ELSIF p_new_status = 'in_progress' THEN
            UPDATE order_items
            SET item_status = 'in_progress',
                updated_at = v_now
            WHERE order_id = p_order_id::UUID
                AND item_status NOT IN ('cancelled', 'completed', 'held');
        ELSIF p_new_status = 'new' THEN
            UPDATE order_items
            SET item_status = 'new',
                updated_at = v_now
            WHERE order_id = p_order_id::UUID
                AND item_status NOT IN ('cancelled', 'held');
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', v_rows_affected > 0,
        'order_id', p_order_id,
        'new_status', p_new_status,
        'rows_affected', v_rows_affected
    );
END;
$function$;
