-- Create N150 Telemetry table for hardware monitoring
CREATE TABLE IF NOT EXISTS n150_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    hostname TEXT,
    temp NUMERIC,
    cpu_load NUMERIC,
    ram_usage NUMERIC,
    docker_ok BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE n150_telemetry ENABLE ROW LEVEL SECURITY;
-- Allow all authenticated users to read telemetry (for managers)
CREATE POLICY "Allow authenticated users to read telemetry" ON n150_telemetry FOR
SELECT TO authenticated USING (true);
-- Allow system to insert telemetry
CREATE POLICY "Allow system to insert telemetry" ON n150_telemetry FOR
INSERT TO authenticated,
    anon WITH CHECK (true);
-- Index for performance
CREATE INDEX IF NOT EXISTS idx_telemetry_device_recorded ON n150_telemetry (device_id, recorded_at DESC);