-- Migration: Add kds_station and display_kds columns to public.menu_items
-- Created on: 2026-07-07

ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS kds_station text;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS display_kds text[];
