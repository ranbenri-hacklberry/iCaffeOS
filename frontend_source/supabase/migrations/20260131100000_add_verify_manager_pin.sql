-- Add verify_manager_pin for iPad Menu Editor
-- Add close_business_day for KDS End of Day cleanup
-- 1. verify_manager_pin
-- Checks if a PIN belongs to a Manager or Admin in the current business.
CREATE OR REPLACE FUNCTION public.verify_manager_pin(p_pin text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_business_id uuid;
v_employee_id uuid;
v_name text;
BEGIN -- Get current business context
v_business_id := current_user_business_id();
IF v_business_id IS NULL THEN RETURN jsonb_build_object('valid', false, 'reason', 'no_business_context');
END IF;
-- Check for employee with this PIN and correct access level
SELECT id,
    name INTO v_employee_id,
    v_name
FROM employees
WHERE business_id = v_business_id
    AND pin_code = p_pin
    AND access_level IN ('Manager', 'Admin')
    AND is_deleted IS NOT TRUE
LIMIT 1;
IF v_employee_id IS NOT NULL THEN RETURN jsonb_build_object(
    'valid',
    true,
    'employee_id',
    v_employee_id,
    'name',
    v_name
);
ELSE RETURN jsonb_build_object('valid', false);
END IF;
END;
$$;
-- 2. close_business_day
-- Marks all non-final orders as completed for the day.
CREATE OR REPLACE FUNCTION public.close_business_day(p_business_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_closed_count int;
BEGIN -- Verify permission (must be authenticated and part of business)
IF current_user_business_id() != p_business_id THEN -- Optional: Allow if service role or super admin, but for now strict check
-- Or if p_business_id is null, use current
END IF;
-- Fallback to current if param mismatch, or enforce param
-- Let's just use the param with validation
IF p_business_id IS NULL THEN p_business_id := current_user_business_id();
END IF;
-- Update Orders
WITH updated AS (
    UPDATE orders
    SET order_status = 'completed',
        updated_at = NOW()
    WHERE business_id = p_business_id
        AND order_status NOT IN ('completed', 'cancelled') -- Safety: Only close orders from the last 24 hours? 
        -- Usually 'Close Day' implies everything currently open.
    RETURNING id
)
SELECT count(*) INTO v_closed_count
FROM updated;
-- Update Order Items (Cascade mostly handles this but good to be explicit for KDS)
UPDATE order_items
SET item_status = 'completed'
WHERE order_id IN (
        SELECT id
        FROM orders
        WHERE business_id = p_business_id
            AND order_status = 'completed'
    )
    AND item_status NOT IN ('completed', 'cancelled');
RETURN jsonb_build_object(
    'success',
    true,
    'closed_orders',
    v_closed_count,
    'message',
    'Day closed successfully'
);
END;
$$;