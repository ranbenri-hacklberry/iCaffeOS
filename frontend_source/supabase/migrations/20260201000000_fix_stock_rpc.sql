-- nuklear option: Dynamically find and drop ALL functions named 'update_stock_quantity' regardless of signature
-- This resolves the "function name is not unique" error unequivocally.
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT oid::regprocedure as func_signature
    FROM pg_proc
    WHERE proname = 'update_stock_quantity'
        AND pronamespace = 'public'::regnamespace
) LOOP RAISE NOTICE 'Dropping function: %',
r.func_signature;
EXECUTE 'DROP FUNCTION ' || r.func_signature;
END LOOP;
END $$;
-- NOW RE-CREATE THE FUNCTION CLEANLY
CREATE OR REPLACE FUNCTION public.update_stock_quantity(
        p_item_id BIGINT,
        p_new_stock NUMERIC,
        p_business_id UUID,
        p_counted_by UUID DEFAULT NULL,
        p_source TEXT DEFAULT 'manual'
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER -- Runs with superuser privileges (bypassing RLS)
    AS $$
DECLARE v_updated_item JSONB;
BEGIN
UPDATE public.inventory_items
SET current_stock = p_new_stock,
    last_counted_at = NOW(),
    last_counted_by = p_counted_by,
    last_count_source = p_source
WHERE id = p_item_id
RETURNING to_jsonb(inventory_items.*) INTO v_updated_item;
IF v_updated_item IS NULL THEN RETURN jsonb_build_object(
    'error',
    'Item not found (invalid ID) or update failed'
);
END IF;
RETURN v_updated_item;
END;
$$;
-- Grant permissions to everyone authenticated
GRANT EXECUTE ON FUNCTION public.update_stock_quantity TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_stock_quantity TO service_role;