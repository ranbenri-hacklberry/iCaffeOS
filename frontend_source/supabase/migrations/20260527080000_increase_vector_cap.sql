-- Increase product_vectors FIFO cap from 5 to 10
-- Supports dual-face (front + back) visual acquisition

CREATE OR REPLACE FUNCTION public.confirm_product_recognition(
    p_menu_item_id INTEGER,
    p_business_id  UUID,
    p_embedding    vector(512),
    p_image_path   TEXT DEFAULT NULL,
    p_captured_by  UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_count  INTEGER;
    v_was_evicted    BOOLEAN := FALSE;
    v_new_id         UUID;
BEGIN
    -- Count existing vectors for this product + business
    SELECT COUNT(*)::INTEGER INTO v_current_count
    FROM public.product_vectors
    WHERE menu_item_id = p_menu_item_id
      AND business_id  = p_business_id;

    -- FIFO eviction: if we are at or above the cap (10), delete the oldest
    IF v_current_count >= 10 THEN
        DELETE FROM public.product_vectors
        WHERE id IN (
            SELECT pv.id
            FROM public.product_vectors pv
            WHERE pv.menu_item_id = p_menu_item_id
              AND pv.business_id  = p_business_id
            ORDER BY pv.created_at ASC
            LIMIT (v_current_count - 9)   -- remove enough to make room for 1
        );
        v_was_evicted := TRUE;
    END IF;

    -- Insert the new vector
    INSERT INTO public.product_vectors (
        menu_item_id,
        business_id,
        embedding,
        image_path,
        captured_by
    ) VALUES (
        p_menu_item_id,
        p_business_id,
        p_embedding,
        p_image_path,
        p_captured_by
    )
    RETURNING id INTO v_new_id;

    -- Return result
    RETURN jsonb_build_object(
        'success',          TRUE,
        'vector_id',        v_new_id,
        'total_vectors',    LEAST(v_current_count + 1, 10),
        'was_fifo_eviction', v_was_evicted
    );
END;
$$;

COMMENT ON FUNCTION public.confirm_product_recognition
    IS 'Inserts a new product embedding with FIFO eviction so that each product keeps at most 10 reference vectors (5 front + 5 back).';
