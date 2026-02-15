-- ============================================
-- LOCAL SUPABASE SCHEMA - Auto-generated
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sequences
CREATE SEQUENCE IF NOT EXISTS ingredients_id_seq;
CREATE SEQUENCE IF NOT EXISTS inventory_items_id_seq;
CREATE SEQUENCE IF NOT EXISTS inventory_logs_id_seq;
CREATE SEQUENCE IF NOT EXISTS menu_items_id_seq;
CREATE SEQUENCE IF NOT EXISTS recipe_ingredients_id_seq;
CREATE SEQUENCE IF NOT EXISTS recipes_id_seq;
CREATE SEQUENCE IF NOT EXISTS recurring_tasks_id_seq;
CREATE SEQUENCE IF NOT EXISTS supplier_order_items_id_seq;
CREATE SEQUENCE IF NOT EXISTS supplier_orders_id_seq;
CREATE SEQUENCE IF NOT EXISTS suppliers_id_seq;
CREATE SEQUENCE IF NOT EXISTS tasks_id_seq;
CREATE SEQUENCE IF NOT EXISTS master_categories_display_order_seq;

-- Core Business Tables
CREATE TABLE IF NOT EXISTS public.businesses (id uuid NOT NULL DEFAULT gen_random_uuid(), name text NOT NULL, created_at timestamp with time zone DEFAULT now(), settings jsonb DEFAULT '{}'::jsonb, last_active_at timestamp with time zone, opening_tasks_start_time time without time zone DEFAULT '07:30:00'::time without time zone, closing_tasks_start_time time without time zone DEFAULT '15:00:00'::time without time zone, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.employees (id uuid NOT NULL DEFAULT gen_random_uuid(), name text NOT NULL, nfc_id text, pin_code text, access_level text NOT NULL DEFAULT 'Worker'::text, created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), whatsapp_phone text, is_admin boolean NOT NULL DEFAULT false, email text, business_id uuid, phone text, auth_user_id uuid, is_super_admin boolean DEFAULT false, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.customers (id uuid NOT NULL DEFAULT gen_random_uuid(), phone_number text NOT NULL, name text, loyalty_coffee_count integer NOT NULL DEFAULT 0, created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), updated_at date, business_id uuid, PRIMARY KEY (id));

-- Menu & Options
CREATE TABLE IF NOT EXISTS public.menu_items (id integer NOT NULL DEFAULT nextval('menu_items_id_seq'::regclass), name text NOT NULL, price numeric NOT NULL, category text NOT NULL, image_url text, is_prep_required boolean NOT NULL DEFAULT true, kds_routing_logic text DEFAULT 'GRAB_AND_GO'::text, description text, is_in_stock boolean DEFAULT true, allow_notes boolean DEFAULT true, is_hot_drink boolean DEFAULT false, sale_price numeric, sale_start_date timestamp with time zone, sale_end_date timestamp with time zone, sale_start_time text, sale_end_time text, business_id uuid, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.optiongroups (id uuid NOT NULL DEFAULT uuid_generate_v4(), name text NOT NULL, display_order integer DEFAULT 0, is_required boolean DEFAULT false, is_multiple_select boolean DEFAULT false, is_food boolean DEFAULT true, is_drink boolean DEFAULT true, menu_item_id integer, business_id uuid, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.optionvalues (id uuid NOT NULL DEFAULT uuid_generate_v4(), group_id uuid, value_name text NOT NULL, price_adjustment numeric DEFAULT 0.00, display_order integer DEFAULT 0, is_default boolean DEFAULT false, inventory_item_id integer, quantity numeric DEFAULT 0, is_replacement boolean DEFAULT false, business_id uuid, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.menuitemoptions (item_id integer NOT NULL, group_id uuid NOT NULL, PRIMARY KEY (item_id, group_id));

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (id uuid NOT NULL DEFAULT gen_random_uuid(), order_number bigint, customer_phone text, customer_name text, order_status text NOT NULL DEFAULT 'new'::text, is_paid boolean NOT NULL DEFAULT false, customer_id uuid, created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), payment_method text, total_amount numeric, is_refund boolean DEFAULT false, refund_amount numeric DEFAULT 0, ready_at timestamp with time zone, completed_at timestamp with time zone, fired_at timestamp with time zone, paid_amount numeric DEFAULT 0, business_id uuid, updated_at timestamp with time zone DEFAULT now(), PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.order_items (id uuid NOT NULL DEFAULT gen_random_uuid(), order_id uuid, menu_item_id integer, quantity integer NOT NULL DEFAULT 1, mods jsonb, item_status text NOT NULL DEFAULT 'new'::text, created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), updated_at timestamp with time zone DEFAULT now(), price numeric DEFAULT 0, notes text, course_stage integer DEFAULT 1, item_fired_at timestamp with time zone, business_id uuid, is_early_delivered boolean DEFAULT false, PRIMARY KEY (id));

-- Inventory
CREATE TABLE IF NOT EXISTS public.inventory_items (id integer NOT NULL DEFAULT nextval('inventory_items_id_seq'::regclass), created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), name text NOT NULL, category text NOT NULL, unit text NOT NULL, current_stock numeric DEFAULT 0, cost_per_unit numeric DEFAULT 0, low_stock_alert numeric DEFAULT 5, supplier text, case_quantity integer DEFAULT 1, supplier_id bigint, business_id uuid, quantity_step numeric, catalog_item_id uuid, last_updated timestamp with time zone DEFAULT now(), weight_per_unit numeric, units_per_kg numeric, secondary_unit text, measurement_note text, multiplier_small numeric DEFAULT 0.7, multiplier_medium numeric DEFAULT 1.0, multiplier_large numeric DEFAULT 1.5, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.inventory_logs (id integer NOT NULL DEFAULT nextval('inventory_logs_id_seq'::regclass), inventory_item_id integer, count_timestamp timestamp with time zone DEFAULT now(), physical_count integer NOT NULL, system_estimate integer, adjustment_amount integer, employee_id integer, log_type text NOT NULL, notes text, created_at timestamp with time zone DEFAULT now(), business_id uuid, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.ingredients (id integer NOT NULL DEFAULT nextval('ingredients_id_seq'::regclass), name text NOT NULL, unit text NOT NULL, current_stock numeric DEFAULT 0, min_stock numeric DEFAULT 0, supplier_id integer, purchase_unit_quantity integer DEFAULT 1, purchase_unit_name text DEFAULT 'יחידה'::text, purchase_price numeric DEFAULT 0, unit_of_measure text DEFAULT 'יחידה'::text, reorder_point integer DEFAULT 0, PRIMARY KEY (id));

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (id integer NOT NULL DEFAULT nextval('suppliers_id_seq'::regclass), name text NOT NULL, contact_person text, phone_number text, email text, notes text, delivery_days text, business_id uuid, returns_empty_packs boolean DEFAULT false, charge_for_missing_packs boolean DEFAULT false, missing_pack_cost numeric DEFAULT 0, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.supplier_orders (id integer NOT NULL DEFAULT nextval('supplier_orders_id_seq'::regclass), supplier_id integer, order_date date NOT NULL DEFAULT CURRENT_DATE, expected_delivery_date date, order_status text NOT NULL DEFAULT 'PENDING'::text, created_by_employee_id integer, total_amount numeric, created_at timestamp with time zone DEFAULT now(), delivery_status text DEFAULT 'pending'::text, invoice_image_url text, confirmed_at timestamp with time zone, confirmed_by uuid, status text DEFAULT 'sent'::text, business_id uuid, delivered_at timestamp with time zone, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.supplier_order_items (id integer NOT NULL DEFAULT nextval('supplier_order_items_id_seq'::regclass), supplier_order_id integer, inventory_item_id integer, ordered_quantity_units integer NOT NULL, ordered_unit_name text, received_quantity_units integer, received_date timestamp with time zone, unit_price numeric, line_item_status text NOT NULL DEFAULT 'EXPECTED'::text, created_at timestamp with time zone DEFAULT now(), quantity numeric DEFAULT 1, business_id uuid, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.supplier_menu_item (supplier_id integer NOT NULL, menu_item_id integer NOT NULL, PRIMARY KEY (supplier_id, menu_item_id));

CREATE TABLE IF NOT EXISTS public.supplier_invoice_mapping (id uuid NOT NULL DEFAULT gen_random_uuid(), business_id uuid, supplier_id bigint, catalog_item_id uuid, invoice_item_name text NOT NULL, created_at timestamp with time zone DEFAULT now(), PRIMARY KEY (id));

-- Catalog
CREATE TABLE IF NOT EXISTS public.catalog_items (id uuid NOT NULL DEFAULT gen_random_uuid(), name text NOT NULL, default_unit text, category text, image_url text, created_at timestamp with time zone DEFAULT now(), unit text, case_quantity integer DEFAULT 1, quantity_step numeric DEFAULT 1, weight_per_unit numeric, units_per_kg numeric, secondary_unit text, avg_cost_price numeric DEFAULT 0, measurement_note text, multiplier_small numeric DEFAULT 0.7, multiplier_medium numeric DEFAULT 1.0, multiplier_large numeric DEFAULT 1.5, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.catalog_item_suppliers (catalog_item_id uuid NOT NULL, supplier_name text NOT NULL, occurrence_count integer DEFAULT 1, PRIMARY KEY (catalog_item_id, supplier_name));

-- Loyalty
CREATE TABLE IF NOT EXISTS public.loyalty_cards (id uuid NOT NULL DEFAULT gen_random_uuid(), customer_phone text NOT NULL, points_balance integer DEFAULT 0, total_free_coffees_redeemed integer DEFAULT 0, last_updated timestamp with time zone DEFAULT now(), created_at timestamp with time zone DEFAULT now(), free_coffees integer DEFAULT 0, total_coffees_purchased integer DEFAULT 0, business_id uuid, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (id uuid NOT NULL DEFAULT gen_random_uuid(), card_id uuid, order_id uuid, change_amount integer NOT NULL, transaction_type text NOT NULL, created_at timestamp with time zone DEFAULT now(), points_earned integer DEFAULT 0, points_redeemed integer DEFAULT 0, created_by uuid, business_id uuid, PRIMARY KEY (id));

-- Tasks & Recipes
CREATE TABLE IF NOT EXISTS public.tasks (id integer NOT NULL DEFAULT nextval('tasks_id_seq'::regclass), description text NOT NULL, category text, status text NOT NULL DEFAULT 'Pending'::text, due_date timestamp with time zone, created_at timestamp with time zone DEFAULT timezone('utc'::text, now()), menu_item_id integer, quantity integer DEFAULT 1, business_id uuid, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.recurring_tasks (id integer NOT NULL DEFAULT nextval('recurring_tasks_id_seq'::regclass), name text NOT NULL, description text, category text NOT NULL, frequency text NOT NULL DEFAULT 'Daily'::text, day_of_week integer, due_time time without time zone, is_active boolean DEFAULT true, recipe_id integer, menu_item_id integer, quantity integer DEFAULT 1, weekly_schedule jsonb DEFAULT '{}'::jsonb, logic_type text DEFAULT 'fixed'::text, image_url text, is_pre_closing boolean DEFAULT false, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.task_completions (id uuid NOT NULL DEFAULT gen_random_uuid(), recurring_task_id integer, business_id uuid, completed_at timestamp with time zone DEFAULT now(), completed_by uuid, completion_date date DEFAULT CURRENT_DATE, quantity_produced numeric, notes text, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.recipes (id integer NOT NULL DEFAULT nextval('recipes_id_seq'::regclass), menu_item_id integer, instructions text, preparation_quantity real NOT NULL, quantity_unit text, task_id integer, business_id uuid, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.recipe_ingredients (id integer NOT NULL DEFAULT nextval('recipe_ingredients_id_seq'::regclass), recipe_id integer NOT NULL, inventory_item_id integer NOT NULL, quantity_used numeric NOT NULL, unit_of_measure text NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), cost_per_unit numeric DEFAULT 0, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.prepbatches (id uuid NOT NULL DEFAULT uuid_generate_v4(), recipe_id uuid, batch_size numeric NOT NULL, unit_of_measure text NOT NULL, prep_status text NOT NULL DEFAULT 'ממתין'::text, prepared_by uuid, inventory_deducted boolean DEFAULT false, created_at timestamp with time zone DEFAULT timezone('utc'::text, now()), status text DEFAULT 'pending'::text, completed_at timestamp with time zone, business_id uuid, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.prepared_items_inventory (item_id integer NOT NULL, initial_stock real NOT NULL, current_stock real NOT NULL, unit text, last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()), PRIMARY KEY (item_id));

-- Master Tables
CREATE TABLE IF NOT EXISTS public.master_categories (id uuid NOT NULL DEFAULT gen_random_uuid(), name text NOT NULL, type text, course_type text, display_order integer NOT NULL DEFAULT nextval('master_categories_display_order_seq'::regclass), PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.master_ingredients (id uuid NOT NULL DEFAULT gen_random_uuid(), name text NOT NULL, default_unit text DEFAULT 'Kg'::text, department text, is_allergen boolean DEFAULT false, image_url text, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.master_option_groups (id uuid NOT NULL DEFAULT gen_random_uuid(), name text NOT NULL, is_food boolean DEFAULT true, is_drink boolean DEFAULT false, min_select integer DEFAULT 0, max_select integer DEFAULT 1, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.master_option_values (id uuid NOT NULL DEFAULT gen_random_uuid(), group_id uuid, value_name text NOT NULL, default_price_adjustment numeric DEFAULT 0, is_default boolean DEFAULT false, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.master_suppliers (id uuid NOT NULL DEFAULT gen_random_uuid(), name text NOT NULL, contact_phone text, departments text[], PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.master_supplier_catalog (id uuid NOT NULL DEFAULT gen_random_uuid(), supplier_id uuid, ingredient_id uuid, catalog_sku text, PRIMARY KEY (id));

-- Device & Time
CREATE TABLE IF NOT EXISTS public.device_sessions (id uuid NOT NULL DEFAULT gen_random_uuid(), business_id uuid, device_id text NOT NULL, device_type text NOT NULL, device_name text, user_name text, employee_id uuid, ip_address text, user_agent text, screen_resolution text, session_started_at timestamp with time zone DEFAULT now(), last_seen_at timestamp with time zone DEFAULT now(), created_at timestamp with time zone DEFAULT now(), PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.time_clock_events (id uuid NOT NULL DEFAULT gen_random_uuid(), employee_id uuid, event_type text NOT NULL, event_time timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), business_id uuid, PRIMARY KEY (id));

-- Music Tables
CREATE TABLE IF NOT EXISTS public.music_artists (id uuid NOT NULL DEFAULT uuid_generate_v4(), name text NOT NULL, image_url text, folder_path text, business_id uuid, created_at timestamp with time zone DEFAULT now(), PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.music_albums (id uuid NOT NULL DEFAULT uuid_generate_v4(), name text NOT NULL, artist_id uuid, cover_url text, folder_path text, release_year integer, business_id uuid, created_at timestamp with time zone DEFAULT now(), PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.music_songs (id uuid NOT NULL DEFAULT uuid_generate_v4(), title text NOT NULL, album_id uuid, artist_id uuid, track_number integer DEFAULT 0, duration_seconds integer DEFAULT 0, file_path text NOT NULL, file_name text, business_id uuid, created_at timestamp with time zone DEFAULT now(), PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.music_playlists (id uuid NOT NULL DEFAULT uuid_generate_v4(), name text NOT NULL, description text, cover_url text, is_auto_generated boolean DEFAULT false, filter_min_rating numeric DEFAULT 3.0, filter_artists uuid[], business_id uuid, created_by uuid, created_at timestamp with time zone DEFAULT now(), PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.music_playlist_songs (id uuid NOT NULL DEFAULT uuid_generate_v4(), playlist_id uuid NOT NULL, song_id uuid NOT NULL, position integer DEFAULT 0, added_at timestamp with time zone DEFAULT now(), PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.music_ratings (id uuid NOT NULL DEFAULT uuid_generate_v4(), song_id uuid NOT NULL, employee_id uuid NOT NULL, rating integer, skip_count integer DEFAULT 0, business_id uuid, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.music_playback_history (id uuid NOT NULL DEFAULT uuid_generate_v4(), song_id uuid NOT NULL, employee_id uuid, was_skipped boolean DEFAULT false, played_at timestamp with time zone DEFAULT now(), business_id uuid, PRIMARY KEY (id));

CREATE TABLE IF NOT EXISTS public.user_spotify_albums (user_id uuid NOT NULL, albums jsonb DEFAULT '[]'::jsonb, updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()), PRIMARY KEY (user_id));

-- Done!
SELECT 'Schema created successfully! ' || COUNT(*) || ' tables.' as result FROM information_schema.tables WHERE table_schema = 'public';

-- Discounts Table (Added 2025-12-23)
CREATE TABLE IF NOT EXISTS public.discounts (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED', 'FREE_ITEM')),
    value numeric DEFAULT 0,
    configuration jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    business_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Add discount columns to orders (if not exists logic handled by app or migration usually, but here for reference)
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_id uuid REFERENCES public.discounts(id);
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
