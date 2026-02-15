-- Migration: iPad Menu Editor Database Schema
-- Adds container_seeds to businesses and creates pending_approvals table
-- 1. Add container_seeds JSONB column to businesses
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS container_seeds JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN businesses.container_seeds IS 'Container seed images for AI generation. Structure: [{id, name, category, image_url, prompt_hint}]';
-- 2. Create pending_approvals table for manager approval workflow
CREATE TABLE IF NOT EXISTS pending_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    requester_id UUID,
    action_type TEXT NOT NULL CHECK (
        action_type IN ('new_item', 'edit_item', 'delete_item')
    ),
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    manager_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_pending_approvals_business_id ON pending_approvals(business_id);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_status ON pending_approvals(status);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_created_at ON pending_approvals(created_at DESC);
-- Enable RLS
ALTER TABLE pending_approvals ENABLE ROW LEVEL SECURITY;
-- RLS Policies
CREATE POLICY "pending_approvals_read" ON pending_approvals FOR
SELECT USING (true);
CREATE POLICY "pending_approvals_insert" ON pending_approvals FOR
INSERT WITH CHECK (true);
CREATE POLICY "pending_approvals_update" ON pending_approvals FOR
UPDATE USING (true);
-- 3. Create helper function to verify manager PIN
CREATE OR REPLACE FUNCTION verify_manager_pin(p_pin TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_employee RECORD;
BEGIN -- Look for manager with matching PIN
SELECT id,
    name,
    business_id INTO v_employee
FROM employees
WHERE pin = p_pin
    AND role IN ('admin', 'manager', 'owner')
    AND is_active = true
LIMIT 1;
IF v_employee.id IS NOT NULL THEN RETURN jsonb_build_object(
    'valid',
    true,
    'manager_id',
    v_employee.id,
    'manager_name',
    v_employee.name
);
ELSE RETURN jsonb_build_object('valid', false);
END IF;
END;
$$;
-- 4. Create function to approve pending request
CREATE OR REPLACE FUNCTION approve_pending_request(p_approval_id UUID, p_manager_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_approval RECORD;
BEGIN
UPDATE pending_approvals
SET status = 'approved',
    manager_id = p_manager_id,
    resolved_at = NOW()
WHERE id = p_approval_id
    AND status = 'pending'
RETURNING * INTO v_approval;
IF v_approval.id IS NOT NULL THEN RETURN jsonb_build_object(
    'success',
    true,
    'approval',
    row_to_json(v_approval)
);
ELSE RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Approval not found or already resolved'
);
END IF;
END;
$$;
-- 5. Create function to reject pending request
CREATE OR REPLACE FUNCTION reject_pending_request(p_approval_id UUID, p_manager_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_approval RECORD;
BEGIN
UPDATE pending_approvals
SET status = 'rejected',
    manager_id = p_manager_id,
    resolved_at = NOW()
WHERE id = p_approval_id
    AND status = 'pending'
RETURNING * INTO v_approval;
IF v_approval.id IS NOT NULL THEN RETURN jsonb_build_object(
    'success',
    true,
    'approval',
    row_to_json(v_approval)
);
ELSE RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Approval not found or already resolved'
);
END IF;
END;
$$;
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_manager_pin(TEXT) TO anon,
    authenticated;
GRANT EXECUTE ON FUNCTION approve_pending_request(UUID, UUID) TO anon,
    authenticated;
GRANT EXECUTE ON FUNCTION reject_pending_request(UUID, UUID) TO anon,
    authenticated;