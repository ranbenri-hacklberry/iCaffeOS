-- Migration: Fix submit_order_v3 to correctly handle course_stage and item_status from payload
-- This fixes the bug where "second courses" (מנה שניה) were always showing as stage 1

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
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_order_id uuid;
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
    v_item_course_stage int;  -- 🔑 NEW: read from payload
    v_cancelled_item jsonb;
BEGIN
    -- 1. Identify Business
    IF p_business_id IS NOT NULL THEN
        v_business_id := p_business_id;
    ELSE
        SELECT business_id INTO v_business_id
        FROM employees
        WHERE auth_user_id = auth.uid()
        LIMIT 1;
    END IF;

    v_total_amount := COALESCE(p_final_total, 0);

    -- Order status: delivery stays 'pending', everything else is 'in_progress'
    v_order_status := CASE
        WHEN p_order_type = 'delivery' THEN 'pending'
        ELSE 'in_progress'
    END;

    -- 2. Create/Update Order
    IF p_edit_mode THEN
        v_order_id := p_order_id;
        UPDATE orders
        SET
            customer_id = p_customer_id,
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
        RETURNING id, order_number INTO v_order_id, v_order_number;
    END IF;

    -- 3. Process Items (Active/New items)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_id      := (v_item->>'item_id')::int;
        v_item_qty     := (v_item->>'quantity')::int;
        v_item_price   := (v_item->>'price')::numeric;

        -- 🔑 FIX: Read course_stage from payload (defaults to 1 if missing)
        v_item_course_stage := COALESCE(NULLIF(v_item->>'course_stage', '')::int, 1);

        -- 🔑 FIX: Read item_status from payload; held items stay held
        v_item_status := COALESCE(
            NULLIF(v_item->>'item_status', ''),
            CASE WHEN v_item_course_stage >= 2 THEN 'held' ELSE v_order_status END
        );

        -- Count Hot Drinks for Loyalty
        IF (v_item->>'is_hot_drink')::boolean = true OR (v_item->>'is_hot_drink') = 'true' THEN
            v_new_points_count := v_new_points_count + COALESCE(v_item_qty, 1);
        END IF;

        IF p_edit_mode
            AND (v_item->>'order_item_id') IS NOT NULL
            AND (v_item->>'order_item_id') != 'null'
        THEN
            -- Update existing item  (preserve course_stage and status unless explicitly changed)
            UPDATE order_items
            SET
                quantity    = v_item_qty,
                mods        = v_item->'mods',
                notes       = v_item->>'notes',
                item_status = v_item_status,
                course_stage = v_item_course_stage
            WHERE id = (v_item->>'order_item_id')::uuid;
        ELSE
            -- Insert new item
            INSERT INTO order_items (
                order_id,
                menu_item_id,
                quantity,
                price,
                mods,
                item_status,
                notes,
                course_stage,   -- 🔑 FIX: Use payload value, not hardcoded 1
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
                v_item_course_stage,
                v_business_id
            );
        END IF;
    END LOOP;

    -- 4. Cancel Items (edit mode)
    IF p_edit_mode AND jsonb_array_length(p_cancelled_items) > 0 THEN
        FOR v_cancelled_item IN SELECT * FROM jsonb_array_elements(p_cancelled_items)
        LOOP
            UPDATE order_items
            SET item_status = 'cancelled'
            WHERE id = (v_cancelled_item->>'id')::uuid
              AND order_id = v_order_id;
        END LOOP;
    END IF;

    -- 5. Loyalty
    IF p_customer_phone IS NOT NULL
        AND length(p_customer_phone) >= 9
        AND p_customer_phone NOT LIKE 'GUEST_%'
        AND v_new_points_count > 0
    THEN
        PERFORM public.handle_loyalty_purchase(
            p_customer_phone,
            v_business_id,
            v_new_points_count,
            v_order_id,
            p_original_coffee_count
        );
    END IF;

    -- 6. Delivery fee item if applicable
    IF p_delivery_fee > 0 AND NOT p_edit_mode THEN
        INSERT INTO order_items (
            order_id, menu_item_id, quantity, price, mods, item_status, notes, course_stage, business_id
        )
        SELECT
            v_order_id, id, 1, p_delivery_fee, '[]'::jsonb, 'ready', p_delivery_notes, 1, v_business_id
        FROM menu_items
        WHERE business_id = v_business_id
          AND (name ILIKE '%משלוח%' OR name ILIKE '%delivery%')
        LIMIT 1;
    END IF;

    -- 7. Return result
    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_number', v_order_number,
        'status', v_order_status
    );

EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;
