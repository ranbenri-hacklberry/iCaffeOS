-- Add inventory decrement to submit_order_v3
-- This fixes the issue where inventory stock was not being reduced after an order.
CREATE OR REPLACE FUNCTION public.submit_order_v3(
        p_customer_phone text DEFAULT NULL::text,
        p_customer_name text DEFAULT NULL::text,
        p_items jsonb DEFAULT '[]'::jsonb,
        p_is_paid boolean DEFAULT false,
        p_customer_id uuid DEFAULT NULL::uuid,
        p_payment_method text DEFAULT NULL::text,
        p_refund boolean DEFAULT false,
        p_refund_amount numeric DEFAULT 0,
        p_refund_method text DEFAULT NULL::text,
        p_edit_mode boolean DEFAULT false,
        p_order_id uuid DEFAULT NULL::uuid,
        p_original_total numeric DEFAULT 0,
        p_cancelled_items jsonb DEFAULT '[]'::jsonb,
        p_final_total numeric DEFAULT 0,
        p_original_coffee_count integer DEFAULT 0,
        p_is_quick_order boolean DEFAULT false,
        p_discount_id uuid DEFAULT NULL::uuid,
        p_discount_amount numeric DEFAULT 0,
        p_business_id uuid DEFAULT NULL::uuid,
        p_order_type text DEFAULT 'dine_in'::text,
        p_delivery_address text DEFAULT NULL::text,
        p_delivery_fee numeric DEFAULT 0,
        p_delivery_notes text DEFAULT NULL::text
    ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_id uuid;
v_order_number text;
v_total_amount numeric;
v_item jsonb;
v_order_status text;
v_business_id uuid;
v_new_points_count integer := 0;
v_item_id int;
v_item_qty int;
v_item_price numeric;
v_item_status text;
BEGIN -- 1. Identify Business
IF p_business_id IS NOT NULL THEN v_business_id := p_business_id;
ELSE
SELECT business_id INTO v_business_id
FROM employees
WHERE auth_user_id = auth.uid()
LIMIT 1;
END IF;
v_total_amount := COALESCE(p_final_total, 0);
v_order_status := CASE
    WHEN p_order_type = 'delivery' THEN 'pending'
    ELSE 'in_progress'
END;
-- 2. Create/Update Order
IF p_edit_mode THEN v_order_id := p_order_id;
UPDATE orders
SET customer_id = p_customer_id,
    customer_name = p_customer_name,
    customer_phone = p_customer_phone,
    total_amount = v_total_amount,
    is_paid = p_is_paid,
    updated_at = NOW()
WHERE id = v_order_id
    AND business_id = v_business_id
RETURNING order_number INTO v_order_number;
ELSE
INSERT INTO orders (
        business_id,
        customer_id,
        customer_name,
        customer_phone,
        order_status,
        is_paid,
        total_amount,
        discount_id,
        discount_amount,
        payment_method,
        order_type
    )
VALUES (
        v_business_id,
        p_customer_id,
        p_customer_name,
        p_customer_phone,
        v_order_status,
        p_is_paid,
        v_total_amount,
        p_discount_id,
        p_discount_amount,
        p_payment_method,
        COALESCE(p_order_type, 'dine_in')
    )
RETURNING id,
    order_number INTO v_order_id,
    v_order_number;
END IF;
-- 3. Process Items
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP v_item_id := (v_item->>'item_id')::int;
v_item_qty := (v_item->>'quantity')::int;
v_item_price := (v_item->>'price')::numeric;
v_item_status := COALESCE(
    NULLIF(v_item->>'item_status', ''),
    v_order_status
);
-- Count Hot Drinks
IF (v_item->>'is_hot_drink')::boolean = true
OR (v_item->>'is_hot_drink') = 'true' THEN v_new_points_count := v_new_points_count + COALESCE(v_item_qty, 1);
END IF;
IF p_edit_mode
AND (v_item->>'order_item_id') IS NOT NULL
AND (v_item->>'order_item_id') != 'null' THEN
UPDATE order_items
SET quantity = v_item_qty,
    mods = v_item->'mods',
    notes = v_item->>'notes'
WHERE id = (v_item->>'order_item_id')::uuid;
ELSE
INSERT INTO order_items (
        order_id,
        menu_item_id,
        quantity,
        price,
        mods,
        item_status,
        notes,
        course_stage,
        business_id
    )
VALUES (
        v_order_id,
        v_item_id,
        v_item_qty,
        v_item_price,
        v_item->'mods',
        v_item_status,
        v_item->>'notes',
        1,
        v_business_id
    );
END IF;
END LOOP;
-- 4. Loyalty Call
IF p_customer_phone IS NOT NULL
AND length(p_customer_phone) >= 9
AND p_customer_phone NOT LIKE 'GUEST_%'
AND v_new_points_count > 0 THEN PERFORM public.handle_loyalty_purchase(
    p_customer_phone,
    v_business_id,
    v_new_points_count,
    v_order_id,
    false,
    0
);
END IF;
-- 5. Deduct Inventory (NEW!)
-- Only deduct for non-delivery orders immediately. Delivery deducts when accepted? 
-- No, usually deduct immediately to reserve stock.
IF NOT p_edit_mode THEN PERFORM public.deduct_inventory_for_order(v_order_id, v_business_id);
END IF;
RETURN jsonb_build_object(
    'order_id',
    v_order_id,
    'order_number',
    v_order_number
);
END;
$$;