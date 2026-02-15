-- Fix receive_inventory_shipment to multiply by weight_per_unit if tracked in grams (unit in KG/G)
CREATE OR REPLACE FUNCTION public.receive_inventory_shipment(
        p_items jsonb,
        p_order_id uuid DEFAULT NULL::uuid,
        p_supplier_id bigint DEFAULT NULL::bigint,
        p_notes text DEFAULT NULL::text,
        p_business_id uuid DEFAULT NULL::uuid
    ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_item JSONB;
v_inventory_item_id INT;
v_catalog_item_id UUID;
v_actual_qty NUMERIC;
v_invoiced_qty NUMERIC;
v_unit_price NUMERIC;
v_variance NUMERIC;
v_total_items INT := 0;
v_total_variance NUMERIC := 0;
v_created_by UUID := auth.uid();
v_item_name TEXT;
v_item_unit TEXT;
v_item_category TEXT;
v_exists BOOLEAN;
v_weight_per_unit NUMERIC;
v_qty_to_add NUMERIC;
BEGIN IF p_items IS NULL
OR jsonb_array_length(p_items) = 0 THEN RETURN jsonb_build_object('success', false, 'error', 'No items provided');
END IF;
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP v_inventory_item_id := (v_item->>'inventory_item_id')::INT;
v_catalog_item_id := (v_item->>'catalog_item_id')::UUID;
v_actual_qty := COALESCE((v_item->>'actual_qty')::NUMERIC, 0);
v_invoiced_qty := COALESCE((v_item->>'invoiced_qty')::NUMERIC, v_actual_qty);
v_unit_price := (v_item->>'unit_price')::NUMERIC;
IF v_inventory_item_id IS NOT NULL THEN
SELECT weight_per_unit INTO v_weight_per_unit
FROM inventory_items
WHERE id = v_inventory_item_id;
END IF;
IF v_inventory_item_id IS NULL
AND v_catalog_item_id IS NOT NULL
AND p_business_id IS NOT NULL THEN
SELECT id,
    weight_per_unit INTO v_inventory_item_id,
    v_weight_per_unit
FROM inventory_items
WHERE catalog_item_id = v_catalog_item_id
    AND business_id = p_business_id;
IF v_inventory_item_id IS NULL THEN
SELECT name,
    unit,
    category INTO v_item_name,
    v_item_unit,
    v_item_category
FROM catalog_items
WHERE id = v_catalog_item_id;
INSERT INTO inventory_items (
        name,
        category,
        unit,
        current_stock,
        cost_per_unit,
        catalog_item_id,
        business_id,
        supplier_id
    )
VALUES (
        v_item_name,
        v_item_category,
        v_item_unit,
        0,
        v_unit_price,
        v_catalog_item_id,
        p_business_id,
        p_supplier_id
    )
RETURNING id INTO v_inventory_item_id;
v_weight_per_unit := 0;
END IF;
END IF;
v_qty_to_add := v_actual_qty;
-- If item is measured in grams (tracked in KG/G) and has a unit weight, multiply
IF v_weight_per_unit > 0 THEN v_qty_to_add := v_actual_qty * v_weight_per_unit;
END IF;
IF v_inventory_item_id IS NOT NULL THEN
UPDATE inventory_items
SET current_stock = COALESCE(current_stock, 0) + v_qty_to_add,
    cost_per_unit = COALESCE(v_unit_price, cost_per_unit),
    last_counted_at = NOW(),
    last_counted_by = v_created_by,
    last_count_source = 'order_receipt',
    last_updated = NOW()
WHERE id = v_inventory_item_id;
v_variance := v_actual_qty - v_invoiced_qty;
-- Still log variance in units/packs as entered
INSERT INTO inventory_logs (
        inventory_item_id,
        catalog_item_id,
        transaction_type,
        log_type,
        quantity,
        unit_price,
        supplier_id,
        reference_type,
        reference_id,
        expected_quantity,
        variance,
        notes,
        created_by,
        business_id
    )
VALUES (
        v_inventory_item_id,
        v_catalog_item_id,
        'IN',
        'RECEIPT',
        v_actual_qty,
        v_unit_price,
        p_supplier_id,
        CASE
            WHEN p_order_id IS NOT NULL THEN 'supplier_order'
            ELSE 'invoice_scan'
        END,
        COALESCE(p_order_id::TEXT, gen_random_uuid()::TEXT),
        v_invoiced_qty,
        v_variance,
        p_notes,
        v_created_by,
        p_business_id
    );
v_total_items := v_total_items + 1;
v_total_variance := v_total_variance + ABS(v_variance);
END IF;
END LOOP;
IF p_order_id IS NOT NULL THEN
UPDATE supplier_orders
SET status = 'received',
    delivery_status = 'arrived',
    confirmed_at = NOW(),
    confirmed_by = v_created_by
WHERE id = p_order_id;
END IF;
RETURN jsonb_build_object(
    'success',
    true,
    'items_processed',
    v_total_items,
    'total_variance',
    v_total_variance
);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;