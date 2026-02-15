-- Add Automation Logs table for Maya AI
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id),
    action TEXT NOT NULL,
    target TEXT,
    details JSONB DEFAULT '{}',
    triggered_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime
ADD TABLE automation_logs;
-- Enable RLS
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
-- Allow employees to view logs for their business
CREATE POLICY "Employees can view own business automations" ON automation_logs FOR
SELECT USING (
        business_id IN (
            SELECT business_id
            FROM employees
            WHERE user_id = auth.uid()
        )
    );
-- Allow backend (service role) to insert logs
CREATE POLICY "Service role can insert logs" ON automation_logs FOR
INSERT WITH CHECK (true);