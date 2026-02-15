-- 📊 Fix: get_device_uptime_stats type mismatch
-- COALESCE types time without time zone and interval cannot be matched
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
SELECT COALESCE(opening_tasks_start_time, '07:30:00'::TIME),
    COALESCE(
        (closing_tasks_start_time + INTERVAL '2 hours')::TIME,
        '17:00:00'::TIME
    ) INTO v_open_time,
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
        AND dhl.created_at > (NOW() - (p_days || ' days')::interval)
        AND dhl.created_at::time >= v_open_time
        AND dhl.created_at::time <= v_close_time
    GROUP BY dhl.device_id,
        dhl.device_type,
        dhl.created_at::date
),
expected_stats AS (
    SELECT EXTRACT(
            EPOCH
            FROM (v_close_time - v_open_time)
        ) / 60 as minutes_per_day
)
SELECT ds.device_id,
    ds.device_type,
    ROUND(
        (
            SUM(ds.minutes_active)::NUMERIC / NULLIF(p_days * es.minutes_per_day, 0)::NUMERIC
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