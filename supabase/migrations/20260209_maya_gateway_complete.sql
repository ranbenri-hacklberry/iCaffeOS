-- =====================================================
-- MAYA GATEWAY - Complete Database Setup
-- Face Recognition + PIN Auth + Clock Events
-- =====================================================

-- Enable pgvector extension for face embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 1. ADD FACE EMBEDDING COLUMN TO EMPLOYEES
-- =====================================================

-- Add face_embedding column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'employees'
        AND column_name = 'face_embedding'
    ) THEN
        ALTER TABLE employees
        ADD COLUMN face_embedding vector(128);

        -- Add index for fast similarity search
        CREATE INDEX IF NOT EXISTS employees_face_embedding_idx
        ON employees USING ivfflat (face_embedding vector_cosine_ops)
        WITH (lists = 100);
    END IF;
END $$;

-- Add PIN column if it doesn't exist (hashed with bcrypt)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'employees'
        AND column_name = 'pin_hash'
    ) THEN
        ALTER TABLE employees
        ADD COLUMN pin_hash TEXT;
    END IF;
END $$;

-- =====================================================
-- 2. CLOCK EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS clock_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('clock-in', 'clock-out')),
    assigned_role TEXT, -- Chef, Barista, Checker, etc.
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS clock_events_employee_idx ON clock_events(employee_id);
CREATE INDEX IF NOT EXISTS clock_events_business_idx ON clock_events(business_id);
CREATE INDEX IF NOT EXISTS clock_events_timestamp_idx ON clock_events(timestamp DESC);

-- =====================================================
-- 3. RPC: match_employee_face
-- Find employees by face embedding similarity
-- =====================================================

CREATE OR REPLACE FUNCTION match_employee_face(
    embedding vector(128),
    match_threshold float DEFAULT 0.4,
    match_count int DEFAULT 1
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    access_level TEXT,
    is_super_admin BOOLEAN,
    business_id UUID,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        e.email,
        e.access_level,
        e.is_super_admin,
        e.business_id,
        1 - (e.face_embedding <=> embedding) as similarity
    FROM employees e
    WHERE e.face_embedding IS NOT NULL
    AND 1 - (e.face_embedding <=> embedding) > match_threshold
    ORDER BY e.face_embedding <=> embedding
    LIMIT match_count;
END;
$$;

-- =====================================================
-- 4. RPC: update_employee_face
-- Update employee face embedding
-- =====================================================

CREATE OR REPLACE FUNCTION update_employee_face(
    p_employee_id UUID,
    p_embedding TEXT -- JSON array as string: "[0.1, 0.2, ...]"
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Update the face embedding
    UPDATE employees
    SET face_embedding = p_embedding::vector(128)
    WHERE id = p_employee_id;

    IF NOT FOUND THEN
        v_result := json_build_object(
            'success', false,
            'message', 'Employee not found'
        );
    ELSE
        v_result := json_build_object(
            'success', true,
            'message', 'Face enrolled successfully',
            'employee_id', p_employee_id
        );
    END IF;

    RETURN v_result;
END;
$$;

-- =====================================================
-- 5. RPC: verify_employee_pin
-- Verify employee PIN (bcrypt hash comparison done in backend)
-- =====================================================

CREATE OR REPLACE FUNCTION verify_employee_pin(
    p_pin TEXT,
    p_business_id UUID
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    access_level TEXT,
    is_super_admin BOOLEAN,
    business_id UUID,
    pin_hash TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Return employee with matching business_id
    -- PIN verification (bcrypt) happens in backend
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        e.email,
        e.access_level,
        e.is_super_admin,
        e.business_id,
        e.pin_hash
    FROM employees e
    WHERE e.business_id = p_business_id
    AND e.pin_hash IS NOT NULL;
END;
$$;

-- =====================================================
-- 6. RPC: check_clocked_in
-- Check if employee is currently clocked in
-- =====================================================

CREATE OR REPLACE FUNCTION check_clocked_in(
    p_employee_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_last_event clock_events;
    v_is_clocked_in BOOLEAN;
    v_result JSON;
BEGIN
    -- Get the most recent clock event
    SELECT * INTO v_last_event
    FROM clock_events
    WHERE employee_id = p_employee_id
    ORDER BY timestamp DESC
    LIMIT 1;

    -- Determine if clocked in
    IF v_last_event IS NULL THEN
        v_is_clocked_in := false;
    ELSIF v_last_event.event_type = 'clock-in' THEN
        v_is_clocked_in := true;
    ELSE
        v_is_clocked_in := false;
    END IF;

    v_result := json_build_object(
        'isClockedIn', v_is_clocked_in,
        'lastEvent', row_to_json(v_last_event)
    );

    RETURN v_result;
END;
$$;

-- =====================================================
-- 7. RPC: create_clock_event
-- Create a clock-in or clock-out event
-- =====================================================

CREATE OR REPLACE FUNCTION create_clock_event(
    p_employee_id UUID,
    p_business_id UUID,
    p_event_type TEXT,
    p_assigned_role TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_event_id UUID;
    v_result JSON;
BEGIN
    -- Validate event type
    IF p_event_type NOT IN ('clock-in', 'clock-out') THEN
        RAISE EXCEPTION 'Invalid event type: %', p_event_type;
    END IF;

    -- Create the clock event
    INSERT INTO clock_events (
        employee_id,
        business_id,
        event_type,
        assigned_role,
        timestamp
    ) VALUES (
        p_employee_id,
        p_business_id,
        p_event_type,
        p_assigned_role,
        NOW()
    )
    RETURNING id INTO v_event_id;

    v_result := json_build_object(
        'success', true,
        'eventId', v_event_id,
        'eventType', p_event_type,
        'timestamp', NOW()
    );

    RETURN v_result;
END;
$$;

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION match_employee_face TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_employee_face TO authenticated, anon;
GRANT EXECUTE ON FUNCTION verify_employee_pin TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_clocked_in TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_clock_event TO authenticated, anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON clock_events TO authenticated, anon;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION match_employee_face IS 'Find employees by face embedding similarity using pgvector';
COMMENT ON FUNCTION update_employee_face IS 'Update or enroll employee face embedding';
COMMENT ON FUNCTION verify_employee_pin IS 'Get employees for PIN verification (hash comparison in backend)';
COMMENT ON FUNCTION check_clocked_in IS 'Check if employee is currently clocked in';
COMMENT ON FUNCTION create_clock_event IS 'Create a clock-in or clock-out event';

COMMENT ON COLUMN employees.face_embedding IS '128-dimensional face embedding vector from face-api.js';
COMMENT ON COLUMN employees.pin_hash IS 'Bcrypt hash of employee PIN for fallback authentication';
COMMENT ON TABLE clock_events IS 'Employee clock-in/clock-out events with role assignments';
