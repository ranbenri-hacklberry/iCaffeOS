-- Migration: Fundamental Database-Level Auto-Completion for Orders
-- Sets order status to 'completed' automatically if all active items do not require preparation and order is paid

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
    p_delivery_notes text DEFAULT NULL::text, 
    p_metadata jsonb DEFAULT NULL::jsonb
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 AS $function$
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
      v_item_course_stage int;
      v_cancelled_item jsonb;
      v_has_prep_items boolean;
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
              customer_id    = p_customer_id,
              customer_name  = p_customer_name,
              customer_phone = p_customer_phone,
              total_amount   = v_total_amount,
              is_paid        = p_is_paid,
              updated_at     = NOW()
          WHERE id = v_order_id 
            AND business_id = v_business_id
          RETURNING order_number INTO v_order_number;
      ELSE
          INSERT INTO orders (
              business_id, customer_id, customer_name, customer_phone, 
              order_status, is_paid, total_amount, discount_id, discount_amount, 
              payment_method, order_type
          ) 
          VALUES (
              v_business_id, p_customer_id, p_customer_name, p_customer_phone, 
              v_order_status, p_is_paid, v_total_amount, p_discount_id, p_discount_amount, 
              p_payment_method, COALESCE(p_order_type, 'dine_in')
          )
          RETURNING id, order_number INTO v_order_id, v_order_number;
      END IF;
  
      -- 3. Process Items
      FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
      LOOP
          v_item_id    := (v_item->>'item_id')::int;
          v_item_qty   := (v_item->>'quantity')::int;
          v_item_price := (v_item->>'price')::numeric;
          
          -- 🔑 KEY FIX: Read course_stage from payload (default 1)
          v_item_course_stage := COALESCE(NULLIF(v_item->>'course_stage', '')::int, 1);
          
          -- 🔑 KEY FIX: Read item_status from payload; only force 'held' if payload didn't provide one
          v_item_status := NULLIF(v_item->>'item_status', '');
          IF v_item_status IS NULL THEN
              IF v_item_course_stage >= 2 THEN
                  v_item_status := 'held';
              ELSE
                  v_item_status := v_order_status;
              END IF;
          END IF;
  
          -- Count Hot Drinks
          IF (v_item->>'is_hot_drink')::boolean = true OR (v_item->>'is_hot_drink') = 'true' THEN
              v_new_points_count := v_new_points_count + COALESCE(v_item_qty, 1);
          END IF;
  
          IF p_edit_mode 
              AND (v_item->>'order_item_id') IS NOT NULL 
              AND (v_item->>'order_item_id') != 'null' 
          THEN
              UPDATE order_items 
              SET 
                  quantity     = v_item_qty,
                  mods         = v_item->'mods',
                  notes        = v_item->>'notes',
                  item_status  = v_item_status,
                  course_stage = v_item_course_stage
              WHERE id = (v_item->>'order_item_id')::uuid;
          ELSE
              INSERT INTO order_items (
                  order_id, menu_item_id, quantity, price, mods, 
                  item_status, notes, course_stage, business_id
              ) 
              VALUES (
                  v_order_id, v_item_id, v_item_qty, v_item_price, v_item->'mods', 
                  v_item_status, v_item->>'notes', v_item_course_stage, v_business_id
              );
          END IF;
      END LOOP;
  
      -- 4. Process Cancellations
      IF p_edit_mode AND jsonb_array_length(p_cancelled_items) > 0 THEN
          FOR v_cancelled_item IN SELECT * FROM jsonb_array_elements(p_cancelled_items)
          LOOP
              IF (v_cancelled_item->>'id') IS NOT NULL AND (v_cancelled_item->>'id') != 'null' THEN
                  UPDATE order_items 
                  SET 
                      item_status = 'cancelled',
                      updated_at  = NOW()
                  WHERE id = (v_cancelled_item->>'id')::uuid;
              END IF;
          END LOOP;
      END IF;
  
      -- 5. Loyalty
      IF p_customer_phone IS NOT NULL
          AND length(p_customer_phone) >= 9
          AND p_customer_phone NOT LIKE 'GUEST_%'
          AND v_new_points_count > 0
      THEN
          BEGIN
              PERFORM public.handle_loyalty_purchase(
                  p_customer_phone,
                  v_business_id,
                  v_new_points_count,
                  v_order_id,
                  p_original_coffee_count
              );
          EXCEPTION WHEN OTHERS THEN
              NULL; -- Don't fail order if loyalty fails
          END;
      END IF;
  
      -- 5.5 Auto-Complete check: if the order is paid and has no active items that require kitchen/bar preparation, set status to completed
      IF p_is_paid = true AND COALESCE(p_order_type, 'dine_in') != 'delivery' THEN
          SELECT EXISTS (
              SELECT 1 
              FROM order_items oi
              LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
              WHERE oi.order_id = v_order_id
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
              -- Mark the order itself as completed
              UPDATE orders 
              SET order_status = 'completed', updated_at = NOW()
              WHERE id = v_order_id;
              
              -- Also mark all active items of this order as completed
              UPDATE order_items
              SET item_status = 'completed', updated_at = NOW()
              WHERE order_id = v_order_id AND item_status = 'in_progress';
          END IF;
      END IF;

      -- 6. Deduct Inventory
      PERFORM public.deduct_inventory_for_order(v_order_id, v_business_id);
  
      -- Return full object
      RETURN jsonb_build_object(
          'success', true,
          'order_id', v_order_id,
          'order_number', v_order_number,
          'total_amount', v_total_amount,
          'new_points_count', v_new_points_count
      );
  
  EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
          'success', false,
          'error', SQLERRM,
          'hint', 'Failed in submit_order_v3'
      );
  END;
 $function$;

-- ONE-TIME DATABASE CLEANUP:
-- Complete all paid, non-delivery orders that have no active preparation items in database
WITH orders_to_complete AS (
    SELECT o.id
    FROM orders o
    WHERE o.order_status = 'in_progress'
      AND o.is_paid = true
      AND o.order_type != 'delivery'
      AND NOT EXISTS (
          SELECT 1 
          FROM order_items oi
          LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
          WHERE oi.order_id = o.id
            AND oi.item_status NOT IN ('completed', 'shipped', 'cancelled')
            AND (
                mi.kds_routing_logic = 'MADE_TO_ORDER'
                OR COALESCE(mi.kds_routing_logic, '') LIKE 'routeTo%'
                OR mi.is_hot_drink = true
                OR mi.category IN ('שתיה חמה', 'hot-drinks')
                OR COALESCE(oi.mods::text, '') LIKE '%__KDS_OVERRIDE__%'
                OR COALESCE(oi.mods::text, '') LIKE '%__KDS_OVER_RIDE__%'
            )
      )
)
UPDATE orders
SET order_status = 'completed', updated_at = NOW()
WHERE id IN (SELECT id FROM orders_to_complete);

-- Also complete items for those orders
WITH orders_to_complete AS (
    SELECT o.id
    FROM orders o
    WHERE o.order_status = 'completed'
      AND o.is_paid = true
      AND o.order_type != 'delivery'
      AND NOT EXISTS (
          SELECT 1 
          FROM order_items oi
          LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
          WHERE oi.order_id = o.id
            AND oi.item_status NOT IN ('completed', 'shipped', 'cancelled')
            AND (
                mi.kds_routing_logic = 'MADE_TO_ORDER'
                OR COALESCE(mi.kds_routing_logic, '') LIKE 'routeTo%'
                OR mi.is_hot_drink = true
                OR mi.category IN ('שתיה חמה', 'hot-drinks')
                OR COALESCE(oi.mods::text, '') LIKE '%__KDS_OVERRIDE__%'
                OR COALESCE(oi.mods::text, '') LIKE '%__KDS_OVER_RIDE__%'
            )
      )
)
UPDATE order_items
SET item_status = 'completed', updated_at = NOW()
WHERE order_id IN (SELECT id FROM orders_to_complete) AND item_status = 'in_progress';
