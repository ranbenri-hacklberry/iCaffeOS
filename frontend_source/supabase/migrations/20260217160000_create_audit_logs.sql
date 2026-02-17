DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'audit_action_type'
) THEN CREATE TYPE audit_action_type AS ENUM (
    'CAST_SPELL',
    'PRESTO_PROMOTE',
    'DISPEL',
    'PROMOTE_FILE',
    'PROMOTE_MIGRATION',
    'PROMOTE_DEXIE',
    'PROMOTE_RPC'
);
ELSE -- Add new values if type exists
ALTER TYPE audit_action_type
ADD VALUE IF NOT EXISTS 'CAST_SPELL';
ALTER TYPE audit_action_type
ADD VALUE IF NOT EXISTS 'PRESTO_PROMOTE';
ALTER TYPE audit_action_type
ADD VALUE IF NOT EXISTS 'DISPEL';
ALTER TYPE audit_action_type
ADD VALUE IF NOT EXISTS 'PROMOTE_FILE';
ALTER TYPE audit_action_type
ADD VALUE IF NOT EXISTS 'PROMOTE_MIGRATION';
ALTER TYPE audit_action_type
ADD VALUE IF NOT EXISTS 'PROMOTE_DEXIE';
ALTER TYPE audit_action_type
ADD VALUE IF NOT EXISTS 'PROMOTE_RPC';
END IF;
END $$;
CREATE TABLE IF NOT EXISTS sdk_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID NOT NULL,
    app_id TEXT NOT NULL,
    action_type audit_action_type NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    metadata JSONB,
    actor_id UUID NOT NULL,
    actor_role TEXT NOT NULL,
    business_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_correlation ON sdk_audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON sdk_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_business ON sdk_audit_logs(business_id);
-- RLS
ALTER TABLE sdk_audit_logs ENABLE ROW LEVEL SECURITY;
-- Only Admins can read audit logs
CREATE POLICY "Admins can view audit logs" ON sdk_audit_logs FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.employees
            WHERE auth_user_id = auth.uid()
                AND role IN ('admin', 'super_admin')
        )
    );
-- System insert policy
CREATE POLICY "System can insert logs" ON sdk_audit_logs FOR
INSERT TO authenticated WITH CHECK (true);