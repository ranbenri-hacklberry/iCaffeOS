-- Migration: Product Recognition System (pgvector-based)
-- Date: 2026-05-23
-- Description: Add product_vectors table, matching RPC, FIFO-capped
--              confirmation RPC, and vector count helper for the
--              iCaffeOS visual product recognition pipeline.

-- ============================================
-- 1. product_vectors table
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_vectors (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id INTEGER       NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    business_id  UUID          NOT NULL,
    embedding    extensions.vector(512) NOT NULL,
    image_path   TEXT,
    captured_by  UUID,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.product_vectors
    IS 'Stores per-product 512-d MobileNet embeddings used for visual product recognition. Capped at 5 vectors per product via FIFO eviction.';

COMMENT ON COLUMN public.product_vectors.embedding
    IS '512-dimensional MobileNet feature vector (cosine similarity via pgvector)';

COMMENT ON COLUMN public.product_vectors.image_path
    IS 'Supabase Storage path of the source WebP image used to generate this embedding';

COMMENT ON COLUMN public.product_vectors.captured_by
    IS 'UUID of the employee who confirmed the product recognition';

-- ============================================
-- 2. Indexes
-- ============================================

-- IVFFlat index for fast approximate nearest-neighbour cosine search
CREATE INDEX product_vectors_embedding_idx
    ON public.product_vectors
    USING ivfflat (embedding extensions.vector_cosine_ops)
    WITH (lists = '50');

-- Composite index for quick lookups by business + menu item
CREATE INDEX product_vectors_business_item_idx
    ON public.product_vectors (business_id, menu_item_id);

-- ============================================
-- 3. match_product_vector() — similarity search
-- ============================================

CREATE OR REPLACE FUNCTION public.match_product_vector(
    query_embedding   extensions.vector(512),
    p_business_id     UUID,
    match_threshold   DOUBLE PRECISION DEFAULT 0.75,
    match_count       INTEGER          DEFAULT 3
)
RETURNS TABLE (
    matched_product_id   INTEGER,
    product_name         TEXT,
    confidence_score     DOUBLE PRECISION,
    existing_vector_count BIGINT,
    product_price        NUMERIC,
    product_category     TEXT,
    product_image_url    TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        mi.id                                          AS matched_product_id,
        mi.name                                        AS product_name,
        MAX(1 - (pv.embedding <=> query_embedding))    AS confidence_score,
        COUNT(pv.id)                                   AS existing_vector_count,
        mi.price                                       AS product_price,
        mi.category                                    AS product_category,
        mi.image_url                                   AS product_image_url
    FROM public.product_vectors pv
    JOIN public.menu_items mi ON mi.id = pv.menu_item_id
    WHERE pv.business_id = p_business_id
      AND mi.is_deleted IS NOT TRUE
      AND (1 - (pv.embedding <=> query_embedding)) > match_threshold
    GROUP BY mi.id, mi.name, mi.price, mi.category, mi.image_url
    ORDER BY confidence_score DESC
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_product_vector
    IS 'Returns the best-matching products for a given 512-d query embedding using cosine similarity, grouped by product with the highest confidence per product.';

-- ============================================
-- 4. confirm_product_recognition() — insert
--    with FIFO eviction (max 5 vectors/product)
-- ============================================

CREATE OR REPLACE FUNCTION public.confirm_product_recognition(
    p_menu_item_id  INTEGER,
    p_business_id   UUID,
    p_embedding     extensions.vector(512),
    p_image_path    TEXT     DEFAULT NULL,
    p_captured_by   UUID     DEFAULT NULL
)
RETURNS JSONB
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

    -- FIFO eviction: if we are at or above the cap, delete the oldest
    IF v_current_count >= 5 THEN
        DELETE FROM public.product_vectors
        WHERE id IN (
            SELECT pv.id
            FROM public.product_vectors pv
            WHERE pv.menu_item_id = p_menu_item_id
              AND pv.business_id  = p_business_id
            ORDER BY pv.created_at ASC
            LIMIT (v_current_count - 4)   -- remove enough to make room for 1
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
        'total_vectors',    LEAST(v_current_count + 1, 5),
        'was_fifo_eviction', v_was_evicted
    );
END;
$$;

COMMENT ON FUNCTION public.confirm_product_recognition
    IS 'Inserts a new product embedding with FIFO eviction so that each product keeps at most 5 reference vectors.';

-- ============================================
-- 5. get_product_vector_count() — helper
-- ============================================

CREATE OR REPLACE FUNCTION public.get_product_vector_count(
    p_menu_item_id  INTEGER,
    p_business_id   UUID
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.product_vectors
    WHERE menu_item_id = p_menu_item_id
      AND business_id  = p_business_id;
$$;

COMMENT ON FUNCTION public.get_product_vector_count
    IS 'Returns the number of stored reference vectors for a given product within a business.';

-- ============================================
-- 6. Row-Level Security
-- ============================================

ALTER TABLE public.product_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to product_vectors"
    ON public.product_vectors
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 7. Grants
-- ============================================

-- Table access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_vectors
    TO anon, authenticated, service_role;

-- Function access
GRANT EXECUTE ON FUNCTION public.match_product_vector(extensions.vector, UUID, DOUBLE PRECISION, INTEGER)
    TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.confirm_product_recognition(INTEGER, UUID, extensions.vector, TEXT, UUID)
    TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_product_vector_count(INTEGER, UUID)
    TO anon, authenticated, service_role;
