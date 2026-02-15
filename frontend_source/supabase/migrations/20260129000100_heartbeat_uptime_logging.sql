-- 📊 Heartbeat & Uptime Monitoring System
-- Date: 2026-01-29
-- Description: Adds historical logging for heartbeats and functions to calculate uptime score within business hours.
-- 1. Create table for heartbeat logs (to track history)
CREATE TABLE IF NOT EXISTS public.device_heartbeat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_type TEXT,
    user_name TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.device_heartbeat_logs ENABLE ROW LEVEL SECURITY;
-- Policy: Authenticated users can read their own logs
CREATE POLICY "logs_view" ON public.device_heartbeat_logs FOR
SELECT TO authenticated USING (
        business_id IN (
            SELECT business_id
            FROM employees
            WHERE id = auth.uid()
        )
    );
-- Policy: Backend functions (or authenticated service role) can insert
CREATE POLICY "logs_insert" ON public.device_heartbeat_logs FOR
INSERT TO authenticated WITH CHECK (
        business_id IN (
            SELECT business_id
            FROM employees
            WHERE id = auth.uid()
        )
    );
-- Index for performance
CREATE INDEX IF NOT EXISTS idx_heartbeat_logs_business_time ON public.device_heartbeat_logs(business_id, created_at);
-- 2. Update send_device_heartbeat to also log the event
CREATE OR REPLACE FUNCTION send_device_heartbeat(
        p_business_id UUID,
        p_device_id TEXT,
        p_device_type TEXT DEFAULT 'kds',
        p_ip_address TEXT DEFAULT NULL,
        p_user_agent TEXT DEFAULT NULL,
        p_screen_resolution TEXT DEFAULT NULL,
        p_user_name TEXT DEFAULT NULL,
        p_employee_id UUID DEFAULT NULL
    ) RETURNS BOOLEAN AS $$ BEGIN -- Update/Insert current session state
INSERT INTO device_sessions (
        business_id,
        device_id,
        device_type,
        ip_address,
        user_agent,
        screen_resolution,
        user_name,
        employee_id,
        session_started_at,
        last_seen_at
    )
VALUES (
        p_business_id,
        p_device_id,
        p_device_type,
        p_ip_address,
        p_user_agent,
        p_screen_resolution,
        p_user_name,
        p_employee_id,
        NOW(),
        NOW()
    ) ON CONFLICT (device_id) DO
UPDATE
SET ip_address = COALESCE(EXCLUDED.ip_address, device_sessions.ip_address),
    user_agent = COALESCE(EXCLUDED.user_agent, device_sessions.user_agent),
    screen_resolution = COALESCE(
        EXCLUDED.screen_resolution,
        device_sessions.screen_resolution
    ),
    user_name = COALESCE(EXCLUDED.user_name, device_sessions.user_name),
    employee_id = COALESCE(
        EXCLUDED.employee_id,
        device_sessions.employee_id
    ),
    last_seen_at = NOW();
-- log historical event (limit logging to once per minute per device to save space)
IF NOT EXISTS (
    SELECT 1
    FROM device_heartbeat_logs
    WHERE device_id = p_device_id
        AND created_at > (NOW() - INTERVAL '40 seconds')
) THEN
INSERT INTO device_heartbeat_logs (
        business_id,
        device_id,
        device_type,
        user_name,
        ip_address
    )
VALUES (
        p_business_id,
        p_device_id,
        p_device_type,
        p_user_name,
        p_ip_address
    );
END IF;
-- Update business last_active_at
UPDATE businesses
SET last_active_at = NOW()
WHERE id = p_business_id;
RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Function to calculate uptime percentage
CREATE OR REPLACE FUNCTION get_device_uptime_stats(
        p_business_id UUID,
        p_days INTEGER DEFAULT 1
    ) RETURNS TABLE (
        device_id TEXT,
        device_type TEXT,
        uptime_percentage NUMERIC,
        total_active_hours NUMERIC,
        expected_hours NUMERIC
    ) AS $$
DECLARE v_open_time TIME;
v_close_time TIME;
BEGIN -- Get business hours from settings or defaults
SELECT COALESCE(opening_tasks_start_time, '07:30:00'::time),
    COALESCE(
        closing_tasks_start_time + INTERVAL '2 hours',
        '17:00:00'::interval
    )::time INTO v_open_time,
    v_close_time
FROM businesses
WHERE id = p_business_id;
RETURN QUERY WITH daily_stats AS (
    SELECT dhl.device_id,
        dhl.device_type,
        dhl.created_at::date as log_date,
        COUNT(DISTINCT date_trunc('minute', dhl.created_at)) as minutes_active
    FROM device_heartbeat_logs dhl
    WHERE dhl.business_id = p_business_id
        AND dhl.created_at > (NOW() - (p_days || ' days')::interval) -- Only count logs within business hours
        AND dhl.created_at::time >= v_open_time
        AND dhl.created_at::time <= v_close_time
    GROUP BY dhl.device_id,
        dhl.device_type,
        dhl.created_at::date
),
expected_stats AS (
    -- Calculate total expected operational minutes (p_days * operational_minutes_per_day)
    SELECT EXTRACT(
            EPOCH
            FROM (v_close_time - v_open_time)
        ) / 60 as minutes_per_day
)
SELECT ds.device_id,
    ds.device_type,
    ROUND(
        (
            SUM(ds.minutes_active)::NUMERIC / (p_days * es.minutes_per_day)::NUMERIC
        ) * 100,
        2
    ) as uptime_percentage,
    ROUND(SUM(ds.minutes_active)::NUMERIC / 60, 2) as total_active_hours,
    ROUND((p_days * es.minutes_per_day)::NUMERIC / 60, 2) as expected_hours
FROM daily_stats ds,
    expected_stats es
GROUP BY ds.device_id,
    ds.device_type,
    es.minutes_per_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;