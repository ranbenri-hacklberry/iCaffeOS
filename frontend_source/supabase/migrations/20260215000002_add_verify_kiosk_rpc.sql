-- 🛡️ Security: Kiosk Device Verification System
-- Purpose: Allows kiosks to verify their hardware ID against the central registry.
-- 1. Create table for device registration if missing
CREATE TABLE IF NOT EXISTS public.kiosk_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    machine_id_hash TEXT NOT NULL UNIQUE,
    display_name TEXT,
    is_active BOOLEAN DEFAULT true,
    last_authorized_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.kiosk_devices ENABLE ROW LEVEL SECURITY;
-- 2. Create verification function
CREATE OR REPLACE FUNCTION verify_kiosk_device(p_machine_id_hash TEXT) RETURNS JSONB AS $$
DECLARE v_device_record RECORD;
v_business_record RECORD;
BEGIN -- 1. Find the device by hardware hash
SELECT * INTO v_device_record
FROM public.kiosk_devices
WHERE machine_id_hash = p_machine_id_hash
    AND is_active = true;
IF NOT FOUND THEN RETURN jsonb_build_object(
    'success',
    false,
    'reason',
    'UNREGISTERED_DEVICE'
);
END IF;
-- 2. Find associated business/owner
SELECT b.id,
    b.name,
    b.subscription_active INTO v_business_record
FROM public.businesses b
WHERE b.id = v_device_record.business_id;
IF NOT v_business_record.subscription_active THEN RETURN jsonb_build_object(
    'success',
    false,
    'reason',
    'SUBSCRIPTION_EXPIRED'
);
END IF;
-- 3. Return success with context
RETURN jsonb_build_object(
    'success',
    true,
    'user',
    jsonb_build_object(
        'id',
        v_device_record.id,
        'name',
        v_device_record.display_name,
        'business_id',
        v_business_record.id,
        'business_name',
        v_business_record.name,
        'role',
        'kiosk',
        'access_level',
        'kiosk'
    )
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;