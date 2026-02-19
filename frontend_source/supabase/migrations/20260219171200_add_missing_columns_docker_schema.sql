-- ============================================================
-- Migration: Add missing columns to Docker local schema
-- Created: 2026-02-19
-- Purpose: Sync Cloud schema -> Docker local schema so that
--          Cloud→Docker sync doesn't fail with PGRST204 errors.
-- All statements use IF NOT EXISTS (idempotent / safe to re-run)
-- ============================================================
-- ────────────────────────────────────────────
-- TABLE: businesses
-- ────────────────────────────────────────────
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT DEFAULT NULL;
-- ────────────────────────────────────────────
-- TABLE: employees
-- ────────────────────────────────────────────
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT NULL;
-- ────────────────────────────────────────────
-- TABLE: customers
-- ────────────────────────────────────────────
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT NULL;
-- ────────────────────────────────────────────
-- TABLE: orders
-- ────────────────────────────────────────────
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS is_local_only BOOLEAN DEFAULT false;
-- ────────────────────────────────────────────
-- TABLE: order_items
-- ────────────────────────────────────────────
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT NULL;
-- ────────────────────────────────────────────
-- Confirm
-- ────────────────────────────────────────────
DO $$ BEGIN RAISE NOTICE '✅ Migration 20260219171200 complete - all missing columns added.';
END $$;