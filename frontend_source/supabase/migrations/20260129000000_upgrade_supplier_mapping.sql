-- Migration to upgrade supplier mapping to an array and add learning RPC
-- 1. Convert supplier_product_name to array
ALTER TABLE public.inventory_items
ALTER COLUMN supplier_product_name TYPE text [] USING CASE
        WHEN supplier_product_name IS NULL THEN ARRAY []::text []
        WHEN supplier_product_name = '' THEN ARRAY []::text []
        ELSE ARRAY [supplier_product_name]::text []
    END;
-- 2. Create RPC to append unique supplier names
CREATE OR REPLACE FUNCTION public.append_supplier_name(p_item_id integer, p_new_name text) RETURNS void AS $$ BEGIN
UPDATE public.inventory_items
SET supplier_product_name = array_append(
        COALESCE(supplier_product_name, ARRAY []::text []),
        p_new_name
    )
WHERE id = p_item_id
    AND (
        supplier_product_name IS NULL
        OR NOT (supplier_product_name @> ARRAY [p_new_name])
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;