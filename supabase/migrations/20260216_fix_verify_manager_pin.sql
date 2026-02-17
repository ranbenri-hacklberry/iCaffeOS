-- Fix verify_manager_pin function
-- Simplified version - uses only pin_code and access_level columns

CREATE OR REPLACE FUNCTION public.verify_manager_pin(p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_employee RECORD;
BEGIN
    -- Look for employee with matching PIN and manager-level access
    -- Case-insensitive access level check
    SELECT id, name, business_id, access_level
    INTO v_employee
    FROM employees
    WHERE pin_code = p_pin
        AND LOWER(access_level) IN ('admin', 'manager', 'owner')
    LIMIT 1;

    IF v_employee.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'valid', true,
            'manager_id', v_employee.id,
            'employee_id', v_employee.id,
            'manager_name', v_employee.name,
            'name', v_employee.name,
            'business_id', v_employee.business_id
        );
    ELSE
        RETURN jsonb_build_object('valid', false);
    END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_manager_pin(TEXT) TO anon, authenticated;
