-- =====================================================
-- Profile Update RPC Functions
-- Functions for employees to update their own profile
-- =====================================================

-- =====================================================
-- 1. RPC: update_employee_password
-- Description: Update employee password (with current password verification)
-- =====================================================
CREATE OR REPLACE FUNCTION update_employee_password(
    p_employee_id UUID,
    p_current_password TEXT,
    p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_current_hash TEXT;
    v_new_hash TEXT;
BEGIN
    -- Get current password hash
    SELECT password_hash INTO v_current_hash
    FROM employees
    WHERE id = p_employee_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Employee not found'
        );
    END IF;

    -- Verify current password (using crypt extension)
    IF v_current_hash IS NULL OR v_current_hash != crypt(p_current_password, v_current_hash) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Current password is incorrect'
        );
    END IF;

    -- Hash new password
    v_new_hash := crypt(p_new_password, gen_salt('bf', 10));

    -- Update password
    UPDATE employees
    SET
        password_hash = v_new_hash,
        updated_at = NOW()
    WHERE id = p_employee_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Password updated successfully'
    );
END;
$$;

-- =====================================================
-- 2. RPC: update_employee_pin
-- Description: Update employee PIN code
-- =====================================================
CREATE OR REPLACE FUNCTION update_employee_pin(
    p_employee_id UUID,
    p_pin_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_pin_hash TEXT;
BEGIN
    -- Validate PIN (4-6 digits)
    IF p_pin_code !~ '^\d{4,6}$' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'PIN must be 4-6 digits'
        );
    END IF;

    -- Hash PIN
    v_pin_hash := crypt(p_pin_code, gen_salt('bf', 10));

    -- Update PIN
    UPDATE employees
    SET
        pin_hash = v_pin_hash,
        updated_at = NOW()
    WHERE id = p_employee_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Employee not found'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'PIN updated successfully'
    );
END;
$$;

-- =====================================================
-- Grant Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION update_employee_password TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_employee_pin TO authenticated, anon;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION update_employee_password IS 'Update employee password with current password verification';
COMMENT ON FUNCTION update_employee_pin IS 'Update employee PIN code (4-6 digits)';
