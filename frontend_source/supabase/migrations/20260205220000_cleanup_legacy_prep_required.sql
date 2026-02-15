-- Clean up legacy KDS routing
-- 1. Update RPC to stop using is_prep_required
CREATE OR REPLACE FUNCTION public.get_kds_orders(p_date text, p_business_id uuid) RETURNS TABLE(
        id uuid,
        order_number bigint,
        order_status text,
        is_paid boolean,
        created_at timestamp with time zone,
        fired_at timestamp with time zone,
        ready_at timestamp with time zone,
        customer_name text,
        customer_phone text,
        total_amount numeric,
        payment_method text,
        discount_id uuid,
        discount_amount numeric,
        order_type text,
        delivery_address text,
        delivery_fee numeric,
        delivery_notes text,
        items_detail jsonb
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY
SELECT o.id,
    o.order_number,
    o.order_status,
    o.is_paid,
    o.created_at,
    o.fired_at,
    o.ready_at,
    o.customer_name,
    o.customer_phone,
    o.total_amount,
    o.payment_method,
    o.discount_id,
    o.discount_amount,
    o.order_type,
    o.delivery_address,
    o.delivery_fee,
    o.delivery_notes,
    jsonb_agg(
        jsonb_build_object(
            'id',
            oi.id,
            'quantity',
            oi.quantity,
            'price',
            oi.price,
            'mods',
            oi.mods,
            'notes',
            oi.notes,
            'item_status',
            oi.item_status,
            'course_stage',
            oi.course_stage,
            'item_fired_at',
            oi.item_fired_at,
            'is_early_delivered',
            oi.is_early_delivered,
            'menu_item_id',
            oi.menu_item_id,
            'menu_items',
            jsonb_build_object(
                'id',
                mi.id,
                'name',
                mi.name,
                'price',
                mi.price,
                'category',
                mi.category,
                'kds_routing_logic',
                mi.kds_routing_logic
            )
        )
    ) AS items_detail
FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
WHERE -- 1. Business Filter
    (
        p_business_id IS NULL
        OR o.business_id = p_business_id
    ) -- 2. Item Filter (don't show cancelled items in the JSON array)
    AND oi.item_status != 'cancelled' -- 3. Main KDS Logic
    AND (
        o.created_at >= p_date::TIMESTAMP WITH TIME ZONE
        OR (
            o.order_status IN (
                'pending',
                'in_progress',
                'new',
                'ready',
                'prep_started',
                'held'
            )
            AND o.created_at >= (NOW() - INTERVAL '7 days')
        )
    )
GROUP BY o.id
ORDER BY o.created_at ASC;
END;
$$;
-- 2. Drop the legacy column (Safe to run after code deploy)
-- ALTER TABLE menu_items DROP COLUMN IF EXISTS is_prep_required;