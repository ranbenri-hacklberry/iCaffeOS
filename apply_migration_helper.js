
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
// Using Service Role Key to Apply Migration
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvzjF19HkGqF1qg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SQL_MIGRATION = `
-- ============================================================
-- 🛡️ ULTIMATE LOYALTY FIX: ATOMIC TRANSACTION IN SUBMIT_ORDER_V3
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_order_v3(
    p_customer_phone text,
    p_customer_name text,
    p_items jsonb,
    p_is_paid boolean,
    p_customer_id uuid DEFAULT NULL,
    p_payment_method text DEFAULT NULL,
    p_refund boolean DEFAULT false,
    edit_mode boolean DEFAULT false,
    order_id uuid DEFAULT NULL,
    original_total numeric DEFAULT NULL,
    is_refund boolean DEFAULT false,
    p_cancelled_items jsonb DEFAULT '[]'::jsonb,
    p_final_total numeric DEFAULT NULL,
    p_original_coffee_count int DEFAULT NULL,
    p_is_quick_order boolean DEFAULT false,
    p_business_id uuid DEFAULT NULL,
    p_loyalty_earned int DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_order_id uuid;
    v_order_number text;
    v_total_amount numeric;
    v_item jsonb;
    v_order_status text;
    v_remaining_items int;
    v_business_id uuid;
    v_loyalty_items_count int;
BEGIN
    -- 1. IDENTIFY BUSINESS
    v_business_id := p_business_id;
    IF v_business_id IS NULL THEN
        v_business_id := public.current_user_business_id(); -- Fallback
    END IF;
    IF v_business_id IS NULL THEN
        -- Default to the main business ID if not found (Hardcoded safety net)
        v_business_id := '11111111-1111-1111-1111-111111111111'; 
    END IF;

    -- 2. CALCULATE TOTAL
    IF p_final_total IS NOT NULL THEN
        v_total_amount := p_final_total;
    ELSE
        SELECT COALESCE(SUM((item->>'price')::numeric * (item->>'quantity')::int), 0)
        INTO v_total_amount
        FROM jsonb_array_elements(p_items) AS item;
    END IF;

    v_order_status := 'in_progress';

    -- 3. CREATE / UPDATE ORDER
    IF edit_mode THEN
        v_order_id := order_id;
        
        UPDATE orders 
        SET 
            total_amount = v_total_amount, 
            is_paid = p_is_paid, 
            payment_method = p_payment_method, 
            is_refund = p_refund,
            refund_amount = CASE WHEN p_refund THEN original_total - v_total_amount ELSE 0 END
        WHERE id = v_order_id
        RETURNING order_number INTO v_order_number;
        
    ELSE
        -- 🆕 NEW ORDER INSERT
        INSERT INTO orders (
            customer_id, customer_name, customer_phone, 
            order_status, is_paid, payment_method, total_amount, 
            is_refund, refund_amount, business_id
        ) VALUES (
            p_customer_id, p_customer_name, p_customer_phone,
            v_order_status, p_is_paid, p_payment_method, v_total_amount,
            p_refund, CASE WHEN p_refund THEN v_total_amount ELSE 0 END, v_business_id
        )
        RETURNING id, order_number INTO v_order_id, v_order_number;
        
        IF p_is_quick_order THEN
             -- Update name for quick orders
             UPDATE orders SET customer_name = '#' || v_order_number WHERE id = v_order_id;
        END IF;

        -- 🛡️ 4. LOYALTY ATOMIC UPDATE (THE ROOT FIX) 🛡️
        
        -- A. Determine points to add
        v_loyalty_items_count := p_loyalty_earned;
        
        -- Safety fallback: Calculate from items if not provided or 0
        IF v_loyalty_items_count <= 0 THEN
             SELECT COALESCE(SUM((item->>'quantity')::int), 0)
             INTO v_loyalty_items_count
             FROM jsonb_array_elements(p_items) AS item
             -- Assuming all items are eligible for now (simple point system)
             WHERE (item->>'price')::numeric > 0;
        END IF;

        -- B. Execute Loyalty Update ONLY if valid phone and points > 0
        IF p_customer_phone IS NOT NULL AND v_loyalty_items_count > 0 THEN
            
            -- Auto-create card if missing (Internal helper logic)
            INSERT INTO loyalty_cards (customer_phone, points_balance, total_free_coffees_redeemed)
            VALUES (p_customer_phone, 0, 0)
            ON CONFLICT (customer_phone) DO NOTHING;

            -- Call the helper to update balance and log transaction
            PERFORM public.handle_loyalty_purchase(
                p_customer_phone,
                v_order_id,
                v_loyalty_items_count
            );
        END IF;

    END IF;

    -- 5. INSERT ITEMS
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id, menu_item_id, quantity, price, mods, item_status, notes,
            course_stage, business_id
        ) VALUES (
            v_order_id,
            (v_item->>'item_id')::int,
            (v_item->>'quantity')::int,
            (v_item->>'price')::numeric,
            v_item->'mods',
            'in_progress',
            v_item->>'notes',
            COALESCE((v_item->>'course_stage')::int, 1),
            v_business_id
        );
    END LOOP;

    -- 6. DEDUCT INVENTORY
    IF NOT edit_mode THEN
        PERFORM deduct_inventory_for_order(v_order_id, v_business_id);
    END IF;

    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_number', v_order_number,
        'loyalty_points_added', v_loyalty_items_count
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.submit_order_v3 TO anon, authenticated, service_role;
`;

async function applyMigration() {
    console.log('🚀 Applying ATOMIC LOYALTY FIX via RPC/Query...');

    // We can't run RAW SQL via client easily without a specific RPC wrapper for exec_sql.
    // However, I can try to use a maintenance function if exists, OR ask user to run it.
    // Since user previous attempt failed with "Service Role Key Invalid" (my bad), 
    // I will output the file content clearly for the user to copy-paste.

    console.log('⚠️ CANNOT RUN SQL DIRECTLY FROM NODE CLIENT WITHOUT EXEC_SQL RPC.');
    console.log('📝 Please copy content of ATOMIC_LOYALTY_FIX_V3.sql to Supabase SQL Editor.');
}

applyMigration();
