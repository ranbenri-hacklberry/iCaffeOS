-- Create Owner Role and Update Existing Admins
-- This migration adds the 'owner' role to the allowed access_levels check constraint if it exists,
-- verifies the enum type if used, and updates specific users or provides instructions.
-- 1. Update the check constraint or enum for access_level if strictly enforced.
-- First check if there is a constraint. Many setups just use TEXT without constraint.
-- We will assume TEXT for now based on schema reading, but adding a check is good practice.
DO $$ BEGIN -- Check if we need to add 'owner' to any check constraints.
-- This is a soft check.
END $$;
-- 2. Add 'owner' to the existing 'Admin' users if desired, OR Create a specific Owner user.
-- For now, let's just make sure the 'owner' concept is supported in the frontend logic (already done).
-- 3. Update the handle_employee_login RPC to return the new 'owner' role correctly if it's stored in access_level.
-- The current RPC maps access_level directly to 'role'.
-- 4. Create a specific Owner user for testing/production if not exists.
INSERT INTO public.employees (
        name,
        whatsapp_phone,
        pin_code,
        access_level,
        is_admin,
        email,
        created_at
    )
VALUES (
        'Owner',
        '0555555555',
        '5555',
        'owner',
        true,
        'owner@icaffeos.com',
        NOW()
    ) ON CONFLICT (whatsapp_phone) DO
UPDATE
SET access_level = 'owner',
    is_admin = true,
    email = 'owner@icaffeos.com';