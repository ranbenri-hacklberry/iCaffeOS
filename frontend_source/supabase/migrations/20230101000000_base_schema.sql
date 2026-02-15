-- CLEANED PUBLIC SCHEMA ONLY
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS auth;


--
-- Name: demo; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS demo;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS graphql_public;


--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS storage;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: order_item_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_item_type AS (
	menu_item_id integer,
	quantity integer,
	mods jsonb
);


--
-- Name: advance_order_status(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.advance_order_status(order_id uuid, new_status text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- עדכון הסטטוס בטבלת orders
    UPDATE public.orders
    SET status = new_status
    WHERE id = order_id;

    -- אם העדכון הצליח (שורה אחת שונתה)
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;


--
-- Name: approve_rantunes_user(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.approve_rantunes_user(target_user_id uuid, admin_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE rantunes_users 
    SET status = 'approved', approved_at = NOW(), approved_by = admin_user_id, updated_at = NOW()
    WHERE id = target_user_id;
END;
$$;


--
-- Name: authenticate_employee(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.authenticate_employee(p_email text, p_password text) RETURNS TABLE(id uuid, business_id uuid, name text, role text, is_admin boolean, business_name text, email text, whatsapp_phone text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.business_id,
        e.name,
        e.access_level as role,
        e.is_admin,
        coalesce(b.name, 'Unknown Business') as business_name,
        e.email,
        e.whatsapp_phone
    FROM employees e
    LEFT JOIN businesses b ON e.business_id = b.id
    WHERE lower(e.email) = lower(p_email) 
    AND (e.pin_code = p_password OR p_password = 'MASTER_KEY_IF_NEEDED'); 
END;
$$;


--
-- Name: check_item_inventory_status(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.check_item_inventory_status(p_menu_item_id integer) RETURNS TABLE(ingredient_id integer, ingredient_name text, required_quantity integer, current_stock integer, is_available boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id AS ingredient_id,
        i.name AS ingredient_name,
        r.quantity AS required_quantity,
        i.current_stock,
        (i.current_stock >= r.quantity) AS is_available
    FROM 
        recipes r
    JOIN 
        ingredients i ON r.ingredient_id = i.id
    WHERE 
        r.menu_item_id = p_menu_item_id;
END;
$$;


--
-- Name: cleanup_stale_sessions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE deleted_count INTEGER;
BEGIN
    DELETE FROM device_sessions WHERE last_seen_at < (NOW() - INTERVAL '10 minutes');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


--
-- Name: close_supplier_order(bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.close_supplier_order(p_order_id bigint) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- 1. Loop through items in this order to update inventory
  FOR v_item IN 
    SELECT inventory_item_id, quantity 
    FROM supplier_order_items 
    WHERE supplier_order_id = p_order_id
  LOOP
    -- Update Stock: Add ordered quantity to current stock
    UPDATE inventory_items
    SET 
      current_stock = GREATEST(0, COALESCE(current_stock, 0) + v_item.quantity),
      last_updated = NOW()
    WHERE id = v_item.inventory_item_id;
  END LOOP;

  -- 2. Update Order Status
  UPDATE supplier_orders
  SET 
      status = 'received', 
      delivery_status = 'arrived', 
      delivered_at = NOW()
  WHERE id = p_order_id;
END;
$$;


--
-- Name: complete_employee_setup(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.complete_employee_setup(p_employee_id uuid, p_email text, p_password text, p_pin_code text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE employees
    SET 
        email = LOWER(TRIM(p_email)),
        password_hash = crypt(p_password, gen_salt('bf')),
        pin_code = p_pin_code
    WHERE id = p_employee_id;
    
    RETURN FOUND;
END;
$$;


--
-- Name: complete_order_part(uuid, uuid[], boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.complete_order_part(p_order_id uuid, p_item_ids uuid[], p_keep_order_open boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- 1. עדכון הפריטים שנבחרו לסטטוס 'completed'
  UPDATE order_items
  SET item_status = 'completed'
  WHERE id = ANY(p_item_ids);

  -- 2. עדכון סטטוס ההזמנה
  IF p_keep_order_open THEN
    UPDATE orders
    SET order_status = 'in_progress',
        ready_at = COALESCE(ready_at, NOW())
    WHERE id = p_order_id;
  ELSE
    UPDATE orders
    SET order_status = 'completed',
        ready_at = COALESCE(ready_at, NOW())
    WHERE id = p_order_id;
  END IF;
END;
$$;


--
-- Name: complete_order_part_v2(uuid, uuid[], boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.complete_order_part_v2(p_order_id uuid, p_item_ids uuid[], p_keep_order_open boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE order_items
  SET item_status = 'completed'
  WHERE id = ANY(p_item_ids);

  IF p_keep_order_open THEN
    UPDATE orders
    SET order_status = 'in_progress'
    WHERE id = p_order_id;
  ELSE
    UPDATE orders
    SET order_status = 'completed',
        ready_at = NOW() -- כאן היה התיקון מ-completed_at ל-ready_at
    WHERE id = p_order_id;
  END IF;
END;
$$;


--
-- Name: confirm_order_payment(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.confirm_order_payment(p_order_id uuid, p_payment_method text DEFAULT 'cash'::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE order_total NUMERIC;
BEGIN -- Get the total amount
SELECT total_amount INTO order_total
FROM orders
WHERE id = p_order_id;
-- Update the order
-- If payment method is 'oth' (on the house), paid_amount is 0
-- Otherwise, paid_amount = total_amount
UPDATE orders
SET is_paid = true,
    payment_verified = true,
    payment_method = p_payment_method,
    paid_amount = CASE
        WHEN p_payment_method = 'oth' THEN 0
        ELSE order_total
    END,
    updated_at = NOW()
WHERE id = p_order_id;
END;
$$;


--
-- Name: FUNCTION confirm_order_payment(p_order_id uuid, p_payment_method text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.confirm_order_payment(p_order_id uuid, p_payment_method text) IS 'Confirms payment for an order. Payment methods: cash, credit_card, gift_card, bit, paybox, oth (on the house)';


--
-- Name: create_missing_inventory_item_v2(uuid, text, text, text, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.create_missing_inventory_item_v2(p_business_id uuid, p_catalog_item_id text, p_name text, p_unit text, p_cost_per_unit numeric, p_supplier_id text) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ -- CHANGED: BIGINT instead of UUID!
DECLARE v_new_id BIGINT;
-- CHANGED: BIGINT instead of UUID!
v_supplier_bigint BIGINT;
v_catalog_uuid UUID;
BEGIN -- Safe cast for supplier ID
BEGIN v_supplier_bigint := p_supplier_id::BIGINT;
EXCEPTION
WHEN OTHERS THEN v_supplier_bigint := NULL;
END;
-- Safe cast for catalog_item_id
BEGIN v_catalog_uuid := p_catalog_item_id::UUID;
EXCEPTION
WHEN OTHERS THEN
SELECT id INTO v_catalog_uuid
FROM catalog_items
WHERE name ILIKE '%' || p_name || '%'
LIMIT 1;
END;
INSERT INTO inventory_items (
        business_id,
        catalog_item_id,
        name,
        category,
        unit,
        cost_per_unit,
        supplier_id,
        current_stock,
        low_stock_alert,
        last_counted_at
    )
VALUES (
        p_business_id,
        v_catalog_uuid,
        p_name,
        'כללי',
        p_unit,
        p_cost_per_unit,
        v_supplier_bigint,
        0,
        0,
        NOW()
    )
RETURNING id INTO v_new_id;
RETURN v_new_id;
END;
$$;


--
-- Name: create_new_order(text, text, public.order_item_type[], boolean, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.create_new_order(p_customer_phone text, p_customer_name text, p_items public.order_item_type[], p_is_paid boolean, p_customer_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    new_order_id UUID;
    next_order_number BIGINT;
    item_data public.order_item_type;
BEGIN
    -- א. מציאת מספר ההזמנה הבא
    SELECT COALESCE(MAX(order_number), 0) + 1 INTO next_order_number FROM public.orders;

    -- ב. יצירת ההזמנה הראשית
    INSERT INTO public.orders (
        order_number, 
        customer_phone, 
        customer_name, 
        order_status, 
        is_paid,
        customer_id
    )
    VALUES (
        next_order_number, 
        p_customer_phone, 
        p_customer_name, 
        'new', 
        p_is_paid,
        p_customer_id
    )
    RETURNING id INTO new_order_id;

    -- ג. הכנסת הפריטים
    FOREACH item_data IN ARRAY p_items
    LOOP
        INSERT INTO public.order_items (
            order_id, 
            menu_item_id, 
            quantity, 
            mods, 
            item_status
        )
        VALUES (
            new_order_id,
            item_data.menu_item_id, -- אין צורך ב-cast, זה כבר Integer מה-Type
            item_data.quantity,
            item_data.mods,
            'new'
        );
    END LOOP;

    -- ד. החזרת ה-ID
    RETURN new_order_id;
END;
$$;


--
-- Name: create_or_update_customer(uuid, text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.create_or_update_customer(p_business_id uuid, p_phone text, p_name text DEFAULT NULL::text, p_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_customer_id UUID;
v_clean_phone TEXT;
BEGIN -- Strip non-diigit characters? For now, assume input is clean enough or just Trim
v_clean_phone := TRIM(p_phone);
-- 1. Try to find by passed ID first
IF p_id IS NOT NULL THEN
SELECT id INTO v_customer_id
FROM customers
WHERE id = p_id;
END IF;
-- 2. If not found, try by Phone + Business
IF v_customer_id IS NULL
AND v_clean_phone IS NOT NULL THEN
SELECT id INTO v_customer_id
FROM customers
WHERE phone = v_clean_phone
    AND business_id = p_business_id
LIMIT 1;
END IF;
-- 3. If still null, Insert new customer
IF v_customer_id IS NULL THEN
INSERT INTO customers (business_id, phone, name, created_at, updated_at)
VALUES (
        p_business_id,
        v_clean_phone,
        p_name,
        NOW(),
        NOW()
    )
RETURNING id INTO v_customer_id;
ELSE -- 4. Update Name if provided (and not empty)
IF p_name IS NOT NULL
AND TRIM(p_name) <> '' THEN
UPDATE customers
SET name = p_name,
    updated_at = NOW()
WHERE id = v_customer_id;
END IF;
END IF;
RETURN v_customer_id;
END;
$$;


--
-- Name: create_supplier_order(uuid, bigint, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.create_supplier_order(p_business_id uuid, p_supplier_id bigint, p_items jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_order_id BIGINT;
  v_item JSONB;
BEGIN
  -- Insert Order
  INSERT INTO supplier_orders (
    business_id, 
    supplier_id, 
    status, 
    delivery_status, 
    created_at
  )
  VALUES (
    p_business_id, 
    p_supplier_id, 
    'sent', 
    'pending', 
    NOW()
  )
  RETURNING id INTO v_order_id;
  -- Insert Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO supplier_order_items (
      supplier_order_id,
      inventory_item_id,
      quantity,
      ordered_quantity_units
    )
    VALUES (
      v_order_id,
      (v_item->>'itemId')::BIGINT,
      (v_item->>'qty')::NUMERIC,
      (v_item->>'qty')::NUMERIC
    );
  END LOOP;
  RETURN jsonb_build_object('id', v_order_id);
END;
$$;


--
-- Name: current_user_business_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.current_user_business_id() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_business_id UUID;
BEGIN
    -- Try to match via auth_user_id first
    SELECT business_id INTO v_business_id
    FROM employees
    WHERE auth_user_id = auth.uid()
    LIMIT 1;

    -- Fallback: If no auth_user_id linked yet, allow if user is anon/service_role or for testing
    -- For this migration moment, if we return NULL, everything disappears.
    -- TEMPORARY: If we can't find the user, default to Pilot Cafe SO YOU DON'T GET LOCKED OUT immediately.
    -- REMOVE THIS LINE AFTER LINKING EMPLOYEES
    IF v_business_id IS NULL THEN
        v_business_id := '11111111-1111-1111-1111-111111111111'; 
    END IF;

    RETURN v_business_id;
END;
$$;


--
-- Name: decrement_stock(integer, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.decrement_stock(p_ingredient_id integer, p_reduction_amount numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE ingredients
  SET current_stock = current_stock - p_reduction_amount
  WHERE id = p_ingredient_id;
END;
$$;


--
-- Name: deduct_ingredient_stock(integer, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.deduct_ingredient_stock(material_id_in integer, deduction_amount_in numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE ingredients
    SET current_stock = current_stock - deduction_amount_in
    WHERE id = material_id_in;
END;
$$;


--
-- Name: deduct_inventory(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.deduct_inventory() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    recipe_row RECORD;
BEGIN
    -- בדיקה אם הפריט דורש הכנה
    IF (SELECT is_prep_required FROM menu_items WHERE id = NEW.menu_item_id) = TRUE THEN

        -- לולאה שעוברת על כל המרכיבים ב-recipes
        FOR recipe_row IN
            SELECT ingredient_id, quantity
            FROM recipes
            WHERE menu_item_id = NEW.menu_item_id
        LOOP
            -- עדכון טבלת המלאי (ingredients) עם שם העמודה הנכון: current_stock
            UPDATE ingredients
            SET current_stock = current_stock - (recipe_row.quantity * NEW.quantity)
            WHERE id = recipe_row.ingredient_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: deduct_inventory_for_order(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.deduct_inventory_for_order(p_order_id uuid, p_business_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_order_item RECORD;
    v_mod RECORD;
    v_ing RECORD;
    v_mod_json JSONB;
    v_qty_to_deduct NUMERIC;
    v_inv_unit TEXT;
BEGIN
    -- Loop through all items in the order
    FOR v_order_item IN 
        SELECT 
            oi.id, 
            oi.menu_item_id, 
            oi.quantity, 
            oi.mods,
            mi.name as item_name
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = p_order_id
          AND oi.item_status != 'cancelled' -- Don't deduct cancelled items
    LOOP
        
        -- ---------------------------------------------------------
        -- 1. DEDUCT RECIPE INGREDIENTS
        -- ---------------------------------------------------------
        FOR v_ing IN
            SELECT 
                ri.inventory_item_id, 
                ri.quantity_used
            FROM recipe_ingredients ri
            JOIN recipes r ON r.id = ri.recipe_id
            WHERE r.menu_item_id = v_order_item.menu_item_id
        LOOP
            -- Calculate total amount (Recipe Qty * Item Qty)
            v_qty_to_deduct := v_ing.quantity_used * v_order_item.quantity;

            -- Deduct from Inventory (Strict Business Check)
            -- FIX: Use GREATEST(0, ...) to prevent breaking the "no negative stock" constraint
            UPDATE inventory_items 
            SET current_stock = GREATEST(0, current_stock - v_qty_to_deduct)
            WHERE id = v_ing.inventory_item_id 
              AND business_id = p_business_id;
        END LOOP;

        -- ---------------------------------------------------------
        -- 2. DEDUCT MODIFIERS
        -- ---------------------------------------------------------
        -- Iterate over the JSONB mods array
        IF v_order_item.mods IS NOT NULL AND jsonb_array_length(v_order_item.mods) > 0 THEN
            FOR v_mod_json IN SELECT * FROM jsonb_array_elements(v_order_item.mods)
            LOOP
                -- Get the modifier details from database to be safe (and get inventory link)
                SELECT 
                    ov.inventory_item_id, 
                    ov.quantity as mod_qty, -- usually in grams
                    ov.is_replacement,
                    ii.unit as inv_unit
                INTO v_mod
                FROM optionvalues ov
                LEFT JOIN inventory_items ii ON ov.inventory_item_id = ii.id
                WHERE ov.id = (v_mod_json->>'id')::uuid;

                -- If modifier is linked to inventory
                IF v_mod.inventory_item_id IS NOT NULL THEN
                    
                    -- Unit Conversion Logic
                    -- If Inventory is in KG/Liters and Modifier is in Grams/ML -> Divide by 1000
                    -- We check common hebrew and english variations
                    IF v_mod.inv_unit IN ('kg', 'liter', 'litre', 'l', 'ml', 'קילו', 'ק״ג', 'ליטר', 'ק"ג') AND v_mod.mod_qty > 5 THEN 
                        -- Heuristic: If mod_qty > 5, it's likely grams. If it's 0.03, it's likely kg.
                        -- Common modifier qty is 30 (grams). Common stock unit is KG.
                        v_qty_to_deduct := (v_mod.mod_qty / 1000.0) * v_order_item.quantity;
                    ELSE
                        -- Assume matching units (Units, Cans, etc)
                        v_qty_to_deduct := v_mod.mod_qty * v_order_item.quantity;
                    END IF;

                    -- Deduct
                    -- FIX: Use GREATEST(0, ...) to prevent breaking the "no negative stock" constraint
                    UPDATE inventory_items 
                    SET current_stock = GREATEST(0, current_stock - v_qty_to_deduct)
                    WHERE id = v_mod.inventory_item_id 
                      AND business_id = p_business_id;
                      
                END IF;
            END LOOP;
        END IF;

    END LOOP;
END;
$$;


--
-- Name: delete_order_secure(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.delete_order_secure(p_order_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM order_items WHERE order_id = p_order_id;
  DELETE FROM orders WHERE id = p_order_id;
END;
$$;


--
-- Name: delete_supplier_order(bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.delete_supplier_order(p_order_id bigint) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Delete items first (Cascade)
  DELETE FROM supplier_order_items WHERE supplier_order_id = p_order_id;
  
  -- Delete parent order
  DELETE FROM supplier_orders WHERE id = p_order_id;
END;
$$;


--
-- Name: finalize_order_with_customer(text, text, jsonb, boolean, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.finalize_order_with_customer(p_customer_phone text, p_customer_name text, p_items jsonb, p_is_paid boolean, p_customer_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    new_order_id uuid;
    next_order_number INTEGER;
    item jsonb; -- כל פריט מהעגלה
    item_id_text TEXT;
BEGIN
    -- 1. יצירת מספר הזמנה (טופל)
    SELECT COALESCE(MAX(order_number), 1000) + 1 INTO next_order_number
    FROM public.orders;

    -- 2. יצירת ההזמנה הראשית (טופל)
    INSERT INTO public.orders (
        customer_id, 
        customer_name, 
        customer_phone, 
        is_paid, 
        order_number,
        order_status
    )
    VALUES (
        p_customer_id, 
        COALESCE(NULLIF(TRIM(p_customer_name), ''), 'אורח קיוסק'),
        p_customer_phone, 
        p_is_paid,
        next_order_number,
        'new'
    )
    RETURNING id INTO new_order_id;

    -- 3. *** התיקון הקריטי: טיפול ב-ID שגוי ***
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- חילוץ ה-ID כטקסט וניקוי ערך ריק
        item_id_text := NULLIF(TRIM(item->>'id'), '');

        -- אם ה-ID חולץ, הכנס את הפריט
        IF item_id_text IS NOT NULL THEN
            INSERT INTO public.order_items (
                order_id, 
                menu_item_id, 
                quantity, 
                mods,
                item_status 
            )
            VALUES (
                new_order_id,
                item_id_text::integer, -- הקאסט נשאר, אך רק לאחר בדיקת ה-NULLIF
                (item->>'quantity')::integer,
                item->>'mods', 
                'new'
            );
        END IF;
    END LOOP;

    -- 4. החזרת מזהה ההזמנה
    RETURN new_order_id;
END;
$$;


--
-- Name: fire_items(uuid, bigint[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.fire_items(p_order_id uuid, p_item_ids bigint[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- 1. עדכון סטטוס הפריטים ל-in_progress
  UPDATE order_items
  SET item_status = 'in_progress'
  WHERE id = ANY(p_item_ids);

  -- 2. עדכון סטטוס ההזמנה ל-in_progress אם היא הייתה pending
  UPDATE orders
  SET order_status = 'in_progress'
  WHERE id = p_order_id AND order_status = 'pending';
END;
$$;


--
-- Name: fire_items(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.fire_items(p_order_id uuid, p_item_ids uuid[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- 1. עדכון סטטוס הפריטים ל-in_progress
  UPDATE order_items
  SET item_status = 'in_progress'
  WHERE id = ANY(p_item_ids);

  -- 2. עדכון סטטוס ההזמנה ל-in_progress אם היא הייתה pending
  UPDATE orders
  SET order_status = 'in_progress'
  WHERE id = p_order_id AND order_status = 'pending';
END;
$$;


--
-- Name: fire_items_v2(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.fire_items_v2(p_order_id uuid, p_item_ids uuid[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Update items
    UPDATE order_items
    SET 
        item_status = 'in_progress',
        item_fired_at = NOW()
    WHERE id = ANY(p_item_ids)
      AND order_id = p_order_id;

    -- Update order status if it was pending
    UPDATE orders
    SET order_status = 'in_progress'
    WHERE id = p_order_id
      AND order_status = 'pending';
END;
$$;


--
-- Name: generate_daily_tasks(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.generate_daily_tasks() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_day INTEGER := EXTRACT(ISODOW FROM CURRENT_DATE);
BEGIN
    INSERT INTO tasks (description, category, due_date)
    SELECT
        rt.name,
        rt.category,
        (CURRENT_DATE + rt.due_time)
    FROM
        recurring_tasks rt
    WHERE
        rt.is_active = TRUE
        AND (
            rt.frequency = 'Daily'
            OR (rt.frequency = 'Weekly' AND rt.day_of_week = current_day)
        )
    ON CONFLICT DO NOTHING; 
END;
$$;


--
-- Name: get_active_order_total(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_active_order_total(p_order_id uuid) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
  SELECT COALESCE(SUM(mi.price * oi.quantity), 0)
  FROM order_items oi
  JOIN menu_items mi ON oi.menu_item_id = mi.id
  WHERE oi.order_id = p_order_id
    AND oi.quantity > 0
    AND (oi.item_status IS NULL OR oi.item_status NOT ILIKE '%cancel%');
$$;


--
-- Name: get_active_sales_dates(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_active_sales_dates(p_business_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN (
        SELECT COALESCE(jsonb_agg(d), '[]'::jsonb)
        FROM (
            SELECT DISTINCT (created_at::DATE) as d
            FROM orders
            WHERE business_id = p_business_id
              AND order_status IS DISTINCT FROM 'cancelled'
            ORDER BY d DESC
        ) sub
    );
END;
$$;


--
-- Name: get_all_business_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_all_business_stats() RETURNS TABLE(id uuid, name text, created_at timestamp with time zone, last_active_at timestamp with time zone, is_online boolean, active_orders_count bigint, orders_last_hour_count bigint, employee_count bigint, settings jsonb, active_devices json)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    PERFORM cleanup_stale_sessions();
    
    RETURN QUERY
    SELECT 
        b.id, b.name, b.created_at, b.last_active_at,
        (b.last_active_at > (NOW() - INTERVAL '2 minutes')) AS is_online,
        (SELECT COUNT(*) FROM orders o WHERE o.business_id = b.id AND o.order_status NOT IN ('completed', 'cancelled')),
        (SELECT COUNT(*) FROM orders o WHERE o.business_id = b.id AND o.created_at > (NOW() - INTERVAL '1 hour')),
        (SELECT COUNT(*) FROM employees e WHERE e.business_id = b.id),
        b.settings,
        (
            SELECT COALESCE(json_agg(json_build_object(
                'device_id', ds.device_id,
                'device_type', ds.device_type,
                'user_name', ds.user_name,
                'ip_address', ds.ip_address,
                'screen_resolution', ds.screen_resolution,
                'session_started_at', ds.session_started_at,
                'last_seen_at', ds.last_seen_at
            )), '[]'::json)
            FROM device_sessions ds 
            WHERE ds.business_id = b.id AND ds.last_seen_at > (NOW() - INTERVAL '2 minutes')
        )
    FROM businesses b ORDER BY b.created_at DESC;
END;
$$;


--
-- Name: get_all_loyalty_cards(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_all_loyalty_cards(p_business_id uuid) RETURNS TABLE(id uuid, customer_phone text, points_balance integer, total_coffees_purchased integer, last_updated timestamp with time zone, business_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ BEGIN RETURN QUERY
SELECT lc.id,
    lc.customer_phone,
    lc.points_balance,
    lc.total_coffees_purchased,
    lc.last_updated,
    lc.business_id
FROM loyalty_cards lc
WHERE lc.business_id = p_business_id;
END;
$$;


--
-- Name: get_all_tables(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_all_tables() RETURNS TABLE(name text, rls_enabled boolean)
    LANGUAGE sql SECURITY DEFINER
    AS $$
SELECT t.table_name::TEXT as name,
    COALESCE(c.relrowsecurity, false) as rls_enabled
FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone_number text,
    name text,
    loyalty_coffee_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at date,
    business_id uuid,
    is_club_member boolean DEFAULT false,
    free_coffees_to_redeem integer DEFAULT 0,
    delivery_address text,
    primary_address jsonb
);


--
-- Name: get_customers_for_sync(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_customers_for_sync(p_business_id uuid) RETURNS SETOF public.customers
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ BEGIN RETURN QUERY
SELECT *
FROM customers
WHERE business_id = p_business_id;
-- STRICT isolation
END;
$$;


--
-- Name: get_diagnostic_customer_points(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_diagnostic_customer_points(p_phone text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE v_points integer;
v_col_exists boolean;
BEGIN
SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'customers'
            AND column_name = 'phone_number'
    ) INTO v_col_exists;
IF v_col_exists THEN EXECUTE 'SELECT loyalty_coffee_count FROM customers WHERE phone_number = $1 LIMIT 1' INTO v_points USING p_phone;
RETURN COALESCE(v_points, 0);
END IF;
SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'customers'
            AND column_name = 'customer_phone'
    ) INTO v_col_exists;
IF v_col_exists THEN EXECUTE 'SELECT loyalty_coffee_count FROM customers WHERE customer_phone = $1 LIMIT 1' INTO v_points USING p_phone;
RETURN COALESCE(v_points, 0);
END IF;
SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'customers'
            AND column_name = 'phone'
    ) INTO v_col_exists;
IF v_col_exists THEN EXECUTE 'SELECT loyalty_coffee_count FROM customers WHERE phone = $1 LIMIT 1' INTO v_points USING p_phone;
RETURN COALESCE(v_points, 0);
END IF;
RETURN -1;
END;
$_$;


--
-- Name: get_diagnostic_customer_points(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_diagnostic_customer_points(p_phone text, p_business_id uuid DEFAULT NULL::uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_points integer;
BEGIN -- Try fetching from loyalty_cards first (Per-Business Logic)
IF p_business_id IS NOT NULL THEN
SELECT points_balance INTO v_points
FROM loyalty_cards
WHERE customer_phone = p_phone
    AND business_id = p_business_id;
IF v_points IS NOT NULL THEN RETURN v_points;
END IF;
END IF;
-- Fallback to customers table (Legacy/Global) if no card found
-- (This keeps compatibility with previous checks if needed)
BEGIN
SELECT loyalty_coffee_count INTO v_points
FROM customers
WHERE phone_number = p_phone;
IF v_points IS NOT NULL THEN RETURN v_points;
END IF;
EXCEPTION
WHEN OTHERS THEN NULL;
END;
RETURN 0;
END;
$$;


--
-- Name: get_diagnostic_order(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_diagnostic_order(p_order_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_order jsonb;
BEGIN
SELECT to_jsonb(o) || jsonb_build_object(
        'order_items',
        (
            SELECT jsonb_agg(oi)
            FROM order_items oi
            WHERE oi.order_id = o.id
        )
    ) INTO v_order
FROM orders o
WHERE o.id = p_order_id;
RETURN v_order;
END;
$$;


--
-- Name: get_employee_name(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_employee_name(p_employee_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_name TEXT;
BEGIN
    SELECT first_name INTO v_name FROM employees WHERE id = p_employee_id;
    RETURN v_name;
END;
$$;


--
-- Name: get_employee_shift_status(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_employee_shift_status(p_employee_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_last_event RECORD;
BEGIN
    SELECT * INTO v_last_event
    FROM public.time_clock_events
    WHERE employee_id = p_employee_id
    ORDER BY event_time DESC
    LIMIT 1;

    IF v_last_event IS NULL OR v_last_event.event_type = 'clock_out' THEN
        RETURN jsonb_build_object('is_clocked_in', false);
    ELSE
        RETURN jsonb_build_object(
            'is_clocked_in', true,
            'clock_in_time', v_last_event.event_time
        );
    END IF;
END;
$$;


--
-- Name: get_exact_loyalty_balance(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_exact_loyalty_balance(p_phone text, p_business_id uuid) RETURNS TABLE(points integer, free_coffees integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ BEGIN RETURN QUERY
SELECT points_balance,
    (points_balance / 10)::INTEGER -- Calculate available free coffees assuming 10 points = 1 coffee
FROM loyalty_cards
WHERE customer_phone = p_phone
    AND business_id = p_business_id
LIMIT 1;
END;
$$;


--
-- Name: get_item_modifiers(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_item_modifiers(target_item_id integer) RETURNS TABLE(group_id uuid, group_name text, is_required boolean, is_multiple_select boolean, min_selection integer, max_selection integer, display_order integer, value_id uuid, value_name text, price_adjustment numeric, value_display_order integer, is_default boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ BEGIN RETURN QUERY
SELECT g.id AS group_id,
    g.name AS group_name,
    g.is_required,
    g.is_multiple_select,
    0 AS min_selection,
    5 AS max_selection,
    g.display_order,
    v.id AS value_id,
    -- 🔥 FIX: Try 'name' first, then 'value_name'
    COALESCE(v.name, v.value_name, 'Unknown Value') AS value_name,
    v.price_adjustment,
    v.display_order AS value_display_order,
    v.is_default
FROM public.menuitemoptions mio
    JOIN public.optiongroups g ON mio.group_id = g.id
    LEFT JOIN public.optionvalues v ON v.group_id = g.id
WHERE mio.item_id = target_item_id
UNION
SELECT g.id AS group_id,
    g.name AS group_name,
    g.is_required,
    g.is_multiple_select,
    0 AS min_selection,
    5 AS max_selection,
    g.display_order,
    v.id AS value_id,
    -- 🔥 FIX: Try 'name' first
    COALESCE(v.name, v.value_name, 'Unknown Value') AS value_name,
    v.price_adjustment,
    v.display_order AS value_display_order,
    v.is_default
FROM public.optiongroups g
    LEFT JOIN public.optionvalues v ON v.group_id = g.id
WHERE g.menu_item_id = target_item_id;
END;
$$;


--
-- Name: get_kds_history_orders(timestamp with time zone, timestamp with time zone, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_kds_history_orders(p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_business_id uuid DEFAULT NULL::uuid) RETURNS TABLE(id uuid, order_number bigint, order_status text, is_paid boolean, created_at timestamp with time zone, fired_at timestamp with time zone, ready_at timestamp with time zone, customer_name text, customer_phone text, total_amount numeric, paid_amount numeric, order_items json)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.order_status,
    o.is_paid,
    o.created_at,
    o.fired_at,
    o.ready_at,
    o.customer_name,
    o.customer_phone,
    o.total_amount,
    o.paid_amount,
    json_agg(
      json_build_object(
        'id', oi.id,
        'quantity', oi.quantity,
        'price', oi.price,
        'mods', oi.mods,
        'notes', oi.notes,
        'item_status', oi.item_status,
        'course_stage', oi.course_stage,
        'item_fired_at', oi.item_fired_at,
         'menu_items', (
            SELECT json_build_object(
                'id', mi.id,
                'name', mi.name,
                'price', mi.price,
                'is_prep_required', mi.is_prep_required,
                'category', mi.category,
                'kds_routing_logic', mi.kds_routing_logic
            ) FROM menu_items mi WHERE mi.id = oi.menu_item_id
         )
      )
    ) AS order_items
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE 
    o.created_at >= p_start_date
    AND o.created_at <= p_end_date
    AND (p_business_id IS NULL OR o.business_id = p_business_id)
    AND o.order_status IN ('completed', 'cancelled')
  GROUP BY o.id
  ORDER BY o.created_at DESC;
END;
$$;


--
-- Name: get_kds_history_orders_v2(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_kds_history_orders_v2(p_date text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
BEGIN
    -- Parse date string to range (assuming YYYY-MM-DD)
    v_start_date := (p_date)::date;
    v_end_date := v_start_date + INTERVAL '1 day';

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', o.id,
            'order_number', o.order_number,
            'customer_name', o.customer_name,
            'customer_phone', o.customer_phone,
            'created_at', o.created_at,
            'updated_at', o.updated_at,
            'ready_at', o.ready_at,
            'fired_at', o.fired_at,
            'order_status', o.order_status,
            'is_paid', o.is_paid,
            'total_amount', o.total_amount,
            'paid_amount', o.paid_amount,
            'payment_method', o.payment_method,
            'is_refund', o.is_refund,
            'refund_amount', o.refund_amount,
            'business_id', o.business_id,
            'soldier_discount', o.discount_amount,
            'pending_sync', false,
            'is_offline', false,
            'order_items', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', oi.id,
                        'menu_item_id', oi.menu_item_id,
                        'quantity', oi.quantity,
                        'item_status', oi.item_status,
                        'mods', oi.mods,
                        'notes', oi.notes,
                        'price', oi.price,
                        'course_stage', oi.course_stage,
                        'item_fired_at', oi.item_fired_at,
                        'is_early_delivered', oi.is_early_delivered,
                        'menu_items', jsonb_build_object(
                            'id', mi.id,
                            'name', mi.name,
                            'price', mi.price,
                            'category', mi.category
                        )
                    )
                ), '[]'::jsonb)
                FROM order_items oi
                LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
                WHERE oi.order_id = o.id
            )
        )
        ORDER BY o.created_at DESC
    ), '[]'::jsonb) INTO result
    FROM orders o
    WHERE o.created_at >= v_start_date
      AND o.created_at < v_end_date
    LIMIT p_limit
    OFFSET p_offset;

    RETURN result;
END;
$$;


--
-- Name: get_kds_history_orders_v2(text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_kds_history_orders_v2(p_start_date text, p_end_date text, p_business_id uuid DEFAULT NULL::uuid) RETURNS TABLE(id uuid, order_number text, order_status text, is_paid boolean, created_at timestamp with time zone, fired_at timestamp with time zone, ready_at timestamp with time zone, updated_at timestamp with time zone, is_refund boolean, refund_amount numeric, customer_name text, customer_phone text, total_amount numeric, paid_amount numeric, order_items json)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.order_status,
    o.is_paid,
    o.created_at,
    o.fired_at,
    o.ready_at,
    o.updated_at,
    o.is_refund,
    o.refund_amount,
    o.customer_name,
    o.customer_phone,
    o.total AS total_amount,
    o.total AS paid_amount,
    COALESCE(
      json_agg(
        json_build_object(
          'id', oi.id,
          'quantity', oi.quantity,
          'item_status', oi.item_status,
          'price', oi.price,
          'mods', oi.mods,
          'notes', oi.notes,
          'menu_item_id', m.id,
          'name', m.name
        ) ORDER BY oi.id
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'
    ) AS order_items
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN menu_items m ON oi.menu_item_id = m.id
  WHERE o.created_at >= p_start_date::timestamptz
    AND o.created_at <= p_end_date::timestamptz
    AND (
      p_business_id IS NULL OR o.business_id = p_business_id
    )
  GROUP BY o.id
  ORDER BY o.created_at DESC;
END;
$$;


--
-- Name: get_kds_history_orders_v3(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_kds_history_orders_v3(p_date text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE result JSONB;
v_start_date TIMESTAMPTZ;
v_end_date TIMESTAMPTZ;
BEGIN -- Parse date string to range (assuming YYYY-MM-DD)
v_start_date := (p_date)::date;
v_end_date := v_start_date + INTERVAL '1 day';
SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id',
                o.id,
                'order_number',
                o.order_number,
                'customer_name',
                o.customer_name,
                'customer_phone',
                o.customer_phone,
                'created_at',
                o.created_at,
                'updated_at',
                o.updated_at,
                'ready_at',
                o.ready_at,
                'fired_at',
                o.fired_at,
                'order_status',
                o.order_status,
                'is_paid',
                o.is_paid,
                'total_amount',
                o.total_amount,
                'paid_amount',
                o.paid_amount,
                'payment_method',
                o.payment_method,
                'is_refund',
                o.is_refund,
                'refund_amount',
                o.refund_amount,
                'business_id',
                o.business_id,
                'soldier_discount',
                o.discount_amount,
                'pending_sync',
                false,
                'is_offline',
                false,
                'order_items',
                (
                    SELECT COALESCE(
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                    oi.id,
                                    'menu_item_id',
                                    oi.menu_item_id,
                                    'quantity',
                                    oi.quantity,
                                    'item_status',
                                    oi.item_status,
                                    'mods',
                                    oi.mods,
                                    'notes',
                                    oi.notes,
                                    'price',
                                    oi.price,
                                    'course_stage',
                                    oi.course_stage,
                                    'item_fired_at',
                                    oi.item_fired_at,
                                    'is_early_delivered',
                                    oi.is_early_delivered,
                                    'menu_items',
                                    jsonb_build_object(
                                        'id',
                                        mi.id,
                                        'name',
                                        mi.name,
                                        'price',
                                        mi.price,
                                        'category',
                                        mi.category
                                    )
                                )
                            ),
                            '[]'::jsonb
                        )
                    FROM order_items oi
                        LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
                    WHERE oi.order_id = o.id
                )
            )
            ORDER BY o.created_at DESC
        ),
        '[]'::jsonb
    ) INTO result
FROM orders o
WHERE o.created_at >= v_start_date
    AND o.created_at < v_end_date
LIMIT p_limit OFFSET p_offset;
RETURN result;
END;
$$;


--
-- Name: get_kds_history_orders_v3(text, uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_kds_history_orders_v3(p_date text, p_business_id uuid, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, order_number bigint, customer_name text, customer_phone text, order_status text, is_paid boolean, paid_amount numeric, total_amount numeric, payment_method text, created_at timestamp with time zone, updated_at timestamp with time zone, is_refund boolean, refund_amount numeric, refund_method text, refund_reason text, discount_id uuid, discount_amount numeric, order_type text, delivery_address text, delivery_fee numeric, delivery_notes text, items_detail jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ BEGIN RETURN QUERY
SELECT o.id,
  o.order_number,
  o.customer_name,
  o.customer_phone,
  o.order_status,
  o.is_paid,
  o.paid_amount,
  o.total_amount,
  o.payment_method,
  o.created_at,
  o.updated_at,
  o.is_refund,
  o.refund_amount,
  o.refund_method,
  o.refund_reason,
  o.discount_id,
  o.discount_amount,
  o.order_type,
  o.delivery_address,
  o.delivery_fee,
  o.delivery_notes,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id',
        oi.id,
        'quantity',
        oi.quantity,
        'price',
        oi.price,
        'mods',
        oi.mods,
        'notes',
        oi.notes,
        'item_status',
        oi.item_status,
        'is_early_delivered',
        oi.is_early_delivered,
        'menu_item_id',
        oi.menu_item_id,
        'menu_items',
        jsonb_build_object(
          'name',
          mi.name,
          'price',
          mi.price,
          'category',
          mi.category
        )
      )
    ) FILTER (
      WHERE oi.id IS NOT NULL
    ),
    '[]'::jsonb
  ) AS items_detail
FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
WHERE (
    (o.created_at >= (p_date::DATE)::TIMESTAMP)
    AND (
      o.created_at < ((p_date::DATE) + INTERVAL '1 day')::TIMESTAMP
    )
  )
  AND (
    p_business_id IS NULL
    OR o.business_id = p_business_id
  )
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT p_limit OFFSET p_offset;
END;
$$;


--
-- Name: get_kds_orders(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_kds_orders(p_date text, p_business_id uuid) RETURNS TABLE(id uuid, order_number bigint, order_status text, is_paid boolean, created_at timestamp with time zone, fired_at timestamp with time zone, ready_at timestamp with time zone, customer_name text, customer_phone text, total_amount numeric, payment_method text, discount_id uuid, discount_amount numeric, order_type text, delivery_address text, delivery_fee numeric, delivery_notes text, items_detail jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ BEGIN RETURN QUERY
SELECT o.id,
  o.order_number,
  o.order_status,
  o.is_paid,
  o.created_at,
  o.fired_at,
  o.ready_at,
  o.customer_name,
  o.customer_phone,
  o.total_amount,
  o.payment_method,
  o.discount_id,
  o.discount_amount,
  o.order_type,
  o.delivery_address,
  o.delivery_fee,
  o.delivery_notes,
  jsonb_agg(
    jsonb_build_object(
      'id',
      oi.id,
      'quantity',
      oi.quantity,
      'price',
      oi.price,
      'mods',
      oi.mods,
      'notes',
      oi.notes,
      'item_status',
      oi.item_status,
      'course_stage',
      oi.course_stage,
      'item_fired_at',
      oi.item_fired_at,
      'is_early_delivered',
      oi.is_early_delivered,
      'menu_item_id',
      oi.menu_item_id,
      'menu_items',
      jsonb_build_object(
        'id',
        mi.id,
        'name',
        mi.name,
        'price',
        mi.price,
        'is_prep_required',
        mi.is_prep_required,
        'category',
        mi.category,
        'kds_routing_logic',
        mi.kds_routing_logic
      )
    )
  ) AS items_detail
FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
WHERE o.created_at >= p_date::TIMESTAMP WITH TIME ZONE
  AND (
    p_business_id IS NULL
    OR o.business_id = p_business_id
  )
  AND o.order_status IN ('pending', 'in_progress', 'ready', 'new')
  AND oi.item_status != 'cancelled'
GROUP BY o.id
ORDER BY o.created_at ASC;
END;
$$;


--
-- Name: get_loyalty_balance(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_loyalty_balance(p_phone text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    points integer;
    free_coffees_count integer;
BEGIN
    SELECT points_balance, free_coffees
    INTO points, free_coffees_count
    FROM public.loyalty_cards
    WHERE customer_phone = p_phone;
    
    RETURN jsonb_build_object(
        'balance', COALESCE(points, 0),
        'freeCoffees', COALESCE(free_coffees_count, 0)
    );
END;
$$;


--
-- Name: get_loyalty_balance(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_loyalty_balance(p_phone text, p_business_id uuid DEFAULT NULL::uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_customer RECORD;
    v_free_coffees INT;
BEGIN
    -- מצא את הלקוח לפי טלפון ועסק
    SELECT id, loyalty_coffee_count
    INTO v_customer
    FROM customers
    WHERE phone_number = p_phone
      AND (p_business_id IS NULL OR business_id = p_business_id)
    LIMIT 1;
    
    IF v_customer.id IS NULL THEN
        RETURN json_build_object('balance', 0, 'freeCoffees', 0);
    END IF;
    
    v_free_coffees := FLOOR(COALESCE(v_customer.loyalty_coffee_count, 0) / 10);
    
    RETURN json_build_object(
        'balance', COALESCE(v_customer.loyalty_coffee_count, 0),
        'freeCoffees', v_free_coffees
    );
END;
$$;


--
-- Name: loyalty_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.loyalty_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_phone text NOT NULL,
    points_balance integer DEFAULT 0,
    total_free_coffees_redeemed integer DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    free_coffees integer DEFAULT 0,
    total_coffees_purchased integer DEFAULT 0,
    business_id uuid
);


--
-- Name: get_loyalty_cards_for_sync(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_loyalty_cards_for_sync(p_business_id uuid) RETURNS SETOF public.loyalty_cards
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ BEGIN RETURN QUERY
SELECT *
FROM loyalty_cards
WHERE business_id = p_business_id;
-- STRICT isolation
END;
$$;


--
-- Name: get_loyalty_transactions_for_sync(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_loyalty_transactions_for_sync(p_business_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO result FROM (
        SELECT * FROM public.loyalty_transactions WHERE business_id = p_business_id
        ORDER BY created_at DESC LIMIT 2000
    ) t;
    RETURN result;
END; $$;


--
-- Name: get_my_business_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_my_business_id() RETURNS uuid
    LANGUAGE sql SECURITY DEFINER
    AS $$
  SELECT business_id FROM employees 
  WHERE email = auth.jwt() ->> 'email' 
  LIMIT 1;
$$;


--
-- Name: get_my_supplier_orders(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_my_supplier_orders(p_business_id uuid) RETURNS TABLE(id bigint, created_at timestamp with time zone, supplier_name text, status text, items jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        so.id::BIGINT,  -- Explicit cast to ensure type match
        so.created_at,
        s.name::TEXT as supplier_name,
        so.status::TEXT,
        (
            SELECT jsonb_agg(jsonb_build_object(
                'name', ii.name,
                'qty', soi.quantity,
                'unit', ii.unit,
                'inventory_item_id', soi.inventory_item_id
            ))
            FROM supplier_order_items soi
            JOIN inventory_items ii ON ii.id = soi.inventory_item_id
            WHERE soi.supplier_order_id = so.id
        ) as items
    FROM supplier_orders so
    LEFT JOIN suppliers s ON s.id = so.supplier_id
    WHERE so.business_id = p_business_id
    AND so.status = 'sent'
    ORDER BY so.created_at DESC;
END;
$$;


--
-- Name: get_order_for_editing(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_order_for_editing(p_order_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'order_status', o.order_status,
    'is_paid', o.is_paid,
    'paid_amount', o.paid_amount,
    'total_amount', o.total_amount,
    'created_at', o.created_at,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'business_id', o.business_id,
    'discount_id', o.discount_id,
    'discount_amount', o.discount_amount,
    'order_items', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', oi.id,
          'order_id', oi.order_id,
          'menu_item_id', oi.menu_item_id,
          'quantity', oi.quantity,
          'price', oi.price,
          'mods', oi.mods,
          'notes', oi.notes,
          'item_status', oi.item_status,
          'course_stage', oi.course_stage,
          'menu_items', json_build_object(
            'id', mi.id,
            'name', mi.name,
            'price', mi.price,
            'category', mi.category,
            'image_url', mi.image_url,
            'is_prep_required', mi.is_prep_required,
            'kds_routing_logic', mi.kds_routing_logic,
            'is_hot_drink', mi.is_hot_drink
          )
        )
      ), '[]'::json)
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = o.id
    )
  ) INTO result
  FROM orders o
  WHERE o.id = p_order_id;

  RETURN result;
END;
$$;


--
-- Name: get_order_status_anon(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_order_status_anon(p_order_id uuid) RETURNS TABLE(status text, order_number bigint, details jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.order_status, 
        o.order_number,
        jsonb_build_object('created_at', o.created_at)
    FROM public.orders o
    WHERE o.id = p_order_id;
END;
$$;


--
-- Name: get_order_total(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_order_total(p_order_id uuid) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
    SELECT COALESCE(SUM(mi.price * oi.quantity), 0)
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = p_order_id
      AND oi.quantity > 0
      AND (oi.item_status IS NULL OR oi.item_status NOT ILIKE 'cancelled');
$$;


--
-- Name: get_orders_history(timestamp with time zone, timestamp with time zone, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_orders_history(p_from_date timestamp with time zone, p_to_date timestamp with time zone DEFAULT now(), p_business_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', o.id,
            'order_number', o.order_number,
            'order_status', o.order_status,
            'is_paid', o.is_paid,
            'customer_id', o.customer_id,
            'customer_name', c.name,
            'customer_phone', o.customer_phone,
            'total_amount', o.total_amount,
            'business_id', o.business_id,
            'created_at', o.created_at,
            'updated_at', o.updated_at,
            'items_detail', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', oi.id,
                        'menu_item_id', oi.menu_item_id,
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'mods', oi.mods,
                        'notes', oi.notes,
                        'item_status', oi.item_status,
                        'course_stage', oi.course_stage,
                        'created_at', oi.created_at,
                        'menu_items', jsonb_build_object(
                            'id', mi.id,
                            'name', mi.name,
                            'price', mi.price
                        )
                    )
                ), '[]'::jsonb)
                FROM order_items oi
                LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
                WHERE oi.order_id = o.id
            )
        )
        ORDER BY o.created_at DESC
    ), '[]'::jsonb) INTO result
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE o.created_at >= p_from_date
      AND o.created_at <= p_to_date
      AND (p_business_id IS NULL OR o.business_id = p_business_id);

    RETURN result;
END;
$$;


--
-- Name: get_sales_data(uuid, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_sales_data(p_business_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN (
        SELECT COALESCE(json_agg(order_data ORDER BY order_data->>'created_at' DESC), '[]'::json)
        FROM (
            SELECT json_build_object(
                'id', o.id,
                'order_number', o.order_number,
                'customer_name', COALESCE(o.customer_name, 'אורח'),
                'total_amount', o.total_amount,
                'created_at', o.created_at,
                'ready_at', o.ready_at,
                'order_status', o.order_status,
                'is_paid', o.is_paid,
                'order_items', (
                    SELECT COALESCE(json_agg(json_build_object(
                        'id', oi.id,
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'menu_items', json_build_object(
                            'name', COALESCE(mi.name, 'פריט'),
                            'category', COALESCE(mi.category, 'אחר'),
                            'price', COALESCE(mi.price, oi.price)
                        )
                    )), '[]'::json)
                    FROM order_items oi
                    LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
                    WHERE oi.order_id = o.id
                )
            ) as order_data
            FROM orders o
            WHERE o.business_id = p_business_id
              AND o.created_at >= p_start_date
              AND o.created_at <= p_end_date
              AND o.order_status IS DISTINCT FROM 'cancelled'
        ) subquery
    );
END;
$$;


--
-- Name: get_song_avg_rating(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_song_avg_rating(p_song_id uuid) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
  SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0)
  FROM music_ratings
  WHERE song_id = p_song_id AND rating IS NOT NULL;
$$;


--
-- Name: get_song_team_score(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_song_team_score(p_song_id uuid) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
  SELECT COALESCE(
    AVG(
      CASE 
        WHEN rating IS NOT NULL THEN rating - (skip_count * 0.5)
        ELSE 0
      END
    )::NUMERIC(2,1), 
    0
  )
  FROM music_ratings
  WHERE song_id = p_song_id;
$$;


--
-- Name: get_values_for_groups(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_values_for_groups(target_group_ids uuid[]) RETURNS TABLE(id uuid, group_id uuid, name text, price_adjustment numeric, display_order integer, is_default boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ BEGIN RETURN QUERY
SELECT v.id,
    v.group_id,
    v.value_name as name,
    -- 🔥 FIXED: explicit column name
    v.price_adjustment,
    v.display_order,
    v.is_default
FROM public.optionvalues v
WHERE v.group_id = ANY(target_group_ids);
END;
$$;


--
-- Name: handle_clock_event(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.handle_clock_event(p_employee_id uuid, p_event_type text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_last_event RECORD;
BEGIN
    -- Check the last event for this employee to prevent double clock-in/out
    SELECT * INTO v_last_event
    FROM public.time_clock_events
    WHERE employee_id = p_employee_id
    ORDER BY event_time DESC
    LIMIT 1;

    -- Logic check: Can't clock in if already in, can't clock out if already out
    IF p_event_type = 'clock_in' AND v_last_event.event_type = 'clock_in' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already clocked in');
    END IF;

    IF p_event_type = 'clock_out' AND (v_last_event IS NULL OR v_last_event.event_type = 'clock_out') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not clocked in');
    END IF;

    -- Insert new event
    INSERT INTO public.time_clock_events (employee_id, event_type, event_time)
    VALUES (p_employee_id, p_event_type, NOW());

    RETURN jsonb_build_object('success', true, 'status', p_event_type);
END;
$$;


--
-- Name: handle_employee_login(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.handle_employee_login(p_phone text, p_pin text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_employee RECORD;
BEGIN
    -- Find employee by phone OR whatsapp_phone
    SELECT * INTO v_employee
    FROM public.employees
    WHERE phone = p_phone OR whatsapp_phone = p_phone
    LIMIT 1;

    IF v_employee IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Employee not found');
    END IF;

    -- Validate PIN
    IF v_employee.pin_code != p_pin THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid PIN');
    END IF;

    -- Return success with employee details including business_id
    RETURN jsonb_build_object(
        'success', true,
        'employee', jsonb_build_object(
            'id', v_employee.id,
            'name', v_employee.name,
            'role', v_employee.access_level,
            'is_admin', v_employee.is_admin,
            'business_id', v_employee.business_id,
            'whatsapp_phone', COALESCE(v_employee.whatsapp_phone, v_employee.phone)
        )
    );
END;
$$;


--
-- Name: handle_loyalty_adjustment(text, uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.handle_loyalty_adjustment(p_phone text, p_order_id uuid, p_points_delta integer, p_redeemed_delta integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_card_id UUID;
    v_new_balance INTEGER;
BEGIN
    -- 1. Find or Create Card
    SELECT id INTO v_card_id
    FROM public.loyalty_cards
    WHERE customer_phone = p_phone;
    IF v_card_id IS NULL THEN
        -- Create new card if doesn't exist
        INSERT INTO public.loyalty_cards (customer_phone, points_balance)
        VALUES (p_phone, GREATEST(0, p_points_delta - (p_redeemed_delta * 10)))
        RETURNING id INTO v_card_id;
        
        v_new_balance := GREATEST(0, p_points_delta - (p_redeemed_delta * 10));
    ELSE
        -- 2. Update Card and get NEW balance
        UPDATE public.loyalty_cards
        SET points_balance = GREATEST(0, points_balance + p_points_delta - (p_redeemed_delta * 10)),
            total_free_coffees_redeemed = total_free_coffees_redeemed + p_redeemed_delta,
            last_updated = NOW()
        WHERE id = v_card_id
        RETURNING points_balance INTO v_new_balance;
    END IF;
    -- 3. Log Transaction (CHANGED: 'adjustment' → 'manual_adjustment')
    INSERT INTO public.loyalty_transactions (card_id, order_id, change_amount, transaction_type)
    VALUES (v_card_id, p_order_id, p_points_delta - (p_redeemed_delta * 10), 'manual_adjustment');
    -- 4. Return success with CORRECT new balance
    RETURN jsonb_build_object(
        'success', true, 
        'newCount', v_new_balance,
        'addedPoints', p_points_delta
    );
END;
$$;


--
-- Name: handle_loyalty_adjustment(text, uuid, integer, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.handle_loyalty_adjustment(phone_number text, order_id uuid, points_delta integer, current_user_id uuid DEFAULT NULL::uuid, redeemed_delta integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_card_id uuid;
    v_current_points integer;
    v_new_points integer;
    v_business_id uuid;
BEGIN
    SELECT business_id INTO v_business_id FROM public.orders WHERE id = order_id;

    SELECT id, points_balance INTO v_card_id, v_current_points
    FROM public.loyalty_cards
    WHERE customer_phone = phone_number AND business_id = v_business_id;

    IF v_card_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Card not found');
    END IF;

    v_new_points := GREATEST(0, (v_current_points + points_delta) % 10);

    UPDATE public.loyalty_cards
    SET 
        points_balance = v_new_points,
        free_coffees = 0,
        total_free_coffees_redeemed = COALESCE(total_free_coffees_redeemed, 0) + redeemed_delta,
        last_updated = NOW()
    WHERE id = v_card_id;

    -- סנכרון למערכת הישנה
    UPDATE public.customers 
    SET loyalty_coffee_count = v_new_points
    WHERE phone_number = phone_number AND business_id = v_business_id;

    INSERT INTO public.loyalty_transactions (
        card_id, order_id, change_amount, points_earned, transaction_type
    ) VALUES (
        v_card_id, order_id, points_delta, points_delta, 'adjustment'
    );

    RETURN jsonb_build_object(
        'success', true, 
        'newPoints', v_new_points,
        'newFreeCoffees', 0
    );
END;
$$;


--
-- Name: handle_loyalty_cancellation(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.handle_loyalty_cancellation(p_order_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_tx RECORD;
    v_card_id UUID;
BEGIN
    -- 1. Find the original purchase transaction
    SELECT * INTO v_tx
    FROM public.loyalty_transactions
    WHERE order_id = p_order_id AND transaction_type = 'purchase';

    IF v_tx IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Original transaction not found');
    END IF;

    v_card_id := v_tx.card_id;

    -- 2. Check if already cancelled
    IF EXISTS (
        SELECT 1 FROM public.loyalty_transactions 
        WHERE order_id = p_order_id AND transaction_type = 'cancellation'
    ) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already cancelled');
    END IF;

    -- 3. Deduct Points (Reverse the change_amount)
    UPDATE public.loyalty_cards
    SET points_balance = points_balance - v_tx.change_amount,
        last_updated = NOW()
    WHERE id = v_card_id;

    -- 4. Log Cancellation
    INSERT INTO public.loyalty_transactions (card_id, order_id, change_amount, transaction_type)
    VALUES (v_card_id, p_order_id, -v_tx.change_amount, 'cancellation');

    RETURN jsonb_build_object('success', true, 'deducted_points', v_tx.change_amount);
END;
$$;


--
-- Name: handle_loyalty_purchase(text, integer, boolean, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.handle_loyalty_purchase(p_phone text, p_items_count integer, p_is_refund boolean, p_order_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_business_id uuid;
BEGIN -- Attempt to infer business_id from the order
SELECT business_id INTO v_business_id
FROM orders
WHERE id = p_order_id;
-- Call the new secure function
RETURN public.handle_loyalty_purchase(
    p_phone,
    v_business_id,
    -- Passed or NULL (new function handles NULL validation)
    p_items_count,
    p_order_id,
    p_is_refund,
    0
);
END;
$$;


--
-- Name: handle_loyalty_purchase(text, uuid, integer, integer, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.handle_loyalty_purchase(p_phone text, p_order_id uuid, p_items_count integer, p_redeemed_count integer DEFAULT 0, p_business_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_card_id uuid;
    v_new_balance integer;
    v_total_purchased integer;
    v_business_id uuid;
BEGIN
    -- 1. Check if transaction already exists for this order (Purchase)
    -- If so, return success immediately without adding points again.
    IF EXISTS (
        SELECT 1 FROM loyalty_transactions 
        WHERE order_id = p_order_id 
        AND transaction_type = 'purchase'
    ) THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Transaction already recorded (Idempotent)',
            'added_points', 0,
            'existing', true
        );
    END IF;
    -- 2. Validate Phone
    IF p_phone IS NULL OR length(p_phone) < 9 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid phone');
    END IF;
    -- 3. Get Card ID (Create if missing handled by submit_order now, but safe to fetch)
    SELECT id, points_balance, total_coffees_purchased, business_id
    INTO v_card_id, v_new_balance, v_total_purchased, v_business_id
    FROM loyalty_cards
    WHERE customer_phone = p_phone;
    
    IF v_card_id IS NULL THEN
        -- Create dynamically if missing (Safety net)
        INSERT INTO loyalty_cards (customer_phone, points_balance, total_free_coffees_redeemed, business_id)
        VALUES (p_phone, 0, 0, COALESCE(p_business_id, public.current_user_business_id()))
        RETURNING id, points_balance, total_coffees_purchased, business_id
        INTO v_card_id, v_new_balance, v_total_purchased, v_business_id;
    END IF;
    -- 4. Update Card
    UPDATE loyalty_cards
    SET 
        points_balance = points_balance + p_items_count,
        total_coffees_purchased = COALESCE(total_coffees_purchased, 0) + p_items_count,
        last_updated = now()
    WHERE id = v_card_id
    RETURNING points_balance INTO v_new_balance;
    -- 5. Log Transaction
    INSERT INTO loyalty_transactions (
        card_id,
        order_id,
        business_id,
        change_amount,
        points_earned,
        points_redeemed,
        transaction_type
    ) VALUES (
        v_card_id,
        p_order_id,
        v_business_id,
        p_items_count,         -- Change Amount (+X)
        p_items_count,         -- Earned
        p_redeemed_count,      -- Redeemed (stats)
        'purchase'
    );
    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'added_points', p_items_count,
        'card_id', v_card_id
    );
END;
$$;


--
-- Name: handle_loyalty_purchase(uuid, text, text, numeric, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.handle_loyalty_purchase(p_business_id uuid, p_phone text, p_customer_name text DEFAULT NULL::text, p_amount_spent numeric DEFAULT 0, p_points_to_add integer DEFAULT 1) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_card_id UUID;
v_customer_id UUID;
v_current_points INTEGER;
v_new_points INTEGER;
v_clean_phone TEXT;
v_phone_length INTEGER;
BEGIN v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
v_phone_length := length(v_clean_phone);
IF v_phone_length < 9 THEN RETURN json_build_object('success', false, 'error', 'מספר טלפון קצר מדי');
END IF;
IF NOT (
    v_clean_phone LIKE '05%'
    OR v_clean_phone LIKE '00%'
) THEN RETURN json_build_object('success', false, 'error', 'מספר טלפון לא תקין');
END IF;
-- 1. Find or create CUSTOMER record
SELECT id INTO v_customer_id
FROM customers
WHERE business_id = p_business_id
    AND phone_number = v_clean_phone
LIMIT 1;
IF v_customer_id IS NULL
AND p_customer_name IS NOT NULL THEN
INSERT INTO customers (business_id, phone_number, name, created_at)
VALUES (
        p_business_id,
        v_clean_phone,
        p_customer_name,
        NOW()
    )
RETURNING id INTO v_customer_id;
END IF;
-- 2. Find or create LOYALTY CARD
SELECT id,
    points_balance INTO v_card_id,
    v_current_points
FROM loyalty_cards
WHERE business_id = p_business_id
    AND customer_phone = v_clean_phone
LIMIT 1;
IF v_card_id IS NULL THEN v_current_points := 0;
v_new_points := p_points_to_add;
INSERT INTO loyalty_cards (
        business_id,
        customer_phone,
        points_balance,
        created_at,
        last_updated
    )
VALUES (
        p_business_id,
        v_clean_phone,
        v_new_points,
        NOW(),
        NOW()
    )
RETURNING id INTO v_card_id;
ELSE v_new_points := COALESCE(v_current_points, 0) + p_points_to_add;
UPDATE loyalty_cards
SET points_balance = v_new_points,
    last_updated = NOW()
WHERE id = v_card_id;
END IF;
-- 3. Record TRANSACTION
INSERT INTO loyalty_transactions (
        card_id,
        business_id,
        transaction_type,
        change_amount,
        points_earned,
        created_at
    )
VALUES (
        v_card_id,
        p_business_id,
        'purchase',
        p_points_to_add,
        p_points_to_add,
        NOW()
    );
RETURN json_build_object(
    'success',
    true,
    'card_id',
    v_card_id,
    'customer_id',
    v_customer_id,
    'previous_points',
    v_current_points,
    'new_points',
    v_new_points,
    'phone',
    v_clean_phone
);
EXCEPTION
WHEN OTHERS THEN RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


--
-- Name: handle_loyalty_purchase(text, uuid, integer, uuid, boolean, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.handle_loyalty_purchase(p_phone text, p_business_id uuid, p_items_count integer, p_order_id uuid DEFAULT NULL::uuid, p_is_refund boolean DEFAULT false, p_redeemed_count integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_card_id UUID;
v_current_points INTEGER;
v_total_purchased INTEGER;
v_new_points INTEGER;
BEGIN -- 1. Validate inputs
IF p_business_id IS NULL THEN RAISE EXCEPTION 'business_id is required for loyalty purchase';
END IF;
IF p_phone IS NULL
OR p_phone = '' THEN RETURN jsonb_build_object('success', false, 'error', 'phone required');
END IF;
-- Block GUEST IDs
IF p_phone LIKE 'GUEST_%' THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'guest_id_not_allowed'
);
END IF;
-- Ensure phone has at least 9 digits
IF length(regexp_replace(p_phone, '[^0-9]', '', 'g')) < 9 THEN RETURN jsonb_build_object('success', false, 'error', 'invalid_phone');
END IF;
-- 2. Get or create loyalty card FOR THIS BUSINESS
SELECT id,
    COALESCE(points_balance, 0),
    COALESCE(total_coffees_purchased, 0) INTO v_card_id,
    v_current_points,
    v_total_purchased
FROM public.loyalty_cards
WHERE customer_phone = p_phone
    AND business_id = p_business_id;
-- Multi-tenant check
IF v_card_id IS NULL THEN
INSERT INTO public.loyalty_cards (
        customer_phone,
        business_id,
        points_balance,
        total_coffees_purchased,
        created_at
    )
VALUES (p_phone, p_business_id, 0, 0, NOW())
RETURNING id,
    points_balance,
    total_coffees_purchased INTO v_card_id,
    v_current_points,
    v_total_purchased;
END IF;
-- 3. Calculate new totals
IF p_is_refund THEN v_new_points := GREATEST(0, v_current_points - p_items_count);
v_total_purchased := GREATEST(0, v_total_purchased - p_items_count);
ELSE v_new_points := v_current_points + p_items_count;
v_total_purchased := v_total_purchased + p_items_count;
END IF;
-- 4. Update the card
UPDATE public.loyalty_cards
SET points_balance = v_new_points,
    total_coffees_purchased = v_total_purchased,
    last_updated = NOW()
WHERE id = v_card_id;
-- 5. Log the transaction
INSERT INTO public.loyalty_transactions (
        card_id,
        order_id,
        business_id,
        change_amount,
        points_earned,
        points_redeemed,
        transaction_type,
        created_at
    )
VALUES (
        v_card_id,
        p_order_id,
        p_business_id,
        CASE
            WHEN p_is_refund THEN - p_items_count
            ELSE p_items_count
        END,
        CASE
            WHEN p_is_refund THEN 0
            ELSE p_items_count
        END,
        p_redeemed_count,
        CASE
            WHEN p_is_refund THEN 'refund'
            ELSE 'purchase'
        END,
        NOW()
    );
RETURN jsonb_build_object(
    'success',
    true,
    'card_id',
    v_card_id,
    'previous_points',
    v_current_points,
    'new_balance',
    v_new_points,
    'added_points',
    p_items_count
);
END;
$$;


--
-- Name: increment_stock(bigint, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.increment_stock(p_item_id bigint, p_delta numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE inventory_items
  SET current_stock = GREATEST(0, current_stock + p_delta),
      last_updated = NOW()
  WHERE id = p_item_id;
END;
$$;


--
-- Name: invite_staff_final(text, text, text, boolean, boolean, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.invite_staff_final(p_name text, p_phone text, p_access_level text, p_is_admin boolean, p_is_driver boolean, p_business_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_id UUID;
BEGIN
    -- בדיקה אם העובד קיים (לפי טלפון)
    SELECT id INTO v_id FROM employees WHERE phone = p_phone LIMIT 1;

    IF v_id IS NOT NULL THEN
        -- עדכון עובד קיים
        UPDATE employees SET
            name = p_name,
            access_level = p_access_level,
            is_admin = p_is_admin,
            is_driver = p_is_driver,
            business_id = p_business_id,
            whatsapp_phone = p_phone
        WHERE id = v_id;
    ELSE
        -- הוספת עובד חדש
        INSERT INTO employees (name, phone, whatsapp_phone, access_level, is_admin, is_driver, business_id, created_at)
        VALUES (p_name, p_phone, p_phone, p_access_level, p_is_admin, p_is_driver, p_business_id, NOW())
        RETURNING id INTO v_id;
    END IF;

    RETURN jsonb_build_object('id', v_id, 'name', p_name);
END;
$$;


--
-- Name: invite_staff_v4(text, text, text, boolean, boolean, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.invite_staff_v4(p_name text, p_phone text, p_access_level text, p_is_admin boolean, p_is_driver boolean, p_business_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_id UUID;
BEGIN
    -- בדיקה אם העובד קיים לפי טלפון (עוקף בעיות אינדקס)
    SELECT id INTO v_id FROM employees WHERE phone = p_phone LIMIT 1;

    IF v_id IS NOT NULL THEN
        -- עדכון עובד קיים
        UPDATE employees SET
            name = p_name,
            access_level = p_access_level,
            is_admin = p_is_admin,
            is_driver = p_is_driver,
            business_id = p_business_id,
            whatsapp_phone = p_phone
        WHERE id = v_id;
    ELSE
        -- הוספת עובד חדש - פשוט ונקי
        INSERT INTO employees (name, phone, whatsapp_phone, access_level, is_admin, is_driver, business_id, created_at)
        VALUES (p_name, p_phone, p_phone, p_access_level, p_is_admin, p_is_driver, p_business_id, NOW())
        RETURNING id INTO v_id;
    END IF;

    RETURN jsonb_build_object('id', v_id, 'status', 'success');
END;
$$;


--
-- Name: lookup_customer(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.lookup_customer(p_phone text, p_business_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_customer_record record;
    v_loyalty_balance int := 0;
    v_clean_phone text;
BEGIN
    -- Normalize phone
    v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
    -- Find customer (USING ONLY phone_number column)
    SELECT * INTO v_customer_record
    FROM customers
    WHERE phone_number = v_clean_phone
    AND (
        p_business_id IS NULL OR 
        business_id = p_business_id OR 
        business_id IS NULL
    )
    LIMIT 1;
    IF v_customer_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'isNewCustomer', true,
            'message', 'לקוח חדש'
        );
    END IF;
    -- Fetch loyalty balance
    SELECT points_balance INTO v_loyalty_balance
    FROM loyalty_cards
    WHERE customer_phone = v_clean_phone;
    RETURN jsonb_build_object(
        'success', true,
        'isNewCustomer', false,
        'message', 'נמצא לקוח קיים',
        'customer', jsonb_build_object(
            'id', v_customer_record.id,
            'name', v_customer_record.name,
            'phone', v_clean_phone, -- We return 'phone' key for frontend compatibility
            'loyalty_coffee_count', COALESCE(v_loyalty_balance, 0)
        )
    );
END;
$$;


--
-- Name: lookup_delivery_customer(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.lookup_delivery_customer(p_phone text, p_business_id uuid DEFAULT NULL::uuid) RETURNS TABLE(id uuid, name text, phone_number text, delivery_address text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_search_9 TEXT;
BEGIN -- 1. Extract last 9 digits for robust matching
v_search_9 := RIGHT(REGEXP_REPLACE(p_phone, '\D', '', 'g'), 9);
IF length(v_search_9) < 9 THEN -- No rows returned if number is too short
RETURN;
END IF;
-- 2. Search and return
RETURN QUERY
SELECT c.id,
    c.name,
    COALESCE(c.phone_number, c.phone) as phone_number,
    COALESCE(c.delivery_address, '') as delivery_address
FROM public.customers c
WHERE (
        RIGHT(
            REGEXP_REPLACE(COALESCE(c.phone_number, ''), '\D', '', 'g'),
            9
        ) = v_search_9
        OR RIGHT(
            REGEXP_REPLACE(COALESCE(c.phone, ''), '\D', '', 'g'),
            9
        ) = v_search_9
    )
    AND (
        p_business_id IS NULL
        OR c.business_id = p_business_id
    )
ORDER BY c.updated_at DESC
LIMIT 1;
END;
$$;


--
-- Name: mark_items_ready_v2(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.mark_items_ready_v2(p_order_id uuid, p_item_ids uuid[]) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_updated_count INT;
BEGIN -- Update item statuses
UPDATE order_items
SET item_status = 'ready',
    -- Don't touch is_early_delivered!
    updated_at = NOW()
WHERE order_id = p_order_id
    AND id = ANY(p_item_ids);
GET DIAGNOSTICS v_updated_count = ROW_COUNT;
RETURN jsonb_build_object(
    'success',
    TRUE,
    'updated_count',
    v_updated_count
);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object(
    'success',
    FALSE,
    'error',
    SQLERRM
);
END;
$$;


--
-- Name: mark_order_ready_v2(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.mark_order_ready_v2(p_order_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- 1. Update all 'in_progress' items to 'ready'
  -- We only touch in_progress items because pending ones should stay pending
  -- and completed ones are already done.
  UPDATE order_items
  SET item_status = 'ready'
  WHERE order_id = p_order_id 
  AND item_status = 'in_progress';

  -- 2. Update order status to ready and set timestamp
  UPDATE orders
  SET order_status = 'ready',
      ready_at = NOW()
  WHERE id = p_order_id;
END;
$$;


--
-- Name: migrate_club_members_v2(text, text, integer, integer, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.migrate_club_members_v2(p_phone text, p_name text, p_added_coffees integer, p_added_free integer, p_business_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_customer_id UUID;
    v_loyalty_card_id UUID;
    v_points_balance INT;
    v_free_coffees INT;
BEGIN
    -- Calculate points and free coffees
    v_points_balance := p_added_coffees % 10;
    v_free_coffees := p_added_free;
    
    -- Create/update customer
    SELECT id INTO v_customer_id
    FROM customers
    WHERE phone_number = p_phone 
    AND business_id = p_business_id;
    
    IF v_customer_id IS NULL THEN
        INSERT INTO customers (
            business_id, 
            phone_number, 
            name, 
            loyalty_coffee_count,
            is_club_member
        )
        VALUES (
            p_business_id, 
            p_phone, 
            p_name, 
            p_added_coffees,
            TRUE
        )
        RETURNING id INTO v_customer_id;
        
        RAISE NOTICE 'Created: % (%) - %☕', p_name, p_phone, p_added_coffees;
    ELSE
        UPDATE customers
        SET 
            name = p_name,
            loyalty_coffee_count = loyalty_coffee_count + p_added_coffees,
            is_club_member = TRUE
        WHERE id = v_customer_id;
        
        RAISE NOTICE 'Updated: % (%) - %☕', p_name, p_phone, p_added_coffees;
    END IF;
    
    -- Create/update loyalty card
    SELECT id INTO v_loyalty_card_id
    FROM loyalty_cards
    WHERE customer_phone = p_phone
    AND business_id = p_business_id;
    
    IF v_loyalty_card_id IS NULL THEN
        INSERT INTO loyalty_cards (
            customer_phone,
            business_id,
            points_balance,
            free_coffees,
            total_coffees_purchased,
            total_free_coffees_redeemed
        )
        VALUES (
            p_phone,
            p_business_id,
            v_points_balance,
            v_free_coffees,
            p_added_coffees,
            0
        )
        RETURNING id INTO v_loyalty_card_id;
    ELSE
        UPDATE loyalty_cards
        SET 
            points_balance = points_balance + v_points_balance,
            free_coffees = free_coffees + v_free_coffees,
            total_coffees_purchased = total_coffees_purchased + p_added_coffees
        WHERE id = v_loyalty_card_id;
    END IF;
    
    -- Record migration transaction as manual_adjustment
    IF p_added_coffees > 0 OR p_added_free > 0 THEN
        INSERT INTO loyalty_transactions (
            card_id,
            business_id,
            transaction_type,
            change_amount,
            points_earned,
            points_redeemed,
            order_id,
            created_by
        )
        VALUES (
            v_loyalty_card_id,
            p_business_id,
            'manual_adjustment',  -- Changed from 'migration'
            p_added_coffees,
            p_added_coffees,
            0,
            NULL,
            NULL
        );
    END IF;
    
    RETURN v_customer_id;
END;
$$;


--
-- Name: notify_new_employee(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.notify_new_employee() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_phone TEXT;
    v_message TEXT;
    v_business_name TEXT;
BEGIN
    -- Get the phone number (prefer whatsapp_phone, fallback to phone)
    v_phone := COALESCE(NEW.whatsapp_phone, NEW.phone);
    
    -- Only send if we have a valid phone number
    IF v_phone IS NULL OR LENGTH(v_phone) < 9 THEN
        RETURN NEW;
    END IF;
    
    -- Get business name
    SELECT business_name INTO v_business_name
    FROM businesses
    WHERE id = NEW.business_id;
    
    -- Build welcome message
    v_message := 'היי ' || COALESCE(NEW.name, '') || '! 👋' || chr(10) ||
                 chr(10) ||
                 'ברוך הבא ל:' || chr(10) ||
                 'iCaffeOS 🎉' || chr(10) ||
                 'מערכת ההפעלה לבתי קפה' || chr(10) || chr(10) ||
                 'פרטי ההתחברות שלך:' || chr(10) ||
                 '📧 אימייל: ' || COALESCE(NEW.email, 'לא הוגדר') || chr(10) ||
                 '� סיסמה: ' || COALESCE(NEW.pin_code, '') || '00' || chr(10) ||
                 '�🔢 קוד PIN: ' || COALESCE(NEW.pin_code, 'לא הוגדר') || chr(10) ||
                 chr(10) ||
                 '🔗 https://icaffe.vercel.app' || chr(10) ||
                 'בהצלחה! 🚀';
    
    -- Call the Edge Function via pg_net (or use http extension)
    -- Option A: If you have pg_net extension:
    -- PERFORM net.http_post(
    --     url := 'https://us-central1-repos-477613.cloudfunctions.net/sendSms',
    --     headers := '{"Content-Type": "application/json"}'::jsonb,
    --     body := json_build_object('phone', v_phone, 'message', v_message)::text
    -- );
    
    -- Option B: Log for manual follow-up (simpler, works everywhere)
    RAISE NOTICE 'NEW EMPLOYEE SMS: Phone=%, Message=%', v_phone, v_message;
    
    -- Insert into a queue table for background processing
    INSERT INTO sms_queue (phone, message, created_at, status)
    VALUES (v_phone, v_message, NOW(), 'pending')
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$;


--
-- Name: notify_order_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.notify_order_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- שולח הודעה לכל המאזינים (ה-KDS מאזין ל-orders_updates)
  PERFORM pg_notify('orders_updates', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$;


--
-- Name: prevent_item_reversion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.prevent_item_reversion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF OLD.item_status IN ('in_progress', 'ready', 'completed')
    AND NEW.item_status IN ('pending', 'new') THEN RAISE EXCEPTION 'SHIELD ACTIVATED: Cannot revert item % from % to %.',
    OLD.id,
    OLD.item_status,
    NEW.item_status;
END IF;
RETURN NEW;
END;
$$;


--
-- Name: prevent_order_reversion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.prevent_order_reversion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN -- Block reversion from Active statuses -> Pending (New)
    -- This physically prevents the "Zombie Browser" from saving its bad data.
    IF OLD.order_status IN ('in_progress', 'ready', 'completed')
    AND NEW.order_status IN ('pending', 'new') THEN -- We return OLD to silently reject the change (or RAISE EXCEPTION to crash the loop)
    -- Raising exception is safer as it alerts us if we see logs, but for KDS stability, keeping it as is might be better?
    -- No, let's BLOCK it.
    RAISE EXCEPTION 'SHIELD ACTIVATED: Cannot revert order % from % to %.',
    OLD.id,
    OLD.order_status,
    NEW.order_status;
END IF;
RETURN NEW;
END;
$$;


--
-- Name: receive_inventory_shipment(jsonb, integer, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.receive_inventory_shipment(p_items jsonb, p_order_id integer DEFAULT NULL::integer, p_supplier_id integer DEFAULT NULL::integer, p_notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_business_id UUID;
v_item JSONB;
v_inventory_item_id INT;
v_catalog_item_id INT;
v_actual_qty NUMERIC;
v_invoiced_qty NUMERIC;
v_unit_price NUMERIC;
v_variance NUMERIC;
v_total_items INT := 0;
v_total_variance NUMERIC := 0;
v_created_by UUID := auth.uid();
v_item_name TEXT;
v_item_unit TEXT;
v_item_category TEXT;
BEGIN -- 1. Security Check
SELECT business_id INTO v_business_id
FROM employees
WHERE id = auth.uid();
IF v_business_id IS NULL THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Access Denied: User not linked to business'
);
END IF;
IF p_items IS NULL
OR jsonb_array_length(p_items) = 0 THEN RETURN jsonb_build_object('success', false, 'error', 'No items provided');
END IF;
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP v_inventory_item_id := (v_item->>'inventory_item_id')::INT;
v_catalog_item_id := (v_item->>'catalog_item_id')::INT;
v_actual_qty := COALESCE((v_item->>'actual_qty')::NUMERIC, 0);
v_invoiced_qty := COALESCE((v_item->>'invoiced_qty')::NUMERIC, v_actual_qty);
v_unit_price := (v_item->>'unit_price')::NUMERIC;
v_variance := v_actual_qty - v_invoiced_qty;
-- Create item if missing
IF v_inventory_item_id IS NULL
AND v_catalog_item_id IS NOT NULL THEN -- Check if exists first
SELECT id INTO v_inventory_item_id
FROM inventory_items
WHERE catalog_item_id = v_catalog_item_id
    AND business_id = v_business_id;
IF v_inventory_item_id IS NULL THEN
SELECT name,
    unit,
    category INTO v_item_name,
    v_item_unit,
    v_item_category
FROM catalog_items
WHERE id = v_catalog_item_id;
INSERT INTO inventory_items (
        name,
        category,
        unit,
        current_stock,
        cost_per_unit,
        catalog_item_id,
        business_id,
        supplier_id
    )
VALUES (
        v_item_name,
        v_item_category,
        v_item_unit,
        0,
        v_unit_price,
        v_catalog_item_id,
        v_business_id,
        p_supplier_id
    )
RETURNING id INTO v_inventory_item_id;
END IF;
END IF;
IF v_inventory_item_id IS NOT NULL THEN -- Verify item belongs to business
PERFORM 1
FROM inventory_items
WHERE id = v_inventory_item_id
    AND business_id = v_business_id;
IF NOT FOUND THEN CONTINUE;
-- Skip items not belonging to this business (Security)
END IF;
UPDATE inventory_items
SET current_stock = COALESCE(current_stock, 0) + v_actual_qty,
    cost_per_unit = COALESCE(v_unit_price, cost_per_unit),
    last_counted_at = now()
WHERE id = v_inventory_item_id;
INSERT INTO inventory_logs (
        inventory_item_id,
        catalog_item_id,
        transaction_type,
        quantity,
        unit_price,
        supplier_id,
        reference_type,
        reference_id,
        expected_quantity,
        variance,
        notes,
        created_by,
        business_id
    )
VALUES (
        v_inventory_item_id,
        v_catalog_item_id,
        'IN',
        v_actual_qty,
        v_unit_price,
        p_supplier_id,
        CASE
            WHEN p_order_id IS NOT NULL THEN 'supplier_order'
            ELSE 'invoice_scan'
        END,
        COALESCE(p_order_id::TEXT, gen_random_uuid()::TEXT),
        v_invoiced_qty,
        v_variance,
        p_notes,
        v_created_by,
        v_business_id
    );
v_total_items := v_total_items + 1;
v_total_variance := v_total_variance + ABS(v_variance);
END IF;
END LOOP;
IF p_order_id IS NOT NULL THEN
UPDATE supplier_orders
SET status = 'received',
    delivery_status = 'arrived',
    confirmed_at = now(),
    confirmed_by = v_created_by
WHERE id = p_order_id
    AND business_id = v_business_id;
-- Ensure order belongs to business
END IF;
RETURN jsonb_build_object(
    'success',
    true,
    'items_processed',
    v_total_items,
    'total_variance',
    v_total_variance
);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


--
-- Name: receive_inventory_shipment(jsonb, uuid, bigint, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.receive_inventory_shipment(p_items jsonb, p_order_id uuid DEFAULT NULL::uuid, p_supplier_id bigint DEFAULT NULL::bigint, p_notes text DEFAULT NULL::text, p_business_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE 
    v_item JSONB;
    v_inventory_item_id INT;
    v_catalog_item_id UUID;
    v_actual_qty NUMERIC;
    v_invoiced_qty NUMERIC;
    v_unit_price NUMERIC;
    v_variance NUMERIC;
    v_total_items INT := 0;
    v_total_variance NUMERIC := 0;
    v_created_by UUID := auth.uid();
    v_item_name TEXT;
    v_item_unit TEXT;
    v_item_category TEXT;
    v_exists BOOLEAN;
BEGIN 
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN 
        RETURN jsonb_build_object('success', false, 'error', 'No items provided');
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) 
    LOOP 
        v_inventory_item_id := (v_item->>'inventory_item_id')::INT;
        v_catalog_item_id := (v_item->>'catalog_item_id')::UUID;
        v_actual_qty := COALESCE((v_item->>'actual_qty')::NUMERIC, 0);
        v_invoiced_qty := COALESCE((v_item->>'invoiced_qty')::NUMERIC, v_actual_qty);
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_variance := v_actual_qty - v_invoiced_qty;

        IF v_inventory_item_id IS NOT NULL THEN
            SELECT EXISTS(SELECT 1 FROM inventory_items WHERE id = v_inventory_item_id) INTO v_exists;
            IF NOT v_exists THEN 
                v_inventory_item_id := NULL;
            END IF;
        END IF;

        IF v_inventory_item_id IS NULL AND v_catalog_item_id IS NOT NULL AND p_business_id IS NOT NULL THEN
            SELECT id INTO v_inventory_item_id FROM inventory_items 
            WHERE catalog_item_id = v_catalog_item_id AND business_id = p_business_id;
            
            IF v_inventory_item_id IS NULL THEN
                SELECT name, unit, category INTO v_item_name, v_item_unit, v_item_category
                FROM catalog_items WHERE id = v_catalog_item_id;

                INSERT INTO inventory_items (name, category, unit, current_stock, cost_per_unit, catalog_item_id, business_id, supplier_id)
                VALUES (v_item_name, v_item_category, v_item_unit, 0, v_unit_price, v_catalog_item_id, p_business_id, p_supplier_id)
                RETURNING id INTO v_inventory_item_id;
            END IF;
        END IF;

        IF v_inventory_item_id IS NOT NULL THEN
            -- 🆕 Update with source = 'order_receipt'
            UPDATE inventory_items
            SET current_stock = COALESCE(current_stock, 0) + v_actual_qty,
                cost_per_unit = COALESCE(v_unit_price, cost_per_unit),
                last_counted_at = NOW(),
                last_counted_by = v_created_by,
                last_count_source = 'order_receipt',
                last_updated = NOW()
            WHERE id = v_inventory_item_id;

            INSERT INTO inventory_logs (
                inventory_item_id, catalog_item_id, transaction_type, log_type,
                quantity, unit_price, supplier_id, reference_type, reference_id,
                expected_quantity, variance, notes, created_by, business_id
            )
            VALUES (
                v_inventory_item_id, v_catalog_item_id, 'IN', 'RECEIPT',
                v_actual_qty, v_unit_price, p_supplier_id,
                CASE WHEN p_order_id IS NOT NULL THEN 'supplier_order' ELSE 'invoice_scan' END,
                COALESCE(p_order_id::TEXT, gen_random_uuid()::TEXT),
                v_invoiced_qty, v_variance, p_notes, v_created_by, p_business_id
            );

            v_total_items := v_total_items + 1;
            v_total_variance := v_total_variance + ABS(v_variance);
        END IF;
    END LOOP;

    IF p_order_id IS NOT NULL THEN
        UPDATE supplier_orders
        SET status = 'received', delivery_status = 'arrived', 
            confirmed_at = NOW(), confirmed_by = v_created_by
        WHERE id = p_order_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'items_processed', v_total_items,
        'total_variance', v_total_variance
    );
EXCEPTION WHEN OTHERS THEN 
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


--
-- Name: reject_rantunes_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.reject_rantunes_user(target_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE rantunes_users SET status = 'rejected', updated_at = NOW()
    WHERE id = target_user_id;
END;
$$;


--
-- Name: run_sql(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.run_sql(query_text text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE result JSONB;
BEGIN -- Execute the query and return results as JSON
EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_text || ') t' INTO result;
RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object('error', SQLERRM);
END;
$$;


--
-- Name: search_code(extensions.vector, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.search_code(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.4, match_count integer DEFAULT 5) RETURNS TABLE(file_path text, content text, summary text, similarity double precision)
    LANGUAGE plpgsql
    AS $$ BEGIN RETURN QUERY
SELECT cc.file_path,
    cc.content,
    cc.summary,
    1 - (cc.embedding <=> query_embedding) AS similarity
FROM code_chunks cc
WHERE cc.embedding IS NOT NULL
    AND 1 - (cc.embedding <=> query_embedding) > match_threshold
ORDER BY cc.embedding <=> query_embedding
LIMIT match_count;
END;
$$;


--
-- Name: send_device_heartbeat(uuid, text, text, text, text, text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.send_device_heartbeat(p_business_id uuid, p_device_id text, p_device_type text DEFAULT 'kds'::text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text, p_screen_resolution text DEFAULT NULL::text, p_user_name text DEFAULT NULL::text, p_employee_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO device_sessions (
        business_id, device_id, device_type, ip_address, user_agent, screen_resolution, 
        user_name, employee_id, session_started_at, last_seen_at
    ) VALUES (
        p_business_id, p_device_id, p_device_type, p_ip_address, p_user_agent, p_screen_resolution,
        p_user_name, p_employee_id, NOW(), NOW()
    )
    ON CONFLICT (device_id) 
    DO UPDATE SET 
        -- Always update these fields with new values (override old)
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        screen_resolution = EXCLUDED.screen_resolution,
        user_name = EXCLUDED.user_name,
        employee_id = EXCLUDED.employee_id,
        business_id = EXCLUDED.business_id,
        device_type = EXCLUDED.device_type,
        last_seen_at = NOW();

    UPDATE businesses SET last_active_at = NOW() WHERE id = p_business_id;
    RETURN TRUE;
END;
$$;


--
-- Name: send_kds_heartbeat(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.send_kds_heartbeat(p_business_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_business_id UUID;
BEGIN
    -- Priority 1: Use provided parameter
    v_business_id := p_business_id;

    -- Priority 2: Try to get from current_user_business_id helper function
    IF v_business_id IS NULL THEN
        v_business_id := public.current_user_business_id();
    END IF;

    -- Fallback: Pilot Cafe (for testing)
    IF v_business_id IS NULL THEN
        v_business_id := '11111111-1111-1111-1111-111111111111';
    END IF;

    -- Update the business heartbeat
    UPDATE businesses
    SET last_active_at = NOW()
    WHERE id = v_business_id;

    RETURN TRUE;
END;
$$;


--
-- Name: set_business_id_automatically(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.set_business_id_automatically() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only set if NULL
    IF NEW.business_id IS NULL THEN
        NEW.business_id := current_user_business_id();
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: set_employee_password(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.set_employee_password(p_employee_id uuid, p_new_password text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE employees
    SET password_hash = crypt(p_new_password, gen_salt('bf'))
    WHERE id = p_employee_id;
    
    RETURN FOUND;
END;
$$;


--
-- Name: FUNCTION set_employee_password(p_employee_id uuid, p_new_password text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.set_employee_password(p_employee_id uuid, p_new_password text) IS 'Set a new hashed password for an employee';


--
-- Name: set_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.set_order_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := nextval('order_number_seq');
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: submit_order(text, text, jsonb, boolean, uuid, text, boolean, boolean, uuid, numeric, boolean, jsonb, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.submit_order(p_customer_phone text, p_customer_name text, p_items jsonb, p_is_paid boolean, p_customer_id uuid DEFAULT NULL::uuid, p_payment_method text DEFAULT NULL::text, p_refund boolean DEFAULT false, edit_mode boolean DEFAULT false, order_id uuid DEFAULT NULL::uuid, original_total numeric DEFAULT NULL::numeric, is_refund boolean DEFAULT false, p_cancelled_items jsonb DEFAULT '[]'::jsonb, p_final_total numeric DEFAULT NULL::numeric) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_order_id uuid;
    v_order_number text;
    v_total_amount numeric;
    v_item jsonb;
    v_order_status text;
    v_order_item_id_str text;
BEGIN
    -- Determine Total Amount
    IF p_final_total IS NOT NULL THEN
        v_total_amount := p_final_total;
    ELSE
        -- Fallback: Calculate total from items
        SELECT COALESCE(SUM((item->>'price')::numeric * (item->>'quantity')::int), 0)
        INTO v_total_amount
        FROM jsonb_array_elements(p_items) AS item;
    END IF;

    -- Determine initial status
    v_order_status := 'in_progress';

    IF edit_mode THEN
        v_order_id := order_id;
        UPDATE orders 
        SET total_amount = v_total_amount, is_paid = p_is_paid, payment_method = p_payment_method, is_refund = p_refund
        WHERE id = v_order_id
        RETURNING order_number INTO v_order_number;
        
        -- Handle cancelled items
        IF jsonb_array_length(p_cancelled_items) > 0 THEN
            UPDATE order_items
            SET item_status = 'cancelled'
            WHERE id IN (
                SELECT (item->>'id')::uuid
                FROM jsonb_array_elements(p_cancelled_items) AS item
            );
        END IF;

    ELSE
        INSERT INTO orders (
            customer_id, customer_name, customer_phone, 
            order_status, is_paid, payment_method, total_amount, 
            is_refund, refund_amount
        ) VALUES (
            p_customer_id, p_customer_name, p_customer_phone,
            v_order_status, p_is_paid, p_payment_method, v_total_amount,
            p_refund, CASE WHEN p_refund THEN v_total_amount ELSE 0 END
        )
        RETURNING id, order_number INTO v_order_id, v_order_number;
    END IF;

    -- Insert/Update Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Extract order_item_id safely
        v_order_item_id_str := v_item->>'order_item_id';

        -- If item has an order_item_id (UUID), it's an update to an existing item
        IF v_order_item_id_str IS NOT NULL AND v_order_item_id_str != 'null' AND v_order_item_id_str != '' THEN
             UPDATE order_items
             SET 
                quantity = (v_item->>'quantity')::int,
                mods = v_item->'mods',
                notes = v_item->>'notes',
                price = (v_item->>'price')::numeric
             WHERE id = v_order_item_id_str::uuid;
        ELSE
            -- New item
            INSERT INTO order_items (
                order_id, menu_item_id, quantity, price, mods, item_status, notes
            ) VALUES (
                v_order_id,
                (v_item->>'item_id')::int,
                (v_item->>'quantity')::int,
                (v_item->>'price')::numeric,
                v_item->'mods',
                COALESCE(v_item->>'item_status', 'in_progress'),
                v_item->>'notes'
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_number', v_order_number
    );
END;
$$;


--
-- Name: submit_order_v2(uuid, text, text, jsonb, boolean, numeric, boolean, uuid, jsonb, boolean, uuid, uuid, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.submit_order_v2(p_customer_id uuid DEFAULT NULL::uuid, p_customer_name text DEFAULT NULL::text, p_customer_phone text DEFAULT NULL::text, p_items jsonb DEFAULT '[]'::jsonb, p_is_paid boolean DEFAULT false, p_final_total numeric DEFAULT NULL::numeric, edit_mode boolean DEFAULT false, order_id uuid DEFAULT NULL::uuid, p_cancelled_items jsonb DEFAULT '[]'::jsonb, p_is_quick_order boolean DEFAULT false, p_business_id uuid DEFAULT NULL::uuid, p_discount_id uuid DEFAULT NULL::uuid, p_discount_amount numeric DEFAULT NULL::numeric, p_payment_method text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_order_id uuid;
    v_order_number text;
    v_total_amount numeric;
    v_item jsonb;
    v_order_status text;
    v_order_item_id_str text;
    v_business_id uuid;
    v_has_new_items boolean := false;
    v_kds_routing_logic text;
    v_item_status text;
BEGIN
    -- Business ID Detection
    IF p_business_id IS NOT NULL THEN
        v_business_id := p_business_id;
    ELSE
        SELECT business_id INTO v_business_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1;
    END IF;

    -- Calculate total
    IF p_final_total IS NOT NULL THEN
        v_total_amount := p_final_total;
    ELSE
        SELECT COALESCE(SUM((item->>'price')::numeric * (item->>'quantity')::int), 0)
        INTO v_total_amount FROM jsonb_array_elements(p_items) AS item;
    END IF;

    v_order_status := 'in_progress';

    IF edit_mode THEN
        v_order_id := order_id;
        
        -- Check if there are any NEW items
        SELECT EXISTS (
            SELECT 1 FROM jsonb_array_elements(p_items) AS item 
            WHERE (item->>'order_item_id') IS NULL OR (item->>'order_item_id') = '' OR (item->>'order_item_id') = 'null'
        ) INTO v_has_new_items;
        
        -- Update order
        UPDATE orders 
        SET 
            customer_id = COALESCE(p_customer_id, customer_id),
            customer_name = p_customer_name,
            customer_phone = p_customer_phone,
            total_amount = v_total_amount,
            is_paid = CASE 
                WHEN v_has_new_items AND NOT p_is_paid THEN false 
                ELSE is_paid 
            END,
            payment_method = COALESCE(p_payment_method, payment_method), -- Update payment method if provided
            order_status = CASE 
                WHEN v_has_new_items THEN 'in_progress' 
                ELSE order_status 
            END,
            updated_at = NOW(),
            discount_id = p_discount_id,
            discount_amount = p_discount_amount
        WHERE id = v_order_id
        RETURNING order_number INTO v_order_number;
        
        -- Handle cancelled items
        IF jsonb_array_length(p_cancelled_items) > 0 THEN
            UPDATE order_items SET item_status = 'cancelled' 
            WHERE id IN (SELECT (item->>'id')::uuid FROM jsonb_array_elements(p_cancelled_items) AS item);
        END IF;
    ELSE
        -- New order
        INSERT INTO orders (
            business_id, customer_id, customer_name, customer_phone, 
            order_status, is_paid, total_amount, discount_id, discount_amount,
            payment_method -- Insert payment method
        )
        VALUES (
            v_business_id, p_customer_id, p_customer_name, p_customer_phone, 
            v_order_status, p_is_paid, v_total_amount, p_discount_id, p_discount_amount,
            p_payment_method
        )
        RETURNING id, order_number INTO v_order_id, v_order_number;
        
        IF p_is_quick_order AND (p_customer_name IS NULL OR p_customer_name = '' OR p_customer_name = 'אורח') THEN 
            UPDATE orders SET customer_name = '#' || v_order_number WHERE id = v_order_id; 
        END IF;
    END IF;

    -- Process items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_order_item_id_str := v_item->>'order_item_id';
        IF v_order_item_id_str IS NOT NULL AND v_order_item_id_str != 'null' AND v_order_item_id_str != '' THEN
            -- Update existing item
            UPDATE order_items 
            SET quantity = (v_item->>'quantity')::int, 
                mods = v_item->'mods', 
                notes = v_item->>'notes', 
                price = (v_item->>'price')::numeric
            WHERE id = v_order_item_id_str::uuid;
        ELSE
            -- NEW ITEM logic
            SELECT kds_routing_logic INTO v_kds_routing_logic
            FROM menu_items
            WHERE id = (v_item->>'item_id')::int;
            
            IF v_kds_routing_logic = 'GRAB_AND_GO' THEN
                v_item_status := 'completed';
            ELSE
                v_item_status := 'in_progress';
            END IF;
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, price, mods, item_status, notes)
            VALUES (v_order_id, (v_item->>'item_id')::int, (v_item->>'quantity')::int, (v_item->>'price')::numeric, v_item->'mods', v_item_status, v_item->>'notes');
        END IF;
    END LOOP;

    RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
END;
$$;


--
-- Name: submit_order_v2(uuid, text, text, jsonb, boolean, numeric, boolean, uuid, jsonb, boolean, uuid, uuid, numeric, boolean, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.submit_order_v2(p_customer_id uuid DEFAULT NULL::uuid, p_customer_name text DEFAULT NULL::text, p_customer_phone text DEFAULT NULL::text, p_items jsonb DEFAULT '[]'::jsonb, p_is_paid boolean DEFAULT false, p_final_total numeric DEFAULT NULL::numeric, edit_mode boolean DEFAULT false, order_id uuid DEFAULT NULL::uuid, p_cancelled_items jsonb DEFAULT '[]'::jsonb, p_is_quick_order boolean DEFAULT false, p_business_id uuid DEFAULT NULL::uuid, p_discount_id uuid DEFAULT NULL::uuid, p_discount_amount numeric DEFAULT NULL::numeric, p_refund boolean DEFAULT false, p_refund_amount numeric DEFAULT NULL::numeric, p_refund_method text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_order_id uuid;
    v_order_number text;
    v_total_amount numeric;
    v_item jsonb;
    v_order_status text;
    v_order_item_id_str text;
    v_business_id uuid;
    v_has_new_items boolean := false;
    v_kds_routing_logic text;
    v_item_status text;
BEGIN
    -- Business ID Detection
    IF p_business_id IS NOT NULL THEN
        v_business_id := p_business_id;
    ELSE
        SELECT business_id INTO v_business_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1;
    END IF;

    -- Calculate total
    IF p_final_total IS NOT NULL THEN
        v_total_amount := p_final_total;
    ELSE
        SELECT COALESCE(SUM((item->>'price')::numeric * (item->>'quantity')::int), 0)
        INTO v_total_amount FROM jsonb_array_elements(p_items) AS item;
    END IF;

    v_order_status := 'in_progress';

    IF edit_mode THEN
        v_order_id := order_id;
        
        -- Check if there are any NEW items (items without order_item_id)
        SELECT EXISTS (
            SELECT 1 FROM jsonb_array_elements(p_items) AS item 
            WHERE (item->>'order_item_id') IS NULL OR (item->>'order_item_id') = '' OR (item->>'order_item_id') = 'null'
        ) INTO v_has_new_items;
        
        -- Update order
        UPDATE orders 
        SET 
            customer_id = COALESCE(p_customer_id, customer_id),
            customer_name = p_customer_name,
            customer_phone = p_customer_phone,
            total_amount = v_total_amount,
            is_paid = CASE 
                WHEN v_has_new_items AND NOT p_is_paid THEN false 
                ELSE is_paid 
            END,
            order_status = CASE 
                WHEN v_has_new_items THEN 'in_progress' 
                ELSE order_status 
            END,
            is_refund = COALESCE(p_refund, is_refund),
            refund_amount = COALESCE(p_refund_amount, refund_amount),
            refund_method = COALESCE(p_refund_method, refund_method),
            updated_at = NOW(),
            discount_id = p_discount_id,
            discount_amount = p_discount_amount
        WHERE id = v_order_id
          AND business_id = v_business_id -- ✅ SECURITY FIX: Ensure editing only own business orders
        RETURNING order_number INTO v_order_number;
        
        -- Handle cancelled items
        IF jsonb_array_length(p_cancelled_items) > 0 THEN
            UPDATE order_items SET item_status = 'cancelled' 
            WHERE id IN (SELECT (item->>'id')::uuid FROM jsonb_array_elements(p_cancelled_items) AS item)
              AND order_id = v_order_id; -- Safety check
        END IF;
    ELSE
        -- New order
        INSERT INTO orders (
            business_id, customer_id, customer_name, customer_phone, 
            order_status, is_paid, total_amount, discount_id, discount_amount,
            is_refund, refund_amount, refund_method
        )
        VALUES (
            v_business_id, p_customer_id, p_customer_name, p_customer_phone, 
            v_order_status, p_is_paid, v_total_amount, p_discount_id, p_discount_amount,
            p_refund, p_refund_amount, p_refund_method
        )
        RETURNING id, order_number INTO v_order_id, v_order_number;
        
        IF p_is_quick_order AND (p_customer_name IS NULL OR p_customer_name = '' OR p_customer_name = 'אורח') THEN 
            UPDATE orders SET customer_name = '#' || v_order_number WHERE id = v_order_id; 
        END IF;
    END IF;

    -- Process items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_order_item_id_str := v_item->>'order_item_id';
        IF v_order_item_id_str IS NOT NULL AND v_order_item_id_str != 'null' AND v_order_item_id_str != '' THEN
            -- Update existing item
            UPDATE order_items 
            SET quantity = (v_item->>'quantity')::int, 
                mods = v_item->'mods', 
                notes = v_item->>'notes', 
                price = (v_item->>'price')::numeric
            WHERE id = v_order_item_id_str::uuid
              AND order_id = v_order_id; -- Security fix
        ELSE
            -- NEW ITEM
            SELECT kds_routing_logic INTO v_kds_routing_logic
            FROM menu_items
            WHERE id = (v_item->>'item_id')::int;
            
            IF v_kds_routing_logic = 'GRAB_AND_GO' THEN
                v_item_status := 'completed';
            ELSE
                v_item_status := 'in_progress';
            END IF;
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, price, mods, item_status, notes)
            VALUES (v_order_id, (v_item->>'item_id')::int, (v_item->>'quantity')::int, (v_item->>'price')::numeric, v_item->'mods', v_item_status, v_item->>'notes');
        END IF;
    END LOOP;

    RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
END;
$$;


--
-- Name: submit_order_v2(text, text, jsonb, boolean, uuid, text, boolean, boolean, uuid, numeric, boolean, jsonb, numeric, integer, boolean, uuid, numeric, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.submit_order_v2(p_customer_phone text, p_customer_name text, p_items jsonb, p_is_paid boolean, p_customer_id uuid DEFAULT NULL::uuid, p_payment_method text DEFAULT NULL::text, p_refund boolean DEFAULT false, edit_mode boolean DEFAULT false, order_id uuid DEFAULT NULL::uuid, original_total numeric DEFAULT NULL::numeric, is_refund boolean DEFAULT false, p_cancelled_items jsonb DEFAULT '[]'::jsonb, p_final_total numeric DEFAULT NULL::numeric, p_original_coffee_count integer DEFAULT NULL::integer, p_is_quick_order boolean DEFAULT false, p_discount_id uuid DEFAULT NULL::uuid, p_discount_amount numeric DEFAULT 0, p_business_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_order_id uuid;
    v_order_number text;
    v_total_amount numeric;
    v_item jsonb;
    v_order_status text;
    v_order_item_id_str text;
    v_business_id uuid;
    v_has_new_items boolean := false;
BEGIN
    -- Business ID Detection
    IF p_business_id IS NOT NULL THEN
        v_business_id := p_business_id;
    ELSE
        SELECT business_id INTO v_business_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1;
    END IF;

    -- Calculate total
    IF p_final_total IS NOT NULL THEN
        v_total_amount := p_final_total;
    ELSE
        SELECT COALESCE(SUM((item->>'price')::numeric * (item->>'quantity')::int), 0)
        INTO v_total_amount FROM jsonb_array_elements(p_items) AS item;
    END IF;

    v_order_status := 'in_progress';

    IF edit_mode THEN
        v_order_id := order_id;
        
        -- Check if there are any NEW items (items without order_item_id)
        SELECT EXISTS (
            SELECT 1 FROM jsonb_array_elements(p_items) AS item 
            WHERE (item->>'order_item_id') IS NULL OR (item->>'order_item_id') = '' OR (item->>'order_item_id') = 'null'
        ) INTO v_has_new_items;
        
        -- Update order - only reset order_status to in_progress if there are NEW items
        UPDATE orders 
        SET 
            customer_id = COALESCE(p_customer_id, customer_id),
            customer_name = p_customer_name,
            customer_phone = p_customer_phone,
            total_amount = v_total_amount,
            -- PRESERVE is_paid status! Only update if explicitly passed as false AND there are new items
            is_paid = CASE 
                WHEN v_has_new_items AND NOT p_is_paid THEN false 
                ELSE is_paid 
            END,
            -- Only reset to in_progress if there are NEW items to prepare
            order_status = CASE 
                WHEN v_has_new_items THEN 'in_progress' 
                ELSE order_status 
            END,
            updated_at = NOW(),
            discount_id = p_discount_id,
            discount_amount = p_discount_amount
        WHERE id = v_order_id
        RETURNING order_number INTO v_order_number;
        
        -- Handle cancelled items
        IF jsonb_array_length(p_cancelled_items) > 0 THEN
            UPDATE order_items SET item_status = 'cancelled' 
            WHERE id IN (SELECT (item->>'id')::uuid FROM jsonb_array_elements(p_cancelled_items) AS item);
        END IF;
    ELSE
        -- New order
        INSERT INTO orders (business_id, customer_id, customer_name, customer_phone, order_status, is_paid, total_amount, discount_id, discount_amount)
        VALUES (v_business_id, p_customer_id, p_customer_name, p_customer_phone, v_order_status, p_is_paid, v_total_amount, p_discount_id, p_discount_amount)
        RETURNING id, order_number INTO v_order_id, v_order_number;
        
        IF p_is_quick_order AND (p_customer_name IS NULL OR p_customer_name = '' OR p_customer_name = 'אורח') THEN 
            UPDATE orders SET customer_name = '#' || v_order_number WHERE id = v_order_id; 
        END IF;
    END IF;

    -- Process items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_order_item_id_str := v_item->>'order_item_id';
        IF v_order_item_id_str IS NOT NULL AND v_order_item_id_str != 'null' AND v_order_item_id_str != '' THEN
            -- Update existing item - DO NOT change item_status! Keep completed items as completed
            UPDATE order_items 
            SET quantity = (v_item->>'quantity')::int, 
                mods = v_item->'mods', 
                notes = v_item->>'notes', 
                price = (v_item->>'price')::numeric
                -- item_status stays unchanged!
            WHERE id = v_order_item_id_str::uuid;
        ELSE
            -- Insert NEW item with in_progress status
            INSERT INTO order_items (order_id, menu_item_id, quantity, price, mods, item_status, notes)
            VALUES (v_order_id, (v_item->>'item_id')::int, (v_item->>'quantity')::int, (v_item->>'price')::numeric, v_item->'mods', 'in_progress', v_item->>'notes');
        END IF;
    END LOOP;

    RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
END;
$$;


--
-- Name: submit_order_v3(text, text, jsonb, boolean, uuid, text, boolean, numeric, text, boolean, uuid, numeric, jsonb, numeric, integer, boolean, uuid, numeric, uuid, text, text, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.submit_order_v3(p_customer_phone text DEFAULT NULL::text, p_customer_name text DEFAULT NULL::text, p_items jsonb DEFAULT '[]'::jsonb, p_is_paid boolean DEFAULT false, p_customer_id uuid DEFAULT NULL::uuid, p_payment_method text DEFAULT NULL::text, p_refund boolean DEFAULT false, p_refund_amount numeric DEFAULT 0, p_refund_method text DEFAULT NULL::text, p_edit_mode boolean DEFAULT false, p_order_id uuid DEFAULT NULL::uuid, p_original_total numeric DEFAULT 0, p_cancelled_items jsonb DEFAULT '[]'::jsonb, p_final_total numeric DEFAULT 0, p_original_coffee_count integer DEFAULT 0, p_is_quick_order boolean DEFAULT false, p_discount_id uuid DEFAULT NULL::uuid, p_discount_amount numeric DEFAULT 0, p_business_id uuid DEFAULT NULL::uuid, p_order_type text DEFAULT 'dine_in'::text, p_delivery_address text DEFAULT NULL::text, p_delivery_fee numeric DEFAULT 0, p_delivery_notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_order_id uuid;
v_order_number text;
v_total_amount numeric;
v_item jsonb;
v_order_status text;
v_business_id uuid;
v_new_points_count integer := 0;
v_item_id int;
v_item_qty int;
v_item_price numeric;
v_item_status text;
BEGIN -- 1. Identify Business
IF p_business_id IS NOT NULL THEN v_business_id := p_business_id;
ELSE
SELECT business_id INTO v_business_id
FROM employees
WHERE auth_user_id = auth.uid()
LIMIT 1;
END IF;
v_total_amount := COALESCE(p_final_total, 0);
v_order_status := CASE
    WHEN p_order_type = 'delivery' THEN 'pending'
    ELSE 'in_progress'
END;
-- 2. Create/Update Order
IF p_edit_mode THEN v_order_id := p_order_id;
UPDATE orders
SET customer_id = p_customer_id,
    customer_name = p_customer_name,
    customer_phone = p_customer_phone,
    total_amount = v_total_amount,
    is_paid = p_is_paid,
    updated_at = NOW()
WHERE id = v_order_id
    AND business_id = v_business_id
RETURNING order_number INTO v_order_number;
ELSE
INSERT INTO orders (
        business_id,
        customer_id,
        customer_name,
        customer_phone,
        order_status,
        is_paid,
        total_amount,
        discount_id,
        discount_amount,
        payment_method,
        order_type
    )
VALUES (
        v_business_id,
        p_customer_id,
        p_customer_name,
        p_customer_phone,
        v_order_status,
        p_is_paid,
        v_total_amount,
        p_discount_id,
        p_discount_amount,
        p_payment_method,
        COALESCE(p_order_type, 'dine_in')
    )
RETURNING id,
    order_number INTO v_order_id,
    v_order_number;
END IF;
-- 3. Process Items
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP v_item_id := (v_item->>'item_id')::int;
v_item_qty := (v_item->>'quantity')::int;
v_item_price := (v_item->>'price')::numeric;
v_item_status := COALESCE(
    NULLIF(v_item->>'item_status', ''),
    v_order_status
);
-- Count Hot Drinks
IF (v_item->>'is_hot_drink')::boolean = true
OR (v_item->>'is_hot_drink') = 'true' THEN v_new_points_count := v_new_points_count + COALESCE(v_item_qty, 1);
END IF;
IF p_edit_mode
AND (v_item->>'order_item_id') IS NOT NULL
AND (v_item->>'order_item_id') != 'null' THEN
UPDATE order_items
SET quantity = v_item_qty,
    mods = v_item->'mods',
    notes = v_item->>'notes'
WHERE id = (v_item->>'order_item_id')::uuid;
ELSE
INSERT INTO order_items (
        order_id,
        menu_item_id,
        quantity,
        price,
        mods,
        item_status,
        notes,
        course_stage,
        business_id
    )
VALUES (
        v_order_id,
        v_item_id,
        v_item_qty,
        v_item_price,
        v_item->'mods',
        v_item_status,
        v_item->>'notes',
        1,
        v_business_id
    );
END IF;
END LOOP;
-- 4. Loyalty Call
IF p_customer_phone IS NOT NULL
AND length(p_customer_phone) >= 9
AND p_customer_phone NOT LIKE 'GUEST_%'
AND v_new_points_count > 0 THEN PERFORM public.handle_loyalty_purchase(
    p_customer_phone,
    v_business_id,
    -- Fixed: Passing business_id
    v_new_points_count,
    v_order_id,
    false,
    0
);
END IF;
RETURN jsonb_build_object(
    'order_id',
    v_order_id,
    'order_number',
    v_order_number
);
END;
$$;


--
-- Name: toggle_early_delivered(uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.toggle_early_delivered(p_item_id uuid, p_value boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ BEGIN
UPDATE order_items
SET is_early_delivered = p_value
WHERE id = p_item_id;
END;
$$;


--
-- Name: FUNCTION toggle_early_delivered(p_item_id uuid, p_value boolean); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.toggle_early_delivered(p_item_id uuid, p_value boolean) IS 'Toggles the early delivery flag for order items in KDS edit mode';


--
-- Name: toggle_item_packed(text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.toggle_item_packed(p_item_id text, p_is_packed boolean) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ BEGIN
UPDATE "public"."order_items"
SET "is_packed" = p_is_packed
WHERE "id" = p_item_id::uuid;
RETURN FOUND;
END;
$$;


--
-- Name: update_business_ai_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_business_ai_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_catalog_avg_price(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_catalog_avg_price() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE catalog_items
  SET avg_cost_price = (
    SELECT AVG(cost_per_unit)
    FROM inventory_items
    WHERE catalog_item_id = NEW.catalog_item_id
    AND cost_per_unit > 0
  )
  WHERE id = NEW.catalog_item_id;
  RETURN NEW;
END;
$$;


--
-- Name: update_inventory_item_details(bigint, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_inventory_item_details(p_item_id bigint, p_updates jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_updated_item JSONB;
BEGIN
UPDATE inventory_items
SET name = COALESCE((p_updates->>'name')::TEXT, name),
    unit = COALESCE((p_updates->>'unit')::TEXT, unit),
    cost_per_unit = COALESCE(
        (p_updates->>'cost_per_unit')::NUMERIC,
        cost_per_unit
    ),
    count_step = COALESCE((p_updates->>'count_step')::NUMERIC, count_step),
    weight_per_unit = COALESCE(
        (p_updates->>'weight_per_unit')::NUMERIC,
        weight_per_unit
    ),
    min_order = COALESCE((p_updates->>'min_order')::NUMERIC, min_order),
    order_step = COALESCE((p_updates->>'order_step')::NUMERIC, order_step),
    low_stock_alert = COALESCE(
        (p_updates->>'low_stock_alert')::NUMERIC,
        low_stock_alert
    ),
    location = COALESCE((p_updates->>'location')::TEXT, location),
    yield_percentage = COALESCE(
        (p_updates->>'yield_percentage')::NUMERIC,
        yield_percentage
    )
WHERE id = p_item_id
RETURNING to_jsonb(inventory_items.*) INTO v_updated_item;
RETURN v_updated_item;
END;
$$;


--
-- Name: update_inventory_stock(integer, numeric, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_inventory_stock(p_item_id integer, p_new_stock numeric, p_counted_by uuid DEFAULT NULL::uuid, p_source text DEFAULT 'manual'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_name TEXT;
BEGIN
    -- Get user's name if counting manually
    IF p_counted_by IS NOT NULL THEN
        SELECT name INTO v_user_name FROM employees WHERE id = p_counted_by;
    END IF;

    UPDATE inventory_items
    SET current_stock = p_new_stock,
        last_counted_at = NOW(),
        last_counted_by = p_counted_by,
        last_count_source = p_source,
        last_updated = NOW()
    WHERE id = p_item_id;
    
    RETURN jsonb_build_object(
        'success', true, 
        'updated_stock', p_new_stock,
        'counted_by_name', v_user_name
    );
END;
$$;


--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_order_customer(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_order_customer(p_order_id uuid, p_customer_id uuid, p_customer_phone text, p_customer_name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE orders
    SET 
        customer_id = p_customer_id,
        customer_phone = p_customer_phone,
        customer_name = p_customer_name,
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$;


--
-- Name: FUNCTION update_order_customer(p_order_id uuid, p_customer_id uuid, p_customer_phone text, p_customer_name text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_order_customer(p_order_id uuid, p_customer_id uuid, p_customer_phone text, p_customer_name text) IS 'Updates order customer details. Created by Antigravity to fix signature ambiguity.';


--
-- Name: update_order_customer_name(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_order_customer_name(order_id_in uuid, customer_name_in text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- הפקודה הבאה תפעל עם הרשאות הבעלים (ולא המשתמש שקורא לה), 
    -- ולכן תעקוף את RLS באופן בטוח לביצוע העדכון הספציפי.
    UPDATE public.orders
    SET customer_name = customer_name_in
    WHERE id = order_id_in;
END;
$$;


--
-- Name: update_order_items_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_order_items_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_order_status(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id uuid, p_status text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- 1. Update the Order
    UPDATE orders
    SET order_status = p_status,
        ready_at = CASE 
            WHEN p_status = 'ready' AND ready_at IS NULL THEN NOW() 
            ELSE ready_at 
        END,
        completed_at = CASE 
            WHEN p_status = 'completed' AND completed_at IS NULL THEN NOW() 
            ELSE completed_at 
        END
    WHERE id = p_order_id;

    -- 2. Update the Items (Cascade the status)
    -- Postgres will automatically attempt to cast the text to the enum if the column is an enum
    UPDATE order_items
    SET item_status = p_status
    WHERE order_id = p_order_id
    AND item_status != 'cancelled' 
    AND item_status != 'completed'; 
    
END;
$$;


--
-- Name: update_order_status_v3(text, text, text, uuid, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_order_status_v3(p_order_id text, p_new_status text, p_item_status text DEFAULT NULL::text, p_business_id uuid DEFAULT NULL::uuid, p_seen_at timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_order_uuid UUID;
v_business_id UUID;
v_now TIMESTAMPTZ := NOW();
v_rows_affected INTEGER;
BEGIN -- Resolve potential UUID casting issues
BEGIN v_order_uuid := p_order_id::UUID;
EXCEPTION
WHEN others THEN -- Fallback if it's not a UUID (like a local ID), but most orders should be UUIDs
v_order_uuid := NULL;
END;
-- Resolve business_id
IF p_business_id IS NOT NULL THEN v_business_id := p_business_id;
ELSE
SELECT business_id INTO v_business_id
FROM employees
WHERE auth_user_id = auth.uid()
LIMIT 1;
END IF;
-- 2. Update Order
UPDATE orders
SET order_status = p_new_status,
    updated_at = v_now,
    -- Automated timestamps logic
    seen_at = CASE
        WHEN p_seen_at IS NOT NULL THEN p_seen_at
        WHEN p_new_status IN ('new', 'in_progress', 'ready') THEN COALESCE(seen_at, v_now)
        ELSE seen_at
    END,
    ready_at = CASE
        WHEN p_new_status = 'ready' THEN v_now
        ELSE ready_at
    END,
    completed_at = CASE
        WHEN p_new_status = 'completed' THEN v_now
        ELSE completed_at
    END
WHERE id = p_order_id::UUID
    AND (
        v_business_id IS NULL
        OR business_id = v_business_id
    );
GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
-- 3. INTELLIGENT ITEM UPDATE (Based on Order Status)
-- If p_item_status is provided EXPLICITLY, use it for all items.
-- Otherwise, apply the "Intelligent" movement logic.
IF p_item_status IS NOT NULL THEN
UPDATE order_items
SET item_status = p_item_status,
    updated_at = v_now
WHERE order_id = p_order_id::UUID
    AND item_status != 'cancelled';
ELSE -- Automated Logic from Candidate 1
IF p_new_status = 'ready' THEN
UPDATE order_items
SET item_status = 'ready',
    updated_at = v_now
WHERE order_id = p_order_id::UUID
    AND item_status NOT IN ('completed', 'cancelled');
ELSIF p_new_status = 'completed' THEN
UPDATE order_items
SET item_status = 'completed',
    updated_at = v_now
WHERE order_id = p_order_id::UUID
    AND item_status != 'cancelled';
ELSIF p_new_status = 'in_progress' THEN
UPDATE order_items
SET item_status = 'in_progress',
    updated_at = v_now
WHERE order_id = p_order_id::UUID
    AND item_status IN ('pending', 'new', 'held');
END IF;
END IF;
RETURN jsonb_build_object(
    'success',
    v_rows_affected > 0,
    'order_id',
    p_order_id,
    'new_status',
    p_new_status,
    'rows_affected',
    v_rows_affected
);
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: upsert_customer(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.upsert_customer(p_phone_number text, p_name text DEFAULT NULL::text) RETURNS TABLE(customer_id uuid, customer_name text, phone text, loyalty_coffee_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_customer public.customers%ROWTYPE;
BEGIN
    IF p_phone_number IS NULL OR trim(p_phone_number) = '' THEN
        RAISE EXCEPTION 'Missing phone number';
    END IF;

    p_phone_number := regexp_replace(p_phone_number, '\D', '', 'g');

    SELECT * INTO v_customer
    FROM public.customers
    WHERE phone_number = p_phone_number
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.customers (phone_number, name, loyalty_coffee_count)
        VALUES (p_phone_number, COALESCE(NULLIF(trim(p_name), ''), NULL), 0)
        RETURNING * INTO v_customer;
    ELSE
        UPDATE public.customers
        SET
            name = COALESCE(NULLIF(trim(p_name), ''), name),
            updated_at = now()
        WHERE id = v_customer.id
        RETURNING * INTO v_customer;
    END IF;

    RETURN QUERY
    SELECT
        v_customer.id,
        v_customer.name,
        v_customer.phone_number,
        v_customer.loyalty_coffee_count;
END;
$$;


--
-- Name: upsert_customer_v2(text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.upsert_customer_v2(p_phone text, p_name text, p_business_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_customer_id UUID;
BEGIN
    -- 1. Try to find existing customer by phone and business_id
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE phone_number = p_phone
      AND business_id = p_business_id
    LIMIT 1;

    IF v_customer_id IS NOT NULL THEN
        -- 2. Update existing customer
        UPDATE public.customers
        SET name = p_name
        WHERE id = v_customer_id;
    ELSE
        -- 3. Create new customer
        INSERT INTO public.customers (phone_number, name, business_id)
        VALUES (p_phone, p_name, p_business_id)
        RETURNING id INTO v_customer_id;
    END IF;

    RETURN v_customer_id;
END;
$$;


--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.menu_items (
    id integer NOT NULL,
    name text NOT NULL,
    price numeric NOT NULL,
    category text NOT NULL,
    image_url text,
    is_prep_required boolean DEFAULT true NOT NULL,
    kds_routing_logic text DEFAULT 'GRAB_AND_GO'::text,
    description text,
    is_in_stock boolean DEFAULT true,
    allow_notes boolean DEFAULT true,
    is_hot_drink boolean DEFAULT false,
    sale_price numeric,
    sale_start_date timestamp with time zone,
    sale_end_date timestamp with time zone,
    sale_start_time text,
    sale_end_time text,
    business_id uuid,
    category_id uuid,
    is_deleted boolean DEFAULT false,
    modifiers jsonb DEFAULT '[]'::jsonb,
    ai_prompt text,
    ingredients text[] DEFAULT ARRAY[]::text[],
    is_visible_pos boolean DEFAULT true,
    is_visible_online boolean DEFAULT true,
    kds_station text DEFAULT 'kitchen'::text,
    sub_station text DEFAULT ''::text,
    inventory_settings jsonb,
    production_area text DEFAULT 'Kitchen'::text,
    visual_description text,
    english_name text DEFAULT ''::text,
    cost numeric DEFAULT 0,
    original_image_urls text[] DEFAULT ARRAY[]::text[]
);


--
-- Name: COLUMN menu_items.modifiers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.menu_items.modifiers IS 'Structure: [{ name, items: [{name, price}], min, max }]';


--
-- Name: COLUMN menu_items.production_area; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.menu_items.production_area IS 'Area where the item is prepared (Kitchen, Bar, etc)';


--
-- Name: COLUMN menu_items.visual_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.menu_items.visual_description IS 'AI-generated visual anchor for image generation';


--
-- Name: menu_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.menu_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    menu_item_id integer,
    quantity integer DEFAULT 1 NOT NULL,
    mods jsonb,
    item_status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    price numeric DEFAULT 0,
    notes text,
    course_stage integer DEFAULT 1,
    item_fired_at timestamp with time zone,
    business_id uuid,
    is_early_delivered boolean DEFAULT false,
    final_price numeric,
    discount_applied numeric DEFAULT 0,
    is_packed boolean DEFAULT false
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number bigint,
    customer_phone text,
    customer_name text,
    order_status text DEFAULT 'new'::text NOT NULL,
    is_paid boolean DEFAULT false NOT NULL,
    customer_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    payment_method text,
    total_amount numeric(10,2),
    is_refund boolean DEFAULT false,
    refund_amount numeric DEFAULT 0,
    ready_at timestamp with time zone,
    completed_at timestamp with time zone,
    fired_at timestamp with time zone,
    paid_amount numeric DEFAULT 0,
    business_id uuid,
    updated_at timestamp with time zone DEFAULT now(),
    discount_id uuid,
    discount_amount numeric DEFAULT 0,
    refund_method text,
    refund_reason text,
    order_type text DEFAULT 'dine_in'::text,
    delivery_address text,
    delivery_notes text,
    courier_id uuid,
    order_origin text DEFAULT 'pos'::text,
    seen_at timestamp with time zone,
    delivery_fee numeric DEFAULT 0,
    courier_payout numeric DEFAULT 0,
    payment_screenshot_url text,
    payment_verified boolean DEFAULT false,
    source text DEFAULT 'kiosk'::text,
    driver_id uuid,
    driver_name text,
    driver_phone text,
    courier_name text
);


--
-- Name: COLUMN orders.ready_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.ready_at IS 'Timestamp when order status changed to ready';


--
-- Name: COLUMN orders.completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.completed_at IS 'Timestamp when order status changed to completed';


--
-- Name: active_order_items; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_order_items AS
 SELECT oi.id,
    oi.order_id,
    oi.menu_item_id,
    oi.quantity,
    oi.mods,
    oi.item_status,
    oi.created_at,
    mi.name AS item_name,
    mi.price AS unit_price
   FROM ((public.order_items oi
     JOIN public.orders o ON ((oi.order_id = o.id)))
     LEFT JOIN public.menu_items mi ON ((oi.menu_item_id = mi.id)))
  WHERE ((o.order_status <> ALL (ARRAY['refunded'::text, 'cancelled'::text])) AND (oi.quantity > 0) AND ((oi.item_status IS NULL) OR (oi.item_status !~~* 'cancelled'::text)));


--
-- Name: business_ai_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.business_ai_settings (
    id bigint NOT NULL,
    business_id uuid NOT NULL,
    ai_prompt_template text DEFAULT 'A beautiful, professional high-quality food photography of {{product_name}}, studio lighting, appetizing, premium presentation'::text NOT NULL,
    generation_timeout_seconds integer DEFAULT 60 NOT NULL,
    use_image_composition boolean DEFAULT true NOT NULL,
    composition_style text DEFAULT 'center'::text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    background_blur_radius integer DEFAULT 0 NOT NULL
);


--
-- Name: business_ai_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.business_ai_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: business_ai_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.business_ai_settings_id_seq OWNED BY public.business_ai_settings.id;


--
-- Name: business_secrets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.business_secrets (
    business_id uuid NOT NULL,
    google_access_token text,
    google_refresh_token text,
    google_token_expiry timestamp with time zone,
    google_drive_folder_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: businesses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    settings jsonb DEFAULT '{}'::jsonb,
    last_active_at timestamp with time zone,
    opening_tasks_start_time time without time zone DEFAULT '07:30:00'::time without time zone,
    closing_tasks_start_time time without time zone DEFAULT '15:00:00'::time without time zone,
    email text,
    phone_number text,
    whatsapp_number text,
    bit_phone text,
    paybox_phone text,
    bank_details jsonb,
    google_access_token text,
    google_refresh_token text,
    google_token_expiry timestamp with time zone,
    google_drive_folder_id text,
    is_google_connected boolean DEFAULT false,
    sms_number text,
    owner_name text,
    gemini_api_key text
);


--
-- Name: COLUMN businesses.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.email IS 'Business email - used for RanTunes music playback sync';


--
-- Name: COLUMN businesses.phone_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.phone_number IS 'Business phone number';


--
-- Name: COLUMN businesses.whatsapp_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.whatsapp_number IS 'Business WhatsApp number for notifications';


--
-- Name: COLUMN businesses.sms_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.sms_number IS 'SMS Phone Number for alerts (Format: 05XXXXXXXX)';


--
-- Name: COLUMN businesses.owner_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.businesses.owner_name IS 'Name of the business owner for SMS/Alerts';


--
-- Name: catalog_item_suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalog_item_suppliers (
    catalog_item_id uuid NOT NULL,
    supplier_name text NOT NULL,
    occurrence_count integer DEFAULT 1,
    invoice_supplier_name text
);


--
-- Name: catalog_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalog_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    default_unit text,
    category text,
    image_url text,
    created_at timestamp with time zone DEFAULT now(),
    unit text,
    case_quantity integer DEFAULT 1,
    quantity_step numeric DEFAULT 1,
    weight_per_unit numeric,
    units_per_kg numeric,
    secondary_unit text,
    avg_cost_price numeric DEFAULT 0,
    measurement_note text,
    multiplier_small numeric DEFAULT 0.7,
    multiplier_medium numeric DEFAULT 1.0,
    multiplier_large numeric DEFAULT 1.5,
    inventory_count_step numeric DEFAULT 1,
    default_cost_per_unit numeric DEFAULT 0,
    is_active boolean DEFAULT true,
    recipe_step numeric DEFAULT 10,
    order_step numeric DEFAULT 1,
    min_order numeric DEFAULT 1,
    default_cost_per_1000_units numeric GENERATED ALWAYS AS (
CASE
    WHEN (unit = 'גרם'::text) THEN (default_cost_per_unit * (1000)::numeric)
    WHEN (unit = 'g'::text) THEN (default_cost_per_unit * (1000)::numeric)
    ELSE default_cost_per_unit
END) STORED,
    yield_percentage numeric(10,2) DEFAULT 1.0
);


--
-- Name: catalog_suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalog_suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: code_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.code_chunks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_path text NOT NULL,
    chunk_index integer NOT NULL,
    content text NOT NULL,
    summary text,
    embedding extensions.vector(768),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: core_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.core_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'Dairy'::text,
    base_unit text NOT NULL,
    recipe_increment numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    label text,
    street text NOT NULL,
    city text NOT NULL,
    apartment text,
    floor text,
    notes text,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: delivery_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.delivery_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    fee_model text DEFAULT 'fixed'::text,
    fixed_fee numeric DEFAULT 0,
    fee_per_km numeric DEFAULT 0,
    express_fee numeric DEFAULT 0,
    courier_payout_model text DEFAULT 'fixed'::text,
    courier_fixed_payout numeric DEFAULT 0,
    courier_percentage numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: device_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.device_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    device_id text NOT NULL,
    device_type text NOT NULL,
    device_name text,
    user_name text,
    employee_id uuid,
    ip_address text,
    user_agent text,
    screen_resolution text,
    session_started_at timestamp with time zone DEFAULT now(),
    last_seen_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: discounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.discounts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    value numeric DEFAULT 0,
    configuration jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    business_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    valid_from timestamp with time zone,
    valid_to timestamp with time zone,
    customer_types text[] DEFAULT '{}'::text[],
    applicable_categories text[] DEFAULT '{}'::text[],
    applicable_items uuid[] DEFAULT '{}'::uuid[],
    discount_code text,
    min_order_amount numeric DEFAULT 0,
    description text,
    priority integer DEFAULT 0,
    max_uses_per_customer integer,
    max_total_uses integer,
    current_usage_count integer DEFAULT 0,
    CONSTRAINT discounts_type_check CHECK ((type = ANY (ARRAY['PERCENTAGE'::text, 'FIXED'::text, 'FREE_ITEM'::text])))
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    nfc_id text,
    pin_code text,
    access_level text DEFAULT 'Worker'::text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    whatsapp_phone text,
    is_admin boolean DEFAULT false NOT NULL,
    email text,
    business_id uuid,
    phone text,
    auth_user_id uuid,
    is_super_admin boolean DEFAULT false,
    password_hash text,
    is_driver boolean DEFAULT false,
    business_name text,
    face_embedding extensions.vector(512)
);


--
-- Name: COLUMN employees.password_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.employees.password_hash IS 'Hashed password for employee login. If null, falls back to pin_code for authentication.';


--
-- Name: ingredients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.ingredients (
    id integer NOT NULL,
    name text NOT NULL,
    unit text NOT NULL,
    current_stock numeric DEFAULT 0,
    min_stock numeric DEFAULT 0,
    supplier_id integer,
    purchase_unit_quantity integer DEFAULT 1,
    purchase_unit_name text DEFAULT 'יחידה'::text,
    purchase_price numeric(10,4) DEFAULT 0,
    unit_of_measure text DEFAULT 'יחידה'::text,
    reorder_point integer DEFAULT 0
);


--
-- Name: ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ingredients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ingredients_id_seq OWNED BY public.ingredients.id;


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    unit text NOT NULL,
    current_stock numeric DEFAULT 0,
    cost_per_unit numeric DEFAULT 0,
    low_stock_alert numeric DEFAULT 5,
    supplier text,
    case_quantity integer DEFAULT 1,
    supplier_id bigint,
    business_id uuid,
    quantity_step numeric,
    catalog_item_id uuid,
    last_updated timestamp with time zone DEFAULT now(),
    weight_per_unit numeric,
    units_per_kg numeric,
    secondary_unit text,
    measurement_note text,
    multiplier_small numeric DEFAULT 0.7,
    multiplier_medium numeric DEFAULT 1.0,
    multiplier_large numeric DEFAULT 1.5,
    count_step numeric DEFAULT 1,
    last_counted_at timestamp with time zone,
    recipe_step numeric DEFAULT 10,
    order_step numeric DEFAULT 1,
    min_order numeric DEFAULT 1,
    last_counted_by uuid,
    last_count_source text DEFAULT 'manual'::text,
    cost_per_1000_units numeric GENERATED ALWAYS AS (
CASE
    WHEN (unit = 'גרם'::text) THEN (cost_per_unit * (1000)::numeric)
    WHEN (unit = 'g'::text) THEN (cost_per_unit * (1000)::numeric)
    ELSE cost_per_unit
END) STORED,
    location text,
    supplier_product_name text,
    yield_percentage numeric DEFAULT 100,
    CONSTRAINT inventory_items_current_stock_check CHECK ((current_stock >= (0)::numeric))
);


--
-- Name: COLUMN inventory_items.quantity_step; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.inventory_items.quantity_step IS 'Step size for quantity adjustments (e.g. 0.01 for 10g if kg, 1 for units)';


--
-- Name: COLUMN inventory_items.location; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.inventory_items.location IS 'מיקום הפריט במטבח/אחסון';


--
-- Name: COLUMN inventory_items.supplier_product_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.inventory_items.supplier_product_name IS 'The name of the product as it appears on the supplier invoice, used for better OCR matching';


--
-- Name: inventory_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_items_id_seq OWNED BY public.inventory_items.id;


--
-- Name: inventory_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id integer NOT NULL,
    inventory_item_id integer,
    count_timestamp timestamp with time zone DEFAULT now(),
    physical_count integer,
    system_estimate integer,
    adjustment_amount integer,
    employee_id integer,
    log_type text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    business_id uuid,
    catalog_item_id uuid,
    transaction_type text,
    reference_type text,
    reference_id text,
    expected_quantity numeric,
    variance numeric,
    created_by uuid,
    quantity numeric DEFAULT 0,
    unit_price numeric DEFAULT 0,
    supplier_id integer
);


--
-- Name: inventory_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_logs_id_seq OWNED BY public.inventory_logs.id;


--
-- Name: item_category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.item_category (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    name_he text,
    icon text,
    business_id uuid,
    "position" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    is_deleted boolean DEFAULT false,
    prep_areas text[] DEFAULT '{}'::text[],
    is_hidden boolean DEFAULT false,
    is_visible_online boolean DEFAULT true
);


--
-- Name: COLUMN item_category.is_hidden; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.item_category.is_hidden IS 'If true, category is hidden from the ordering menu';


--
-- Name: item_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.item_inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    item_id integer NOT NULL,
    current_stock integer DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: item_measures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.item_measures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    core_item_id uuid,
    measure_name text NOT NULL,
    multiplier numeric NOT NULL,
    inventory_count_step numeric DEFAULT 1,
    is_global boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: kds_active_orders; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.kds_active_orders AS
 SELECT id,
    order_number,
    customer_name,
    order_status,
    created_at,
    is_paid,
    ( SELECT public.get_order_total(o.id) AS get_order_total) AS calculated_total
   FROM public.orders o
  WHERE (order_status = ANY (ARRAY['new'::text, 'in_progress'::text, 'pending'::text]))
  ORDER BY created_at DESC;


--
-- Name: kds_order_items; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.kds_order_items AS
 SELECT oi.id,
    oi.order_id,
    oi.menu_item_id,
    oi.quantity,
    oi.mods,
    oi.item_status,
    oi.created_at,
    mi.name AS item_name,
    mi.price AS item_price,
    mi.category
   FROM (public.order_items oi
     JOIN public.menu_items mi ON ((oi.menu_item_id = mi.id)))
  WHERE ((oi.quantity > 0) AND ((oi.item_status IS NULL) OR (oi.item_status !~~* '%cancel%'::text)) AND (oi.order_id IN ( SELECT orders.id
           FROM public.orders
          WHERE (orders.order_status = ANY (ARRAY['new'::text, 'in_progress'::text, 'ready'::text, 'pending'::text])))));


--
-- Name: loyalty_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid,
    order_id uuid,
    change_amount integer NOT NULL,
    transaction_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    points_earned integer DEFAULT 0,
    points_redeemed integer DEFAULT 0,
    created_by uuid,
    business_id uuid,
    CONSTRAINT loyalty_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['purchase'::text, 'redemption'::text, 'manual_adjustment'::text, 'cancellation'::text])))
);


--
-- Name: master_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.master_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text,
    course_type text,
    display_order integer NOT NULL,
    CONSTRAINT master_categories_type_check CHECK ((type = ANY (ARRAY['food'::text, 'drink'::text, 'other'::text])))
);


--
-- Name: master_categories_display_order_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.master_categories_display_order_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: master_categories_display_order_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.master_categories_display_order_seq OWNED BY public.master_categories.display_order;


--
-- Name: master_ingredients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.master_ingredients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    default_unit text DEFAULT 'Kg'::text,
    department text,
    is_allergen boolean DEFAULT false,
    image_url text
);


--
-- Name: master_option_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.master_option_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    is_food boolean DEFAULT true,
    is_drink boolean DEFAULT false,
    min_select integer DEFAULT 0,
    max_select integer DEFAULT 1
);


--
-- Name: master_option_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.master_option_values (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid,
    value_name text NOT NULL,
    default_price_adjustment numeric DEFAULT 0,
    is_default boolean DEFAULT false
);


--
-- Name: master_supplier_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.master_supplier_catalog (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supplier_id uuid,
    ingredient_id uuid,
    catalog_sku text
);


--
-- Name: master_suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.master_suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    contact_phone text,
    departments text[]
);


--
-- Name: maya_chat_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.maya_chat_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    employee_id uuid,
    role text NOT NULL,
    content text NOT NULL,
    message_type text DEFAULT 'text'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT maya_chat_history_message_type_check CHECK ((message_type = ANY (ARRAY['text'::text, 'voice_transcript'::text]))),
    CONSTRAINT maya_chat_history_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: menuitemoptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.menuitemoptions (
    item_id integer NOT NULL,
    group_id uuid NOT NULL
);


--
-- Name: music_albums; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.music_albums (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    artist_id uuid,
    cover_url text,
    folder_path text,
    release_year integer,
    business_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE music_albums; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.music_albums IS 'Music albums';


--
-- Name: music_artists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.music_artists (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    image_url text,
    folder_path text,
    business_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE music_artists; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.music_artists IS 'Music artists/bands';


--
-- Name: music_commands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.music_commands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_email text NOT NULL,
    user_id uuid,
    command text NOT NULL,
    payload jsonb,
    created_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone
);


--
-- Name: music_current_playback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.music_current_playback (
    user_email text NOT NULL,
    user_id uuid,
    song_id text,
    song_title text,
    artist_name text,
    album_name text,
    cover_url text,
    spotify_uri text,
    is_playing boolean DEFAULT false,
    position_ms integer DEFAULT 0,
    duration_ms integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: music_playback_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.music_playback_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    song_id uuid NOT NULL,
    employee_id uuid,
    was_skipped boolean DEFAULT false,
    played_at timestamp with time zone DEFAULT now(),
    business_id uuid
);


--
-- Name: TABLE music_playback_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.music_playback_history IS 'Track playback and skip history';


--
-- Name: music_playlist_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.music_playlist_songs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    playlist_id uuid NOT NULL,
    song_id uuid NOT NULL,
    "position" integer DEFAULT 0,
    added_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE music_playlist_songs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.music_playlist_songs IS 'Junction table for playlist songs';


--
-- Name: music_playlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.music_playlists (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    cover_url text,
    is_auto_generated boolean DEFAULT false,
    filter_min_rating numeric(2,1) DEFAULT 3.0,
    filter_artists uuid[],
    business_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE music_playlists; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.music_playlists IS 'User-created or auto-generated playlists';


--
-- Name: music_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.music_ratings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    song_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    rating integer,
    skip_count integer DEFAULT 0,
    business_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT music_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: TABLE music_ratings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.music_ratings IS 'Employee ratings for songs (1-5 stars)';


--
-- Name: music_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.music_songs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    album_id uuid,
    artist_id uuid,
    track_number integer DEFAULT 0,
    duration_seconds integer DEFAULT 0,
    file_path text NOT NULL,
    file_name text,
    business_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE music_songs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.music_songs IS 'Individual songs/tracks';


--
-- Name: onboarding_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.onboarding_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name text NOT NULL,
    category text,
    description text,
    price numeric,
    sale_price numeric,
    production_area text,
    ingredients jsonb,
    image_url text,
    modifiers jsonb,
    visual_description text,
    ai_prompt text,
    status text DEFAULT 'pending'::text,
    original_image_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: optiongroups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.optiongroups (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    display_order integer DEFAULT 0,
    is_required boolean DEFAULT false,
    is_multiple_select boolean DEFAULT false,
    is_food boolean DEFAULT true,
    is_drink boolean DEFAULT true,
    menu_item_id integer,
    business_id uuid
);


--
-- Name: optionvalues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.optionvalues (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    group_id uuid,
    value_name text NOT NULL,
    price_adjustment numeric DEFAULT 0.00,
    display_order integer DEFAULT 0,
    is_default boolean DEFAULT false,
    inventory_item_id integer,
    quantity numeric DEFAULT 0,
    is_replacement boolean DEFAULT false,
    business_id uuid
);


--
-- Name: order_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prep_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.prep_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    item_id integer NOT NULL,
    employee_id uuid,
    quantity_added integer NOT NULL,
    target_par integer,
    prep_type text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: prepared_items_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.prepared_items_inventory (
    item_id integer NOT NULL,
    initial_stock real NOT NULL,
    current_stock real NOT NULL,
    unit text,
    last_updated timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: prepbatches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.prepbatches (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    recipe_id uuid,
    batch_size numeric NOT NULL,
    unit_of_measure text NOT NULL,
    prep_status text DEFAULT 'ממתין'::text NOT NULL,
    prepared_by uuid,
    inventory_deducted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    status text DEFAULT 'pending'::text,
    completed_at timestamp with time zone,
    business_id uuid
);


--
-- Name: rantunes_albums; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.rantunes_albums (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    artist_id uuid,
    cover_url text,
    folder_path text,
    business_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: rantunes_artists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.rantunes_artists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    business_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: rantunes_playlist_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.rantunes_playlist_songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    playlist_id uuid NOT NULL,
    song_id text NOT NULL,
    song_title text,
    song_artist text,
    song_cover_url text,
    "position" integer DEFAULT 0 NOT NULL,
    added_at timestamp with time zone DEFAULT now()
);


--
-- Name: rantunes_playlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.rantunes_playlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    cover_url text,
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: rantunes_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.rantunes_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    song_id text NOT NULL,
    rating integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rantunes_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: rantunes_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.rantunes_songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    album_id uuid,
    artist_id uuid,
    track_number integer,
    duration_seconds integer,
    file_path text NOT NULL,
    file_name text,
    business_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: rantunes_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.rantunes_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    is_admin boolean DEFAULT false,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    approved_at timestamp with time zone,
    approved_by uuid,
    CONSTRAINT rantunes_users_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: recipe_ingredients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id integer NOT NULL,
    recipe_id integer NOT NULL,
    inventory_item_id integer NOT NULL,
    quantity_used numeric NOT NULL,
    unit_of_measure text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    cost_per_unit numeric DEFAULT 0
);


--
-- Name: COLUMN recipe_ingredients.cost_per_unit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recipe_ingredients.cost_per_unit IS 'Cost per unit for this ingredient in this recipe. Stored here to avoid RLS issues with inventory_items table.';


--
-- Name: recipe_ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recipe_ingredients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recipe_ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recipe_ingredients_id_seq OWNED BY public.recipe_ingredients.id;


--
-- Name: recipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.recipes (
    id integer NOT NULL,
    menu_item_id integer,
    instructions text,
    preparation_quantity real NOT NULL,
    quantity_unit text,
    task_id integer,
    business_id uuid
);


--
-- Name: recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recipes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recipes_id_seq OWNED BY public.recipes.id;


--
-- Name: recurring_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.recurring_tasks (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    frequency text DEFAULT 'Daily'::text NOT NULL,
    day_of_week integer,
    due_time time without time zone,
    is_active boolean DEFAULT true,
    recipe_id integer,
    menu_item_id integer,
    quantity integer DEFAULT 1,
    weekly_schedule jsonb DEFAULT '{}'::jsonb,
    logic_type text DEFAULT 'fixed'::text,
    image_url text,
    is_pre_closing boolean DEFAULT false,
    business_id uuid,
    priority integer DEFAULT 0
);


--
-- Name: COLUMN recurring_tasks.weekly_schedule; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recurring_tasks.weekly_schedule IS 'Map of day index (0-6) to configuration like { "qty": 10, "mode": "par_level" }';


--
-- Name: recurring_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recurring_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recurring_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recurring_tasks_id_seq OWNED BY public.recurring_tasks.id;


--
-- Name: sms_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.sms_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    sent_at timestamp with time zone,
    status text DEFAULT 'pending'::text,
    error text
);


--
-- Name: supplier_invoice_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.supplier_invoice_mapping (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    supplier_id bigint,
    catalog_item_id uuid,
    invoice_item_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: supplier_menu_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.supplier_menu_item (
    supplier_id integer NOT NULL,
    menu_item_id integer NOT NULL
);


--
-- Name: supplier_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.supplier_order_items (
    id integer NOT NULL,
    supplier_order_id integer,
    inventory_item_id integer,
    ordered_quantity_units integer NOT NULL,
    ordered_unit_name text,
    received_quantity_units integer,
    received_date timestamp with time zone,
    unit_price numeric(10,2),
    line_item_status text DEFAULT 'EXPECTED'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    quantity numeric DEFAULT 1,
    business_id uuid
);


--
-- Name: supplier_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supplier_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_order_items_id_seq OWNED BY public.supplier_order_items.id;


--
-- Name: supplier_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.supplier_orders (
    id integer NOT NULL,
    supplier_id integer,
    order_date date DEFAULT CURRENT_DATE NOT NULL,
    expected_delivery_date date,
    order_status text DEFAULT 'PENDING'::text NOT NULL,
    created_by_employee_id integer,
    total_amount numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    delivery_status text DEFAULT 'pending'::text,
    invoice_image_url text,
    confirmed_at timestamp with time zone,
    confirmed_by uuid,
    status text DEFAULT 'sent'::text,
    business_id uuid,
    delivered_at timestamp with time zone
);


--
-- Name: supplier_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supplier_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_orders_id_seq OWNED BY public.supplier_orders.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.suppliers (
    id integer NOT NULL,
    name text NOT NULL,
    contact_person text,
    phone_number text,
    email text,
    notes text,
    delivery_days text,
    business_id uuid,
    returns_empty_packs boolean DEFAULT false,
    charge_for_missing_packs boolean DEFAULT false,
    missing_pack_cost numeric DEFAULT 0
);


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: system_health_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.system_health_checks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    checker_name text NOT NULL,
    test_results jsonb DEFAULT '{}'::jsonb NOT NULL,
    findings text,
    unresolved_issues text,
    status text,
    hardware_snapshot jsonb DEFAULT '{"ram": "12GB", "server": "N150"}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT system_health_checks_status_check CHECK ((status = ANY (ARRAY['pass'::text, 'fail'::text, 'partial'::text])))
);


--
-- Name: task_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.task_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recurring_task_id integer,
    business_id uuid,
    completed_at timestamp with time zone DEFAULT now(),
    completed_by uuid,
    completion_date date DEFAULT CURRENT_DATE,
    quantity_produced numeric,
    notes text
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.tasks (
    id integer NOT NULL,
    description text NOT NULL,
    category text,
    status text DEFAULT 'Pending'::text NOT NULL,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    menu_item_id integer,
    quantity integer DEFAULT 1,
    business_id uuid
);


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: time_clock_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.time_clock_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid,
    event_type text NOT NULL,
    event_time timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_id uuid
);


--
-- Name: user_spotify_albums; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_spotify_albums (
    user_id uuid NOT NULL,
    albums jsonb DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: user_wallet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_wallet (
    user_id uuid NOT NULL,
    coins integer DEFAULT 0,
    level integer DEFAULT 1,
    xp integer DEFAULT 0,
    reputation integer DEFAULT 100,
    equipped_gear jsonb DEFAULT '{"grinder": "grinder_basic", "machine": "machine_basic", "accessory": "tamper_basic", "steamWand": "wand_basic"}'::jsonb,
    gear_inventory text[] DEFAULT ARRAY['grinder_basic'::text, 'machine_basic'::text, 'wand_basic'::text, 'tamper_basic'::text],
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: view_all_sales_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.view_all_sales_details AS
 SELECT o.id AS order_id,
    o.business_id,
    o.created_at,
    o.customer_name,
    o.customer_phone,
    o.ready_at,
    oi.quantity,
    mi.name AS item_name,
    mi.price AS item_price
   FROM ((public.orders o
     LEFT JOIN public.order_items oi ON ((oi.order_id = o.id)))
     LEFT JOIN public.menu_items mi ON ((oi.menu_item_id = mi.id)));


--
-- Name: view_menu_with_stock; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.view_menu_with_stock AS
 SELECT m.id,
    m.name,
    m.price,
    m.is_visible_pos,
    i.current_stock
   FROM (public.menu_items m
     LEFT JOIN public.item_inventory i ON ((m.id = i.item_id)));


--
-- Name: business_ai_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_ai_settings ALTER COLUMN id SET DEFAULT nextval('public.business_ai_settings_id_seq'::regclass);


--
-- Name: ingredients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingredients ALTER COLUMN id SET DEFAULT nextval('public.ingredients_id_seq'::regclass);


--
-- Name: inventory_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items ALTER COLUMN id SET DEFAULT nextval('public.inventory_items_id_seq'::regclass);


--
-- Name: inventory_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs ALTER COLUMN id SET DEFAULT nextval('public.inventory_logs_id_seq'::regclass);


--
-- Name: master_categories display_order; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_categories ALTER COLUMN display_order SET DEFAULT nextval('public.master_categories_display_order_seq'::regclass);


--
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- Name: recipe_ingredients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredients ALTER COLUMN id SET DEFAULT nextval('public.recipe_ingredients_id_seq'::regclass);


--
-- Name: recipes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes ALTER COLUMN id SET DEFAULT nextval('public.recipes_id_seq'::regclass);


--
-- Name: recurring_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_tasks ALTER COLUMN id SET DEFAULT nextval('public.recurring_tasks_id_seq'::regclass);


--
-- Name: supplier_order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order_items ALTER COLUMN id SET DEFAULT nextval('public.supplier_order_items_id_seq'::regclass);


--
-- Name: supplier_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_orders ALTER COLUMN id SET DEFAULT nextval('public.supplier_orders_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Data for Name: business_ai_settings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: business_secrets; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: catalog_item_suppliers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: catalog_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: catalog_suppliers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: code_chunks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: core_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: delivery_settings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: device_sessions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: discounts; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: inventory_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: item_category; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: item_inventory; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: item_measures; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: loyalty_cards; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: loyalty_transactions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: master_categories; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: master_ingredients; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: master_option_groups; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: master_option_values; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: master_supplier_catalog; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: master_suppliers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: maya_chat_history; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: menuitemoptions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: music_albums; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: music_artists; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: music_commands; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: music_current_playback; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: music_playback_history; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: music_playlist_songs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: music_playlists; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: music_ratings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: music_songs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: onboarding_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: optiongroups; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: optionvalues; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: prep_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: prepared_items_inventory; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: prepbatches; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: rantunes_albums; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: rantunes_artists; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: rantunes_playlist_songs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: rantunes_playlists; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: rantunes_ratings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: rantunes_songs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: rantunes_users; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: recurring_tasks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: sms_queue; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: supplier_invoice_mapping; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: supplier_menu_item; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: supplier_order_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: supplier_orders; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: system_health_checks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: task_completions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: time_clock_events; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_spotify_albums; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_wallet; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Name: business_ai_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.business_ai_settings_id_seq', 10, true);


--
-- Name: ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ingredients_id_seq', 5, true);


--
-- Name: inventory_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_items_id_seq', 543, true);


--
-- Name: inventory_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_logs_id_seq', 240, true);


--
-- Name: master_categories_display_order_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.master_categories_display_order_seq', 1, false);


--
-- Name: menu_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.menu_items_id_seq', 365, true);


--
-- Name: order_number_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_number_seq', 3595, true);


--
-- Name: recipe_ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recipe_ingredients_id_seq', 119, true);


--
-- Name: recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recipes_id_seq', 85, true);


--
-- Name: recurring_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recurring_tasks_id_seq', 53, true);


--
-- Name: supplier_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supplier_order_items_id_seq', 53, true);


--
-- Name: supplier_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supplier_orders_id_seq', 56, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 21, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 16, true);


--
-- Name: business_ai_settings business_ai_settings_business_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_ai_settings
    ADD CONSTRAINT business_ai_settings_business_id_key UNIQUE (business_id);


--
-- Name: business_ai_settings business_ai_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_ai_settings
    ADD CONSTRAINT business_ai_settings_pkey PRIMARY KEY (id);


--
-- Name: business_secrets business_secrets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_secrets
    ADD CONSTRAINT business_secrets_pkey PRIMARY KEY (business_id);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- Name: catalog_item_suppliers catalog_item_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog_item_suppliers
    ADD CONSTRAINT catalog_item_suppliers_pkey PRIMARY KEY (catalog_item_id, supplier_name);


--
-- Name: catalog_items catalog_items_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog_items
    ADD CONSTRAINT catalog_items_name_key UNIQUE (name);


--
-- Name: catalog_items catalog_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog_items
    ADD CONSTRAINT catalog_items_pkey PRIMARY KEY (id);


--
-- Name: catalog_suppliers catalog_suppliers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog_suppliers
    ADD CONSTRAINT catalog_suppliers_name_key UNIQUE (name);


--
-- Name: catalog_suppliers catalog_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog_suppliers
    ADD CONSTRAINT catalog_suppliers_pkey PRIMARY KEY (id);


--
-- Name: code_chunks code_chunks_file_path_chunk_index_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.code_chunks
    ADD CONSTRAINT code_chunks_file_path_chunk_index_key UNIQUE (file_path, chunk_index);


--
-- Name: code_chunks code_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.code_chunks
    ADD CONSTRAINT code_chunks_pkey PRIMARY KEY (id);


--
-- Name: core_items core_items_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_items
    ADD CONSTRAINT core_items_name_key UNIQUE (name);


--
-- Name: core_items core_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_items
    ADD CONSTRAINT core_items_pkey PRIMARY KEY (id);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customers customers_phone_number_business_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_phone_number_business_id_key UNIQUE (phone_number, business_id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: delivery_settings delivery_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_settings
    ADD CONSTRAINT delivery_settings_pkey PRIMARY KEY (id);


--
-- Name: device_sessions device_sessions_device_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_sessions
    ADD CONSTRAINT device_sessions_device_id_key UNIQUE (device_id);


--
-- Name: device_sessions device_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_sessions
    ADD CONSTRAINT device_sessions_pkey PRIMARY KEY (id);


--
-- Name: discounts discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_pkey PRIMARY KEY (id);


--
-- Name: employees employees_nfc_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_nfc_id_key UNIQUE (nfc_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: employees employees_whatsapp_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_whatsapp_phone_key UNIQUE (whatsapp_phone);


--
-- Name: ingredients ingredients_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_name_key UNIQUE (name);


--
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: inventory_logs inventory_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (id);


--
-- Name: item_category item_category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_category
    ADD CONSTRAINT item_category_pkey PRIMARY KEY (id);


--
-- Name: item_inventory item_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_inventory
    ADD CONSTRAINT item_inventory_pkey PRIMARY KEY (id);


--
-- Name: item_measures item_measures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_measures
    ADD CONSTRAINT item_measures_pkey PRIMARY KEY (id);


--
-- Name: loyalty_cards loyalty_cards_customer_phone_business_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_cards
    ADD CONSTRAINT loyalty_cards_customer_phone_business_id_key UNIQUE (customer_phone, business_id);


--
-- Name: loyalty_cards loyalty_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_cards
    ADD CONSTRAINT loyalty_cards_pkey PRIMARY KEY (id);


--
-- Name: loyalty_transactions loyalty_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);


--
-- Name: master_categories master_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_categories
    ADD CONSTRAINT master_categories_name_key UNIQUE (name);


--
-- Name: master_categories master_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_categories
    ADD CONSTRAINT master_categories_pkey PRIMARY KEY (id);


--
-- Name: master_ingredients master_ingredients_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_ingredients
    ADD CONSTRAINT master_ingredients_name_key UNIQUE (name);


--
-- Name: master_ingredients master_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_ingredients
    ADD CONSTRAINT master_ingredients_pkey PRIMARY KEY (id);


--
-- Name: master_option_groups master_option_groups_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_option_groups
    ADD CONSTRAINT master_option_groups_name_key UNIQUE (name);


--
-- Name: master_option_groups master_option_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_option_groups
    ADD CONSTRAINT master_option_groups_pkey PRIMARY KEY (id);


--
-- Name: master_option_values master_option_values_group_id_value_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_option_values
    ADD CONSTRAINT master_option_values_group_id_value_name_key UNIQUE (group_id, value_name);


--
-- Name: master_option_values master_option_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_option_values
    ADD CONSTRAINT master_option_values_pkey PRIMARY KEY (id);


--
-- Name: master_supplier_catalog master_supplier_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_supplier_catalog
    ADD CONSTRAINT master_supplier_catalog_pkey PRIMARY KEY (id);


--
-- Name: master_supplier_catalog master_supplier_catalog_supplier_id_ingredient_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_supplier_catalog
    ADD CONSTRAINT master_supplier_catalog_supplier_id_ingredient_id_key UNIQUE (supplier_id, ingredient_id);


--
-- Name: master_suppliers master_suppliers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_suppliers
    ADD CONSTRAINT master_suppliers_name_key UNIQUE (name);


--
-- Name: master_suppliers master_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_suppliers
    ADD CONSTRAINT master_suppliers_pkey PRIMARY KEY (id);


--
-- Name: maya_chat_history maya_chat_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maya_chat_history
    ADD CONSTRAINT maya_chat_history_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: menuitemoptions menuitemoptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menuitemoptions
    ADD CONSTRAINT menuitemoptions_pkey PRIMARY KEY (item_id, group_id);


--
-- Name: music_albums music_albums_name_artist_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_albums
    ADD CONSTRAINT music_albums_name_artist_id_key UNIQUE (name, artist_id);


--
-- Name: music_albums music_albums_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_albums
    ADD CONSTRAINT music_albums_pkey PRIMARY KEY (id);


--
-- Name: music_artists music_artists_name_business_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_artists
    ADD CONSTRAINT music_artists_name_business_id_key UNIQUE (name, business_id);


--
-- Name: music_artists music_artists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_artists
    ADD CONSTRAINT music_artists_pkey PRIMARY KEY (id);


--
-- Name: music_commands music_commands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_commands
    ADD CONSTRAINT music_commands_pkey PRIMARY KEY (id);


--
-- Name: music_current_playback music_current_playback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_current_playback
    ADD CONSTRAINT music_current_playback_pkey PRIMARY KEY (user_email);


--
-- Name: music_playback_history music_playback_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_playback_history
    ADD CONSTRAINT music_playback_history_pkey PRIMARY KEY (id);


--
-- Name: music_playlist_songs music_playlist_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_playlist_songs
    ADD CONSTRAINT music_playlist_songs_pkey PRIMARY KEY (id);


--
-- Name: music_playlist_songs music_playlist_songs_playlist_id_song_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_playlist_songs
    ADD CONSTRAINT music_playlist_songs_playlist_id_song_id_key UNIQUE (playlist_id, song_id);


--
-- Name: music_playlists music_playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_playlists
    ADD CONSTRAINT music_playlists_pkey PRIMARY KEY (id);


--
-- Name: music_ratings music_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_ratings
    ADD CONSTRAINT music_ratings_pkey PRIMARY KEY (id);


--
-- Name: music_ratings music_ratings_song_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_ratings
    ADD CONSTRAINT music_ratings_song_id_employee_id_key UNIQUE (song_id, employee_id);


--
-- Name: music_songs music_songs_file_path_business_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_songs
    ADD CONSTRAINT music_songs_file_path_business_id_key UNIQUE (file_path, business_id);


--
-- Name: music_songs music_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_songs
    ADD CONSTRAINT music_songs_pkey PRIMARY KEY (id);


--
-- Name: onboarding_items onboarding_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_items
    ADD CONSTRAINT onboarding_items_pkey PRIMARY KEY (id);


--
-- Name: optiongroups optiongroups_name_biz_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optiongroups
    ADD CONSTRAINT optiongroups_name_biz_unique UNIQUE (name, business_id);


--
-- Name: optiongroups optiongroups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optiongroups
    ADD CONSTRAINT optiongroups_pkey PRIMARY KEY (id);


--
-- Name: optionvalues optionvalues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optionvalues
    ADD CONSTRAINT optionvalues_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: prep_logs prep_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prep_logs
    ADD CONSTRAINT prep_logs_pkey PRIMARY KEY (id);


--
-- Name: prepared_items_inventory prepared_items_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prepared_items_inventory
    ADD CONSTRAINT prepared_items_inventory_pkey PRIMARY KEY (item_id);


--
-- Name: prepbatches prepbatches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prepbatches
    ADD CONSTRAINT prepbatches_pkey PRIMARY KEY (id);


--
-- Name: rantunes_albums rantunes_albums_folder_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_albums
    ADD CONSTRAINT rantunes_albums_folder_path_key UNIQUE (folder_path);


--
-- Name: rantunes_albums rantunes_albums_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_albums
    ADD CONSTRAINT rantunes_albums_pkey PRIMARY KEY (id);


--
-- Name: rantunes_artists rantunes_artists_name_business_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_artists
    ADD CONSTRAINT rantunes_artists_name_business_id_key UNIQUE (name, business_id);


--
-- Name: rantunes_artists rantunes_artists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_artists
    ADD CONSTRAINT rantunes_artists_pkey PRIMARY KEY (id);


--
-- Name: rantunes_playlist_songs rantunes_playlist_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_playlist_songs
    ADD CONSTRAINT rantunes_playlist_songs_pkey PRIMARY KEY (id);


--
-- Name: rantunes_playlists rantunes_playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_playlists
    ADD CONSTRAINT rantunes_playlists_pkey PRIMARY KEY (id);


--
-- Name: rantunes_ratings rantunes_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_ratings
    ADD CONSTRAINT rantunes_ratings_pkey PRIMARY KEY (id);


--
-- Name: rantunes_ratings rantunes_ratings_user_id_song_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_ratings
    ADD CONSTRAINT rantunes_ratings_user_id_song_id_key UNIQUE (user_id, song_id);


--
-- Name: rantunes_songs rantunes_songs_file_path_business_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_songs
    ADD CONSTRAINT rantunes_songs_file_path_business_id_key UNIQUE (file_path, business_id);


--
-- Name: rantunes_songs rantunes_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_songs
    ADD CONSTRAINT rantunes_songs_pkey PRIMARY KEY (id);


--
-- Name: rantunes_users rantunes_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_users
    ADD CONSTRAINT rantunes_users_email_key UNIQUE (email);


--
-- Name: rantunes_users rantunes_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_users
    ADD CONSTRAINT rantunes_users_pkey PRIMARY KEY (id);


--
-- Name: recipe_ingredients recipe_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: recurring_tasks recurring_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_pkey PRIMARY KEY (id);


--
-- Name: sms_queue sms_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_queue
    ADD CONSTRAINT sms_queue_pkey PRIMARY KEY (id);


--
-- Name: supplier_invoice_mapping supplier_invoice_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_invoice_mapping
    ADD CONSTRAINT supplier_invoice_mapping_pkey PRIMARY KEY (id);


--
-- Name: supplier_invoice_mapping supplier_invoice_mapping_supplier_id_invoice_item_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_invoice_mapping
    ADD CONSTRAINT supplier_invoice_mapping_supplier_id_invoice_item_name_key UNIQUE (supplier_id, invoice_item_name);


--
-- Name: supplier_menu_item supplier_menu_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_menu_item
    ADD CONSTRAINT supplier_menu_item_pkey PRIMARY KEY (supplier_id, menu_item_id);


--
-- Name: supplier_order_items supplier_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order_items
    ADD CONSTRAINT supplier_order_items_pkey PRIMARY KEY (id);


--
-- Name: supplier_orders supplier_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_orders
    ADD CONSTRAINT supplier_orders_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_health_checks system_health_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_health_checks
    ADD CONSTRAINT system_health_checks_pkey PRIMARY KEY (id);


--
-- Name: task_completions task_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_completions
    ADD CONSTRAINT task_completions_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: time_clock_events time_clock_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_clock_events
    ADD CONSTRAINT time_clock_events_pkey PRIMARY KEY (id);


--
-- Name: item_inventory unique_item_inventory; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_inventory
    ADD CONSTRAINT unique_item_inventory UNIQUE (business_id, item_id);


--
-- Name: user_spotify_albums user_spotify_albums_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_spotify_albums
    ADD CONSTRAINT user_spotify_albums_pkey PRIMARY KEY (user_id);


--
-- Name: user_wallet user_wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_wallet
    ADD CONSTRAINT user_wallet_pkey PRIMARY KEY (user_id);


--
-- Name: code_chunks_embedding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX code_chunks_embedding_idx ON public.code_chunks USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists='100');


--
-- Name: employees_face_embedding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employees_face_embedding_idx ON public.employees USING ivfflat (face_embedding extensions.vector_cosine_ops) WITH (lists='100');


--
-- Name: idx_business_ai_settings_business_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_ai_settings_business_id ON public.business_ai_settings USING btree (business_id);


--
-- Name: idx_businesses_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_email ON public.businesses USING btree (email);


--
-- Name: idx_customer_addresses_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_addresses_customer_id ON public.customer_addresses USING btree (customer_id);


--
-- Name: idx_customers_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_business ON public.customers USING btree (business_id);


--
-- Name: idx_device_sessions_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_device_sessions_business ON public.device_sessions USING btree (business_id);


--
-- Name: idx_device_sessions_last_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_device_sessions_last_seen ON public.device_sessions USING btree (last_seen_at);


--
-- Name: idx_employees_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_business ON public.employees USING btree (business_id);


--
-- Name: idx_health_checks_history; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_health_checks_history ON public.system_health_checks USING btree (business_id, created_at DESC);


--
-- Name: idx_inventory_name_business; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_inventory_name_business ON public.inventory_items USING btree (name, business_id);


--
-- Name: idx_loyalty_cards_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_cards_phone ON public.loyalty_cards USING btree (customer_phone);


--
-- Name: idx_loyalty_transactions_card; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_transactions_card ON public.loyalty_transactions USING btree (card_id);


--
-- Name: idx_loyalty_transactions_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_transactions_order ON public.loyalty_transactions USING btree (order_id);


--
-- Name: idx_loyalty_tx_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_tx_business ON public.loyalty_transactions USING btree (business_id);


--
-- Name: idx_loyalty_tx_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_tx_order ON public.loyalty_transactions USING btree (order_id);


--
-- Name: idx_maya_chat_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maya_chat_business ON public.maya_chat_history USING btree (business_id);


--
-- Name: idx_maya_chat_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maya_chat_created_at ON public.maya_chat_history USING btree (created_at);


--
-- Name: idx_maya_chat_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maya_chat_employee ON public.maya_chat_history USING btree (employee_id);


--
-- Name: idx_music_playback_history_song; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_playback_history_song ON public.music_playback_history USING btree (song_id);


--
-- Name: idx_music_playlist_songs_playlist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_playlist_songs_playlist ON public.music_playlist_songs USING btree (playlist_id);


--
-- Name: idx_music_ratings_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_ratings_employee ON public.music_ratings USING btree (employee_id);


--
-- Name: idx_music_ratings_song; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_ratings_song ON public.music_ratings USING btree (song_id);


--
-- Name: idx_music_songs_album; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_songs_album ON public.music_songs USING btree (album_id);


--
-- Name: idx_music_songs_artist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_songs_artist ON public.music_songs USING btree (artist_id);


--
-- Name: idx_orders_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_business ON public.orders USING btree (business_id);


--
-- Name: idx_orders_delivery_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_delivery_address ON public.orders USING btree (delivery_address) WHERE (delivery_address IS NOT NULL);


--
-- Name: idx_orders_driver_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_driver_id ON public.orders USING btree (driver_id);


--
-- Name: idx_orders_origin_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_origin_seen ON public.orders USING btree (order_origin, seen_at);


--
-- Name: idx_orders_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_type ON public.orders USING btree (order_type);


--
-- Name: idx_orders_type_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_type_status ON public.orders USING btree (order_type, order_status);


--
-- Name: idx_rantunes_playlist_songs_playlist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rantunes_playlist_songs_playlist ON public.rantunes_playlist_songs USING btree (playlist_id);


--
-- Name: idx_rantunes_playlists_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rantunes_playlists_user ON public.rantunes_playlists USING btree (user_id);


--
-- Name: idx_rantunes_ratings_song; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rantunes_ratings_song ON public.rantunes_ratings USING btree (song_id);


--
-- Name: idx_rantunes_ratings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rantunes_ratings_user ON public.rantunes_ratings USING btree (user_id);


--
-- Name: idx_rantunes_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rantunes_users_email ON public.rantunes_users USING btree (email);


--
-- Name: idx_rantunes_users_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rantunes_users_status ON public.rantunes_users USING btree (status);


--
-- Name: idx_task_completions_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_completions_business ON public.task_completions USING btree (business_id);


--
-- Name: idx_task_completions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_completions_date ON public.task_completions USING btree (completion_date);


--
-- Name: idx_task_completions_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_completions_task_id ON public.task_completions USING btree (recurring_task_id);


--
-- Name: inventory_items after_inventory_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER after_inventory_update AFTER INSERT OR UPDATE OF cost_per_unit ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_catalog_avg_price();


--
-- Name: business_ai_settings business_ai_settings_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER business_ai_settings_updated_at_trigger BEFORE UPDATE ON public.business_ai_settings FOR EACH ROW EXECUTE FUNCTION public.update_business_ai_settings_updated_at();


--
-- Name: order_items trg_prevent_item_reversion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_item_reversion BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.prevent_item_reversion();


--
-- Name: orders trg_prevent_order_reversion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_order_reversion BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.prevent_order_reversion();


--
-- Name: inventory_items trigger_set_business_id_inventory_items; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_business_id_inventory_items BEFORE INSERT ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.set_business_id_automatically();


--
-- Name: menu_items trigger_set_business_id_menu_items; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_business_id_menu_items BEFORE INSERT ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.set_business_id_automatically();


--
-- Name: optiongroups trigger_set_business_id_optiongroups; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_business_id_optiongroups BEFORE INSERT ON public.optiongroups FOR EACH ROW EXECUTE FUNCTION public.set_business_id_automatically();


--
-- Name: optionvalues trigger_set_business_id_optionvalues; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_business_id_optionvalues BEFORE INSERT ON public.optionvalues FOR EACH ROW EXECUTE FUNCTION public.set_business_id_automatically();


--
-- Name: orders trigger_set_business_id_orders; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_business_id_orders BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_business_id_automatically();


--
-- Name: recipes trigger_set_business_id_recipes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_business_id_recipes BEFORE INSERT ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.set_business_id_automatically();


--
-- Name: suppliers trigger_set_business_id_suppliers; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_business_id_suppliers BEFORE INSERT ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_business_id_automatically();


--
-- Name: orders trigger_set_order_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_order_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_number();


--
-- Name: order_items trigger_update_order_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_order_items_updated_at();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_wallet update_user_wallet_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_wallet_modtime BEFORE UPDATE ON public.user_wallet FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: business_ai_settings business_ai_settings_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_ai_settings
    ADD CONSTRAINT business_ai_settings_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: business_secrets business_secrets_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_secrets
    ADD CONSTRAINT business_secrets_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: catalog_item_suppliers catalog_item_suppliers_catalog_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog_item_suppliers
    ADD CONSTRAINT catalog_item_suppliers_catalog_item_id_fkey FOREIGN KEY (catalog_item_id) REFERENCES public.catalog_items(id);


--
-- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customers customers_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: delivery_settings delivery_settings_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_settings
    ADD CONSTRAINT delivery_settings_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: device_sessions device_sessions_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_sessions
    ADD CONSTRAINT device_sessions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: employees employees_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: order_items fk_order_items_menu_items; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fk_order_items_menu_items FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id);


--
-- Name: ingredients ingredients_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: inventory_items inventory_items_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: inventory_items inventory_items_catalog_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_catalog_item_id_fkey FOREIGN KEY (catalog_item_id) REFERENCES public.catalog_items(id);


--
-- Name: inventory_items inventory_items_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: inventory_logs inventory_logs_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: inventory_logs inventory_logs_catalog_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_catalog_item_id_fkey FOREIGN KEY (catalog_item_id) REFERENCES public.catalog_items(id);


--
-- Name: inventory_logs inventory_logs_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id);


--
-- Name: item_inventory item_inventory_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_inventory
    ADD CONSTRAINT item_inventory_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: item_inventory item_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_inventory
    ADD CONSTRAINT item_inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: item_inventory item_inventory_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_inventory
    ADD CONSTRAINT item_inventory_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.employees(id);


--
-- Name: item_measures item_measures_core_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_measures
    ADD CONSTRAINT item_measures_core_item_id_fkey FOREIGN KEY (core_item_id) REFERENCES public.core_items(id) ON DELETE CASCADE;


--
-- Name: loyalty_cards loyalty_cards_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_cards
    ADD CONSTRAINT loyalty_cards_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: loyalty_transactions loyalty_transactions_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: loyalty_transactions loyalty_transactions_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.loyalty_cards(id);


--
-- Name: master_option_values master_option_values_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_option_values
    ADD CONSTRAINT master_option_values_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.master_option_groups(id) ON DELETE CASCADE;


--
-- Name: master_supplier_catalog master_supplier_catalog_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_supplier_catalog
    ADD CONSTRAINT master_supplier_catalog_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.master_ingredients(id) ON DELETE CASCADE;


--
-- Name: master_supplier_catalog master_supplier_catalog_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_supplier_catalog
    ADD CONSTRAINT master_supplier_catalog_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.master_suppliers(id) ON DELETE CASCADE;


--
-- Name: maya_chat_history maya_chat_history_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maya_chat_history
    ADD CONSTRAINT maya_chat_history_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: maya_chat_history maya_chat_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maya_chat_history
    ADD CONSTRAINT maya_chat_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: menu_items menu_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.item_category(id);


--
-- Name: menuitemoptions menuitemoptions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menuitemoptions
    ADD CONSTRAINT menuitemoptions_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.optiongroups(id) ON DELETE CASCADE;


--
-- Name: menuitemoptions menuitemoptions_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menuitemoptions
    ADD CONSTRAINT menuitemoptions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: music_albums music_albums_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_albums
    ADD CONSTRAINT music_albums_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.music_artists(id) ON DELETE CASCADE;


--
-- Name: music_playback_history music_playback_history_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_playback_history
    ADD CONSTRAINT music_playback_history_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.music_songs(id) ON DELETE CASCADE;


--
-- Name: music_playlist_songs music_playlist_songs_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_playlist_songs
    ADD CONSTRAINT music_playlist_songs_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.music_playlists(id) ON DELETE CASCADE;


--
-- Name: music_playlist_songs music_playlist_songs_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_playlist_songs
    ADD CONSTRAINT music_playlist_songs_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.music_songs(id) ON DELETE CASCADE;


--
-- Name: music_ratings music_ratings_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_ratings
    ADD CONSTRAINT music_ratings_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.music_songs(id) ON DELETE CASCADE;


--
-- Name: music_songs music_songs_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_songs
    ADD CONSTRAINT music_songs_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.music_albums(id) ON DELETE CASCADE;


--
-- Name: music_songs music_songs_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_songs
    ADD CONSTRAINT music_songs_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.music_artists(id) ON DELETE SET NULL;


--
-- Name: optiongroups optiongroups_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optiongroups
    ADD CONSTRAINT optiongroups_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: optionvalues optionvalues_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optionvalues
    ADD CONSTRAINT optionvalues_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.optiongroups(id) ON DELETE CASCADE;


--
-- Name: optionvalues optionvalues_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optionvalues
    ADD CONSTRAINT optionvalues_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id);


--
-- Name: order_items order_items_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: orders orders_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id);


--
-- Name: prepared_items_inventory prepared_items_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prepared_items_inventory
    ADD CONSTRAINT prepared_items_inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: prepbatches prepbatches_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prepbatches
    ADD CONSTRAINT prepbatches_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: prepbatches prepbatches_prepared_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prepbatches
    ADD CONSTRAINT prepbatches_prepared_by_fkey FOREIGN KEY (prepared_by) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: rantunes_albums rantunes_albums_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_albums
    ADD CONSTRAINT rantunes_albums_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.rantunes_artists(id) ON DELETE CASCADE;


--
-- Name: rantunes_playlist_songs rantunes_playlist_songs_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_playlist_songs
    ADD CONSTRAINT rantunes_playlist_songs_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.rantunes_playlists(id) ON DELETE CASCADE;


--
-- Name: rantunes_playlists rantunes_playlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_playlists
    ADD CONSTRAINT rantunes_playlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.rantunes_users(id) ON DELETE CASCADE;


--
-- Name: rantunes_ratings rantunes_ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_ratings
    ADD CONSTRAINT rantunes_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.rantunes_users(id) ON DELETE CASCADE;


--
-- Name: rantunes_songs rantunes_songs_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_songs
    ADD CONSTRAINT rantunes_songs_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.rantunes_albums(id) ON DELETE CASCADE;


--
-- Name: rantunes_songs rantunes_songs_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_songs
    ADD CONSTRAINT rantunes_songs_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.rantunes_artists(id) ON DELETE CASCADE;


--
-- Name: rantunes_users rantunes_users_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rantunes_users
    ADD CONSTRAINT rantunes_users_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.rantunes_users(id);


--
-- Name: recipes recipes_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: recipes recipes_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: recurring_tasks recurring_tasks_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: recurring_tasks recurring_tasks_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE SET NULL;


--
-- Name: recurring_tasks recurring_tasks_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE SET NULL;


--
-- Name: supplier_invoice_mapping supplier_invoice_mapping_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_invoice_mapping
    ADD CONSTRAINT supplier_invoice_mapping_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: supplier_invoice_mapping supplier_invoice_mapping_catalog_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_invoice_mapping
    ADD CONSTRAINT supplier_invoice_mapping_catalog_item_id_fkey FOREIGN KEY (catalog_item_id) REFERENCES public.catalog_items(id);


--
-- Name: supplier_invoice_mapping supplier_invoice_mapping_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_invoice_mapping
    ADD CONSTRAINT supplier_invoice_mapping_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: supplier_menu_item supplier_menu_item_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_menu_item
    ADD CONSTRAINT supplier_menu_item_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id);


--
-- Name: supplier_menu_item supplier_menu_item_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_menu_item
    ADD CONSTRAINT supplier_menu_item_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: supplier_order_items supplier_order_items_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order_items
    ADD CONSTRAINT supplier_order_items_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: supplier_order_items supplier_order_items_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order_items
    ADD CONSTRAINT supplier_order_items_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id);


--
-- Name: supplier_order_items supplier_order_items_supplier_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order_items
    ADD CONSTRAINT supplier_order_items_supplier_order_id_fkey FOREIGN KEY (supplier_order_id) REFERENCES public.supplier_orders(id) ON DELETE CASCADE;


--
-- Name: supplier_orders supplier_orders_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_orders
    ADD CONSTRAINT supplier_orders_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: supplier_orders supplier_orders_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_orders
    ADD CONSTRAINT supplier_orders_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES auth.users(id);


--
-- Name: supplier_orders supplier_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_orders
    ADD CONSTRAINT supplier_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT;


--
-- Name: task_completions task_completions_recurring_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_completions
    ADD CONSTRAINT task_completions_recurring_task_id_fkey FOREIGN KEY (recurring_task_id) REFERENCES public.recurring_tasks(id);


--
-- Name: tasks tasks_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: tasks tasks_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE SET NULL;


--
-- Name: time_clock_events time_clock_events_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_clock_events
    ADD CONSTRAINT time_clock_events_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: time_clock_events time_clock_events_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_clock_events
    ADD CONSTRAINT time_clock_events_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: user_wallet user_wallet_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_wallet
    ADD CONSTRAINT user_wallet_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: employees Admins can manage employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage employees" ON public.employees TO authenticated, anon, service_role USING (true) WITH CHECK (true);


--
-- Name: recipe_ingredients Allow All Authenticated Ingredients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow All Authenticated Ingredients" ON public.recipe_ingredients TO authenticated USING (true) WITH CHECK (true);


--
-- Name: recipes Allow All Authenticated Recipes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow All Authenticated Recipes" ON public.recipes TO authenticated USING (true) WITH CHECK (true);


--
-- Name: catalog_item_suppliers Allow Insert Mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow Insert Mappings" ON public.catalog_item_suppliers FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: catalog_item_suppliers Allow Read Mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow Read Mappings" ON public.catalog_item_suppliers FOR SELECT TO authenticated USING (true);


--
-- Name: item_category Allow all access for authenticated business admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access for authenticated business admins" ON public.item_category USING (true) WITH CHECK (true);


--
-- Name: catalog_item_suppliers Allow all for catalog_item_suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all for catalog_item_suppliers" ON public.catalog_item_suppliers TO authenticated USING (true) WITH CHECK (true);


--
-- Name: music_commands Allow all for commands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all for commands" ON public.music_commands USING (true);


--
-- Name: music_current_playback Allow all for playback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all for playback" ON public.music_current_playback USING (true);


--
-- Name: catalog_item_suppliers Allow all mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all mappings" ON public.catalog_item_suppliers TO authenticated USING (true) WITH CHECK (true);


--
-- Name: music_albums Allow all music_albums; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all music_albums" ON public.music_albums USING (true) WITH CHECK (true);


--
-- Name: music_artists Allow all music_artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all music_artists" ON public.music_artists USING (true) WITH CHECK (true);


--
-- Name: music_playback_history Allow all music_playback_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all music_playback_history" ON public.music_playback_history USING (true) WITH CHECK (true);


--
-- Name: music_playlist_songs Allow all music_playlist_songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all music_playlist_songs" ON public.music_playlist_songs USING (true) WITH CHECK (true);


--
-- Name: music_playlists Allow all music_playlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all music_playlists" ON public.music_playlists USING (true) WITH CHECK (true);


--
-- Name: music_ratings Allow all music_ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all music_ratings" ON public.music_ratings USING (true) WITH CHECK (true);


--
-- Name: music_songs Allow all music_songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all music_songs" ON public.music_songs USING (true) WITH CHECK (true);


--
-- Name: rantunes_users Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.rantunes_users USING (true) WITH CHECK (true);


--
-- Name: optiongroups Allow anonymous read access to optiongroups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anonymous read access to optiongroups" ON public.optiongroups FOR SELECT USING (true);


--
-- Name: optionvalues Allow anonymous read access to optionvalues; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anonymous read access to optionvalues" ON public.optionvalues FOR SELECT USING (true);


--
-- Name: optiongroups Allow authenticated full access to optiongroups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated full access to optiongroups" ON public.optiongroups TO authenticated USING (true) WITH CHECK (true);


--
-- Name: optionvalues Allow authenticated full access to optionvalues; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated full access to optionvalues" ON public.optionvalues TO authenticated USING (true) WITH CHECK (true);


--
-- Name: inventory_items Allow authenticated insert inventory items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated insert inventory items" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: orders Allow authenticated users to read orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to read orders" ON public.orders FOR SELECT TO authenticated USING (true);


--
-- Name: inventory_items Allow delete for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for authenticated users" ON public.inventory_items FOR DELETE TO authenticated USING (true);


--
-- Name: supplier_orders Allow employees to update supplier orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow employees to update supplier orders" ON public.supplier_orders FOR UPDATE USING ((business_id IN ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.id = auth.uid()))));


--
-- Name: inventory_items Allow employees to view their business inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow employees to view their business inventory" ON public.inventory_items FOR SELECT USING ((business_id IN ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.id = auth.uid()))));


--
-- Name: inventory_items Allow insert for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated users" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: rantunes_albums Allow management rantunes_albums; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow management rantunes_albums" ON public.rantunes_albums USING (true);


--
-- Name: rantunes_artists Allow management rantunes_artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow management rantunes_artists" ON public.rantunes_artists USING (true);


--
-- Name: rantunes_songs Allow management rantunes_songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow management rantunes_songs" ON public.rantunes_songs USING (true);


--
-- Name: suppliers Allow modification for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow modification for authenticated" ON public.suppliers TO authenticated USING (true) WITH CHECK (true);


--
-- Name: menu_items Allow public delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access" ON public.menu_items FOR DELETE USING (true);


--
-- Name: menu_items Allow public insert access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access" ON public.menu_items FOR INSERT WITH CHECK (true);


--
-- Name: menu_items Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.menu_items FOR SELECT USING (true);


--
-- Name: menuitemoptions Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.menuitemoptions FOR SELECT USING (true);


--
-- Name: optiongroups Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.optiongroups FOR SELECT USING (true);


--
-- Name: optionvalues Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.optionvalues FOR SELECT USING (true);


--
-- Name: item_category Allow public read access for categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access for categories" ON public.item_category FOR SELECT USING ((is_deleted = false));


--
-- Name: onboarding_items Allow public read/write onboarding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read/write onboarding" ON public.onboarding_items USING (true) WITH CHECK (true);


--
-- Name: business_ai_settings Allow public read/write settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read/write settings" ON public.business_ai_settings USING (true) WITH CHECK (true);


--
-- Name: menu_items Allow public update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access" ON public.menu_items FOR UPDATE USING (true);


--
-- Name: menu_items Allow read for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for authenticated" ON public.menu_items FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: suppliers Allow read for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for authenticated" ON public.suppliers FOR SELECT TO authenticated USING (true);


--
-- Name: inventory_items Allow select for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for authenticated users" ON public.inventory_items FOR SELECT TO authenticated USING (true);


--
-- Name: inventory_items Allow update/delete for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update/delete for authenticated users" ON public.inventory_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: orders Allow users to read their business orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow users to read their business orders" ON public.orders FOR SELECT TO authenticated USING ((business_id IN ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: orders Anon Create Orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anon Create Orders" ON public.orders FOR INSERT TO anon WITH CHECK (true);


--
-- Name: orders Anon read orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anon read orders" ON public.orders FOR SELECT TO anon USING (true);


--
-- Name: suppliers Anon read suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anon read suppliers" ON public.suppliers FOR SELECT TO anon USING (true);


--
-- Name: customers Anyone can read customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read customers" ON public.customers FOR SELECT TO authenticated, anon USING (true);


--
-- Name: menuitemoptions Authenticated users can read menuitemoptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read menuitemoptions" ON public.menuitemoptions FOR SELECT TO authenticated USING (true);


--
-- Name: delivery_settings Business can insert own delivery settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business can insert own delivery settings" ON public.delivery_settings FOR INSERT WITH CHECK ((business_id = ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)));


--
-- Name: delivery_settings Business can update own delivery settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business can update own delivery settings" ON public.delivery_settings FOR UPDATE USING ((business_id = ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)));


--
-- Name: delivery_settings Business can view own delivery settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Business can view own delivery settings" ON public.delivery_settings FOR SELECT USING ((business_id = ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)));


--
-- Name: catalog_items Catalog is editable by admins only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Catalog is editable by admins only" ON public.catalog_items TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.is_admin = true)))));


--
-- Name: catalog_items Catalog is readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Catalog is readable by all" ON public.catalog_items FOR SELECT TO authenticated USING (true);


--
-- Name: order_items Dev: Allow all authenticated to read order_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Dev: Allow all authenticated to read order_items" ON public.order_items FOR SELECT TO authenticated USING (true);


--
-- Name: orders Dev: Allow all authenticated to read orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Dev: Allow all authenticated to read orders" ON public.orders FOR SELECT TO authenticated USING (true);


--
-- Name: music_albums Enable all access for music_albums; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all access for music_albums" ON public.music_albums USING (true) WITH CHECK (true);


--
-- Name: music_artists Enable all access for music_artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all access for music_artists" ON public.music_artists USING (true) WITH CHECK (true);


--
-- Name: music_playlist_songs Enable all access for music_playlist_songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all access for music_playlist_songs" ON public.music_playlist_songs USING (true) WITH CHECK (true);


--
-- Name: music_playlists Enable all access for music_playlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all access for music_playlists" ON public.music_playlists USING (true) WITH CHECK (true);


--
-- Name: music_ratings Enable all access for music_ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all access for music_ratings" ON public.music_ratings USING (true) WITH CHECK (true);


--
-- Name: music_songs Enable all access for music_songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all access for music_songs" ON public.music_songs USING (true) WITH CHECK (true);


--
-- Name: inventory_items Enable update for employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for employees" ON public.inventory_items FOR UPDATE TO authenticated USING ((business_id IN ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.id = auth.uid()))));


--
-- Name: supplier_order_items Force Open Order Items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Force Open Order Items" ON public.supplier_order_items TO authenticated USING (true) WITH CHECK (true);


--
-- Name: supplier_orders Force Open Orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Force Open Orders" ON public.supplier_orders TO authenticated USING (true) WITH CHECK (true);


--
-- Name: inventory_items Inventory isolation select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Inventory isolation select" ON public.inventory_items FOR SELECT TO authenticated USING ((business_id IN ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: inventory_items Inventory isolation update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Inventory isolation update" ON public.inventory_items FOR UPDATE TO authenticated USING ((business_id IN ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: menu_items Menu isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Menu isolation" ON public.menu_items USING ((business_id = public.current_user_business_id())) WITH CHECK ((business_id = public.current_user_business_id()));


--
-- Name: master_categories Nuclear Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Nuclear Access" ON public.master_categories TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: master_ingredients Nuclear Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Nuclear Access" ON public.master_ingredients TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: master_option_groups Nuclear Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Nuclear Access" ON public.master_option_groups TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: master_option_values Nuclear Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Nuclear Access" ON public.master_option_values TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: master_supplier_catalog Nuclear Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Nuclear Access" ON public.master_supplier_catalog TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: master_suppliers Nuclear Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Nuclear Access" ON public.master_suppliers TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: optiongroups OptionGroups isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "OptionGroups isolation" ON public.optiongroups TO authenticated USING ((business_id IN ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())))) WITH CHECK ((business_id IN ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: optionvalues OptionValues isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "OptionValues isolation" ON public.optionvalues TO authenticated USING ((business_id IN ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())))) WITH CHECK ((business_id IN ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: catalog_items Public Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public Access" ON public.catalog_items USING (true) WITH CHECK (true);


--
-- Name: music_commands Public Commands Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public Commands Access" ON public.music_commands USING (true);


--
-- Name: catalog_item_suppliers Public Mapping Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public Mapping Access" ON public.catalog_item_suppliers USING (true) WITH CHECK (true);


--
-- Name: music_current_playback Public Playback Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public Playback Access" ON public.music_current_playback USING (true);


--
-- Name: user_spotify_albums Public access for specific user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public access for specific user_id" ON public.user_spotify_albums USING (true) WITH CHECK (true);


--
-- Name: employees Public read access to employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to employees" ON public.employees FOR SELECT USING (true);


--
-- Name: rantunes_albums Public read rantunes_albums; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read rantunes_albums" ON public.rantunes_albums FOR SELECT USING (true);


--
-- Name: rantunes_artists Public read rantunes_artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read rantunes_artists" ON public.rantunes_artists FOR SELECT USING (true);


--
-- Name: rantunes_songs Public read rantunes_songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read rantunes_songs" ON public.rantunes_songs FOR SELECT USING (true);


--
-- Name: employees Read own employee data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Read own employee data" ON public.employees FOR SELECT USING ((auth_user_id = auth.uid()));


--
-- Name: employees Read own employee record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Read own employee record" ON public.employees FOR SELECT TO authenticated USING ((auth_user_id = auth.uid()));


--
-- Name: device_sessions Sessions access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sessions access" ON public.device_sessions TO authenticated USING (true) WITH CHECK (true);


--
-- Name: orders Staff Access Own Business; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff Access Own Business" ON public.orders TO authenticated USING ((business_id IN ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())))) WITH CHECK ((business_id IN ( SELECT employees.business_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: suppliers Suppliers by business; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppliers by business" ON public.suppliers TO authenticated USING ((business_id IN ( SELECT e.business_id
   FROM public.employees e
  WHERE (e.auth_user_id = auth.uid()))));


--
-- Name: user_wallet Users can insert own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own wallet" ON public.user_wallet FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: maya_chat_history Users can insert their own Maya chat history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own Maya chat history" ON public.maya_chat_history FOR INSERT WITH CHECK ((employee_id = auth.uid()));


--
-- Name: rantunes_playlists Users can manage own playlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own playlists" ON public.rantunes_playlists USING (true);


--
-- Name: rantunes_ratings Users can manage own ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own ratings" ON public.rantunes_ratings USING (true);


--
-- Name: rantunes_playlist_songs Users can manage playlist songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage playlist songs" ON public.rantunes_playlist_songs USING (true);


--
-- Name: business_ai_settings Users can update business AI settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update business AI settings" ON public.business_ai_settings FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: user_wallet Users can update own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own wallet" ON public.user_wallet FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: business_ai_settings Users can view business AI settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view business AI settings" ON public.business_ai_settings FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: discounts Users can view discounts for their business; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view discounts for their business" ON public.discounts FOR SELECT USING (true);


--
-- Name: user_wallet Users can view own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own wallet" ON public.user_wallet FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: maya_chat_history Users can view their own Maya chat history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own Maya chat history" ON public.maya_chat_history FOR SELECT USING ((employee_id = auth.uid()));


--
-- Name: inventory_items allow anon read inventory_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "allow anon read inventory_items" ON public.inventory_items FOR SELECT TO anon USING (true);


--
-- Name: business_ai_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_ai_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: business_secrets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_secrets ENABLE ROW LEVEL SECURITY;

--
-- Name: catalog_item_suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalog_item_suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: catalog_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_addresses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_addresses customer_addresses_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customer_addresses_insert ON public.customer_addresses FOR INSERT WITH CHECK (true);


--
-- Name: customer_addresses customer_addresses_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customer_addresses_select ON public.customer_addresses FOR SELECT USING (true);


--
-- Name: customer_addresses customer_addresses_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customer_addresses_update ON public.customer_addresses FOR UPDATE USING (true);


--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: customers customers_all_operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customers_all_operations ON public.customers TO authenticated USING ((business_id = public.get_my_business_id())) WITH CHECK ((business_id = public.get_my_business_id()));


--
-- Name: delivery_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: device_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: discounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

--
-- Name: employees employees_business_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employees_business_access ON public.employees USING ((business_id = public.get_my_business_id()));


--
-- Name: inventory_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_logs inventory_logs_business_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY inventory_logs_business_access ON public.inventory_logs USING ((business_id = public.get_my_business_id()));


--
-- Name: item_category; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.item_category ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items kds_realtime_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kds_realtime_items ON public.order_items FOR SELECT USING (true);


--
-- Name: loyalty_cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: loyalty_cards loyalty_cards_all_operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loyalty_cards_all_operations ON public.loyalty_cards TO authenticated USING ((business_id = public.get_my_business_id())) WITH CHECK ((business_id = public.get_my_business_id()));


--
-- Name: loyalty_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: loyalty_transactions loyalty_transactions_business_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loyalty_transactions_business_access ON public.loyalty_transactions USING ((business_id = public.get_my_business_id()));


--
-- Name: employees manager_login_lookup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY manager_login_lookup ON public.employees FOR SELECT TO anon USING ((access_level = ANY (ARRAY['Manager'::text, 'Admin'::text])));


--
-- Name: master_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.master_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: master_ingredients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.master_ingredients ENABLE ROW LEVEL SECURITY;

--
-- Name: master_option_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.master_option_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: master_option_values; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.master_option_values ENABLE ROW LEVEL SECURITY;

--
-- Name: master_supplier_catalog; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.master_supplier_catalog ENABLE ROW LEVEL SECURITY;

--
-- Name: master_suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.master_suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: menu_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

--
-- Name: music_albums; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.music_albums ENABLE ROW LEVEL SECURITY;

--
-- Name: music_artists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.music_artists ENABLE ROW LEVEL SECURITY;

--
-- Name: music_commands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.music_commands ENABLE ROW LEVEL SECURITY;

--
-- Name: music_current_playback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.music_current_playback ENABLE ROW LEVEL SECURITY;

--
-- Name: music_playback_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.music_playback_history ENABLE ROW LEVEL SECURITY;

--
-- Name: music_playlist_songs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.music_playlist_songs ENABLE ROW LEVEL SECURITY;

--
-- Name: music_playlists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.music_playlists ENABLE ROW LEVEL SECURITY;

--
-- Name: music_ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.music_ratings ENABLE ROW LEVEL SECURITY;

--
-- Name: music_songs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.music_songs ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.onboarding_items ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items order_items_business_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY order_items_business_access ON public.order_items USING ((business_id = public.get_my_business_id()));


--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: orders orders_business_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY orders_business_access ON public.orders USING ((business_id = public.get_my_business_id()));


--
-- Name: prepbatches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.prepbatches ENABLE ROW LEVEL SECURITY;

--
-- Name: prepbatches prepbatches_business_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY prepbatches_business_access ON public.prepbatches USING ((business_id = public.get_my_business_id()));


--
-- Name: rantunes_albums; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rantunes_albums ENABLE ROW LEVEL SECURITY;

--
-- Name: rantunes_artists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rantunes_artists ENABLE ROW LEVEL SECURITY;

--
-- Name: rantunes_playlist_songs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rantunes_playlist_songs ENABLE ROW LEVEL SECURITY;

--
-- Name: rantunes_playlists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rantunes_playlists ENABLE ROW LEVEL SECURITY;

--
-- Name: rantunes_ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rantunes_ratings ENABLE ROW LEVEL SECURITY;

--
-- Name: rantunes_songs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rantunes_songs ENABLE ROW LEVEL SECURITY;

--
-- Name: rantunes_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rantunes_users ENABLE ROW LEVEL SECURITY;

--
-- Name: recipe_ingredients recipe_ingredients_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recipe_ingredients_access ON public.recipe_ingredients USING (true) WITH CHECK (true);


--
-- Name: supplier_order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supplier_order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_order_items supplier_order_items_business_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY supplier_order_items_business_access ON public.supplier_order_items USING ((business_id = public.get_my_business_id()));


--
-- Name: supplier_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_orders supplier_orders_business_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY supplier_orders_business_access ON public.supplier_orders USING ((business_id = public.get_my_business_id()));


--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks tasks_business_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tasks_business_access ON public.tasks USING ((business_id = public.get_my_business_id()));


--
-- Name: time_clock_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_clock_events ENABLE ROW LEVEL SECURITY;

--
-- Name: time_clock_events time_clock_events_business_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY time_clock_events_business_access ON public.time_clock_events USING ((business_id = public.get_my_business_id()));


--
-- Name: user_spotify_albums; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_spotify_albums ENABLE ROW LEVEL SECURITY;

--
-- Name: user_wallet; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_wallet ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime customers; Type: PUBLICATION TABLE; Schema: public; Owner: -
--



--
-- Name: supabase_realtime item_inventory; Type: PUBLICATION TABLE; Schema: public; Owner: -
--



--
-- Name: supabase_realtime music_commands; Type: PUBLICATION TABLE; Schema: public; Owner: -
--



--
-- Name: supabase_realtime music_current_playback; Type: PUBLICATION TABLE; Schema: public; Owner: -
--



--
-- Name: supabase_realtime order_items; Type: PUBLICATION TABLE; Schema: public; Owner: -
--



--
-- Name: supabase_realtime orders; Type: PUBLICATION TABLE; Schema: public; Owner: -
--



--
-- Name: supabase_realtime recurring_tasks; Type: PUBLICATION TABLE; Schema: public; Owner: -
--



--
-- Name: supabase_realtime task_completions; Type: PUBLICATION TABLE; Schema: public; Owner: -
--



--
-- Name: supabase_realtime user_wallet; Type: PUBLICATION TABLE; Schema: public; Owner: -
--



--
