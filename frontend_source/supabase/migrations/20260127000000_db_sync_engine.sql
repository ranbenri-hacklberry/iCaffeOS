-- ========================================================
-- 🔄 SUPABASE REAL-TIME DB SYNC ENGINE (LOCAL -> REMOTE)
-- ========================================================
-- This script sets up automatic triggers to push local changes
-- to the remote Supabase instance in real-time.
-- 1. Setup Extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
-- 2. Sync Settings Table
CREATE TABLE IF NOT EXISTS public.sync_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Initialize settings (User should update these via UI or SQL)
-- These will be used by the triggers
INSERT INTO public.sync_settings (key, value)
VALUES (
        'remote_url',
        'https://gxzsxvbercpkgxraiaex.supabase.co'
    ),
    (
        'remote_service_key',
        'your_remote_service_key_here'
    ),
    ('is_sync_active', 'true') ON CONFLICT (key) DO NOTHING;
-- 3. Sync Queue (For logging and retry logic)
CREATE TABLE IF NOT EXISTS public.sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    -- INSERT, UPDATE, DELETE
    payload JSONB,
    status TEXT DEFAULT 'PENDING',
    -- PENDING, SENT, ERROR
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);
-- 4. The Magic Sync Function
CREATE OR REPLACE FUNCTION public.push_to_remote_worker() RETURNS TRIGGER AS $$
DECLARE v_remote_url TEXT;
v_remote_key TEXT;
v_is_active TEXT;
v_payload JSONB;
v_record_id TEXT;
v_http_resp_id BIGINT;
BEGIN -- Only run if sync is active
SELECT value INTO v_is_active
FROM public.sync_settings
WHERE key = 'is_sync_active';
IF v_is_active != 'true' THEN RETURN NEW;
END IF;
-- Get credentials
SELECT value INTO v_remote_url
FROM public.sync_settings
WHERE key = 'remote_url';
SELECT value INTO v_remote_key
FROM public.sync_settings
WHERE key = 'remote_service_key';
IF TG_OP = 'DELETE' THEN v_payload := jsonb_build_object('id', OLD.id);
v_record_id := OLD.id::text;
ELSE v_payload := to_jsonb(NEW);
v_record_id := NEW.id::text;
END IF;
-- Log to queue
INSERT INTO public.sync_queue (table_name, record_id, action, payload)
VALUES (TG_TABLE_NAME, v_record_id, TG_OP, v_payload);
-- Attempt Real-time Push via pg_net (REST API Upsert)
-- We use PostgRest UPSERT logic: POST with Prefer: resolution=merge-duplicates (or just simple POST for now)
IF TG_OP != 'DELETE' THEN
SELECT net.http_post(
        url := v_remote_url || '/rest/v1/' || TG_TABLE_NAME,
        headers := jsonb_build_object(
            'apikey',
            v_remote_key,
            'Authorization',
            'Bearer ' || v_remote_key,
            'Content-Type',
            'application/json',
            'Prefer',
            'resolution=merge-duplicates'
        ),
        body := v_payload
    ) INTO v_http_resp_id;
ELSE -- DELETE handling (requires different REST call)
SELECT net.http_delete(
        url := v_remote_url || '/rest/v1/' || TG_TABLE_NAME || '?id=eq.' || v_record_id,
        headers := jsonb_build_object(
            'apikey',
            v_remote_key,
            'Authorization',
            'Bearer ' || v_remote_key
        )
    ) INTO v_http_resp_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 5. Attach Triggers to Tables
-- Orders
DROP TRIGGER IF EXISTS tr_sync_orders ON public.orders;
CREATE TRIGGER tr_sync_orders
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.push_to_remote_worker();
-- Order Items
DROP TRIGGER IF EXISTS tr_sync_order_items ON public.order_items;
CREATE TRIGGER tr_sync_order_items
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.push_to_remote_worker();
-- Inventory
DROP TRIGGER IF EXISTS tr_sync_inventory ON public.inventory_items;
CREATE TRIGGER tr_sync_inventory
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.push_to_remote_worker();
-- Menu Items
DROP TRIGGER IF EXISTS tr_sync_menu_items ON public.menu_items;
CREATE TRIGGER tr_sync_menu_items
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.push_to_remote_worker();