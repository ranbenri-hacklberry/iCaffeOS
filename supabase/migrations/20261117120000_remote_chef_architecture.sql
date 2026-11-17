-- Remote Chef (Chef-as-a-Service) — initial schema, RLS, push, prep, telemetry.
--
-- Naming: a "tenant" in the product brief is public.businesses.id.
-- The mapping table is chef_managed_tenants; its tenant column is business_id.
-- The chef role is employees.access_level = 'remote_chef' (free text today).
--
-- Do not replace deduct_inventory_for_order here. Migration
-- 99999999_all_functions_sync.sql redefines that function and would drop
-- the change. Stock movement is captured by a trigger instead, which survives
-- a later CREATE OR REPLACE of the deduct function.
--
-- Do not call current_user_business_id() for authorization. That helper
-- falls back to a hardcoded pilot UUID when the employee has no business.
--
-- Core POS/KDS tables stay with RLS in whatever state the database is already
-- in (20260409000002 turned RLS off for local kiosks). This migration enables
-- RLS only on the new chef tables, and adds permissive policies on the old
-- tables so a later ENABLE does not lock a remote chef out. Kiosk tablets
-- still sync assembly cards and prep lists through SECURITY DEFINER RPCs,
-- same trust model as get_customers_for_sync.

-- ---------------------------------------------------------------------------
-- 1. Identity helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id
  FROM public.employees e
  WHERE e.auth_user_id = auth.uid()
  ORDER BY e.is_super_admin DESC NULLS LAST, e.created_at
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT bool_or(e.is_super_admin) FROM public.employees e WHERE e.auth_user_id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.staff_is_member(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.auth_user_id = auth.uid()
      AND e.business_id = p_business_id
  );
$$;

CREATE OR REPLACE FUNCTION public.staff_can_admin_business(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.auth_user_id = auth.uid()
        AND e.business_id = p_business_id
        AND (
          e.is_admin IS TRUE
          OR e.access_level IN ('Manager', 'Admin')
        )
    );
$$;

-- ---------------------------------------------------------------------------
-- 2. Chef ↔ tenant grants
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.chef_managed_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  can_edit_menu boolean NOT NULL DEFAULT false,
  can_push_recipes boolean NOT NULL DEFAULT false,
  can_view_financials boolean NOT NULL DEFAULT false,
  granted_by uuid REFERENCES public.employees(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  notes text,
  CONSTRAINT chef_managed_tenants_chef_business_key UNIQUE (chef_employee_id, business_id)
);

CREATE INDEX IF NOT EXISTS chef_managed_tenants_business_active_idx
  ON public.chef_managed_tenants (business_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS chef_managed_tenants_chef_active_idx
  ON public.chef_managed_tenants (chef_employee_id)
  WHERE revoked_at IS NULL;

COMMENT ON TABLE public.chef_managed_tenants IS
  'Remote chef assignments. business_id is the client tenant. All-false flags still allow operational read (prep, tickets, stock qty).';

CREATE OR REPLACE FUNCTION public.enforce_remote_chef_grant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = NEW.chef_employee_id
      AND e.access_level = 'remote_chef'
  ) THEN
    RAISE EXCEPTION 'chef_employee_id % must have employees.access_level = remote_chef', NEW.chef_employee_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chef_managed_tenants_enforce_role ON public.chef_managed_tenants;
CREATE TRIGGER chef_managed_tenants_enforce_role
  BEFORE INSERT OR UPDATE OF chef_employee_id
  ON public.chef_managed_tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_remote_chef_grant();

CREATE OR REPLACE FUNCTION public.user_can_access_business(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p_business_id IS NOT NULL AND (
    public.is_super_admin()
    OR public.staff_is_member(p_business_id)
    OR EXISTS (
      SELECT 1
      FROM public.employees e
      JOIN public.chef_managed_tenants c ON c.chef_employee_id = e.id
      WHERE e.auth_user_id = auth.uid()
        AND e.access_level = 'remote_chef'
        AND c.business_id = p_business_id
        AND c.revoked_at IS NULL
    )
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.chef_can(p_business_id uuid, p_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.employees e
      JOIN public.chef_managed_tenants c ON c.chef_employee_id = e.id
      WHERE e.auth_user_id = auth.uid()
        AND e.access_level = 'remote_chef'
        AND c.business_id = p_business_id
        AND c.revoked_at IS NULL
        AND (
          (p_permission = 'can_edit_menu' AND c.can_edit_menu)
          OR (p_permission = 'can_push_recipes' AND c.can_push_recipes)
          OR (p_permission = 'can_view_financials' AND c.can_view_financials)
        )
    );
$$;

REVOKE ALL ON FUNCTION public.current_employee_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_is_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_can_admin_business(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_can_access_business(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chef_can(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_employee_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.staff_is_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.staff_can_admin_business(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_can_access_business(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.chef_can(uuid, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Master library
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.master_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text,
  kds_routing_logic text NOT NULL DEFAULT 'MADE_TO_ORDER',
  is_archived boolean NOT NULL DEFAULT false,
  owner_business_id uuid REFERENCES public.businesses(id),
  created_by uuid REFERENCES public.employees(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.master_recipes.owner_business_id IS
  'NULL means the global chef library. A non-null value is a private recipe owned by that business.';

CREATE TABLE IF NOT EXISTS public.master_recipe_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_recipe_id uuid NOT NULL REFERENCES public.master_recipes(id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  yield_quantity numeric(12, 3) NOT NULL DEFAULT 1,
  yield_unit text NOT NULL DEFAULT 'portion',
  yield_percent numeric(5, 2),
  suggested_price numeric(12, 2),
  target_prep_seconds integer,
  plating_media_url text,
  allergen_tags text[] NOT NULL DEFAULT '{}',
  notes text,
  published_at timestamptz,
  created_by uuid REFERENCES public.employees(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT master_recipe_versions_identity UNIQUE (master_recipe_id, version_no),
  CONSTRAINT master_recipe_versions_yield_pct CHECK (
    yield_percent IS NULL OR (yield_percent > 0 AND yield_percent <= 100)
  )
);

CREATE TABLE IF NOT EXISTS public.master_recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.master_recipe_versions(id) ON DELETE CASCADE,
  canonical_name text NOT NULL,
  canonical_key text NOT NULL,
  quantity_grams numeric(12, 3) NOT NULL CHECK (quantity_grams >= 0),
  yield_percent numeric(5, 2),
  allergen_tags text[] NOT NULL DEFAULT '{}',
  is_optional boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT master_recipe_ingredients_yield_pct CHECK (
    yield_percent IS NULL OR (yield_percent > 0 AND yield_percent <= 100)
  )
);

CREATE INDEX IF NOT EXISTS master_recipe_ingredients_version_idx
  ON public.master_recipe_ingredients (version_id, sort_order);

CREATE TABLE IF NOT EXISTS public.master_sop_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.master_recipe_versions(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('prep', 'assembly')),
  step_order integer NOT NULL,
  title text NOT NULL,
  instruction text NOT NULL,
  quantity_grams numeric(12, 3),
  duration_seconds integer,
  media_url text,
  CONSTRAINT master_sop_steps_order UNIQUE (version_id, phase, step_order)
);

-- ---------------------------------------------------------------------------
-- 4. Tenant linkage, prep, usage ledger
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tenant_ingredient_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  canonical_key text NOT NULL,
  inventory_item_id integer NOT NULL REFERENCES public.inventory_items(id),
  grams_per_stock_unit numeric(14, 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_ingredient_maps_key UNIQUE (business_id, canonical_key)
);

COMMENT ON COLUMN public.tenant_ingredient_maps.grams_per_stock_unit IS
  'How many grams one inventory_items.current_stock unit represents. Overrides weight_per_unit and unit-name guesses at push time.';

CREATE TABLE IF NOT EXISTS public.recipe_pushes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_version_id uuid NOT NULL REFERENCES public.master_recipe_versions(id),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  menu_item_id integer REFERENCES public.menu_items(id),
  recipe_id integer REFERENCES public.recipes(id),
  status text NOT NULL CHECK (status IN ('applied', 'partial')),
  gap_count integer NOT NULL DEFAULT 0,
  pushed_by uuid REFERENCES public.employees(id),
  pushed_at timestamptz NOT NULL DEFAULT now(),
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS recipe_pushes_business_idx
  ON public.recipe_pushes (business_id, pushed_at DESC);

CREATE TABLE IF NOT EXISTS public.recipe_push_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  push_id uuid NOT NULL REFERENCES public.recipe_pushes(id) ON DELETE CASCADE,
  canonical_key text NOT NULL,
  canonical_name text NOT NULL,
  quantity_grams numeric(12, 3),
  is_optional boolean NOT NULL DEFAULT false,
  reason text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assembly_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  menu_item_id integer NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  master_recipe_id uuid REFERENCES public.master_recipes(id),
  master_version_id uuid REFERENCES public.master_recipe_versions(id),
  version_no integer,
  target_prep_seconds integer,
  plating_media_url text,
  card jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assembly_cards_menu_item_key UNIQUE (menu_item_id)
);

CREATE INDEX IF NOT EXISTS assembly_cards_business_idx
  ON public.assembly_cards (business_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.prep_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  menu_item_id integer REFERENCES public.menu_items(id),
  master_version_id uuid REFERENCES public.master_recipe_versions(id),
  name text NOT NULL,
  station text,
  target_yield_grams numeric(12, 3),
  target_minutes integer,
  sort_order integer NOT NULL DEFAULT 0,
  days_of_week smallint[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prep_task_templates_dow CHECK (
    days_of_week IS NULL
    OR days_of_week <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::smallint[]
  )
);

CREATE TABLE IF NOT EXISTS public.prep_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.prep_task_templates(id) ON DELETE SET NULL,
  service_date date NOT NULL,
  menu_item_id integer REFERENCES public.menu_items(id),
  master_version_id uuid REFERENCES public.master_recipe_versions(id),
  name text NOT NULL,
  station text,
  target_yield_grams numeric(12, 3),
  target_minutes integer,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'skipped')),
  created_by uuid REFERENCES public.employees(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS prep_tasks_template_day_idx
  ON public.prep_tasks (business_id, service_date, template_id)
  WHERE template_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS prep_tasks_service_idx
  ON public.prep_tasks (business_id, service_date, status);

CREATE TABLE IF NOT EXISTS public.prep_task_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prep_task_id uuid NOT NULL REFERENCES public.prep_tasks(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_mutation_id uuid NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  checked_by uuid REFERENCES public.employees(id),
  actual_yield_grams numeric(12, 3),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prep_task_logs_mutation UNIQUE (prep_task_id, client_mutation_id)
);

CREATE INDEX IF NOT EXISTS prep_task_logs_business_idx
  ON public.prep_task_logs (business_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS public.inventory_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid,
  inventory_item_id integer NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('consumption', 'receipt')),
  quantity numeric NOT NULL CHECK (quantity >= 0),
  unit text,
  source text NOT NULL DEFAULT 'stock_delta',
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_usage_events_window_idx
  ON public.inventory_usage_events (business_id, occurred_at);

COMMENT ON TABLE public.inventory_usage_events IS
  'Append-only stock deltas. consumption is unexplained until compared with ticket BOM. It is not itself a waste verdict.';

-- ---------------------------------------------------------------------------
-- 5. Columns on existing tables. No updates to historical order rows.
-- ---------------------------------------------------------------------------

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS master_recipe_id uuid REFERENCES public.master_recipes(id),
  ADD COLUMN IF NOT EXISTS master_version_id uuid REFERENCES public.master_recipe_versions(id),
  ADD COLUMN IF NOT EXISTS recipe_pushed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS menu_items_one_master_per_business
  ON public.menu_items (business_id, master_recipe_id)
  WHERE master_recipe_id IS NOT NULL AND business_id IS NOT NULL;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS recipe_version_id uuid REFERENCES public.master_recipe_versions(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.order_items.recipe_version_id IS
  'Stamped on insert from menu_items.master_version_id. Existing rows stay NULL. Push never rewrites order_items.';

CREATE OR REPLACE FUNCTION public.stamp_order_item_recipe_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.recipe_version_id IS NULL AND NEW.menu_item_id IS NOT NULL THEN
    SELECT m.master_version_id
      INTO NEW.recipe_version_id
    FROM public.menu_items m
    WHERE m.id = NEW.menu_item_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_items_stamp_recipe_version ON public.order_items;
CREATE TRIGGER order_items_stamp_recipe_version
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_order_item_recipe_version();

CREATE OR REPLACE FUNCTION public.log_inventory_stock_delta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta numeric;
BEGIN
  v_delta := COALESCE(OLD.current_stock, 0) - COALESCE(NEW.current_stock, 0);
  IF v_delta = 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.inventory_usage_events (
    business_id,
    inventory_item_id,
    event_type,
    quantity,
    unit,
    source,
    occurred_at
  ) VALUES (
    NEW.business_id,
    NEW.id,
    CASE WHEN v_delta > 0 THEN 'consumption' ELSE 'receipt' END,
    abs(v_delta),
    NEW.unit,
    'stock_delta',
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inventory_items_log_stock_delta ON public.inventory_items;
CREATE TRIGGER inventory_items_log_stock_delta
  AFTER UPDATE OF current_stock ON public.inventory_items
  FOR EACH ROW
  WHEN (OLD.current_stock IS DISTINCT FROM NEW.current_stock)
  EXECUTE FUNCTION public.log_inventory_stock_delta();

-- ---------------------------------------------------------------------------
-- 6. Push a published master version into one client business
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.push_master_recipe_to_tenant(
  p_version_id uuid,
  p_business_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version public.master_recipe_versions%ROWTYPE;
  v_master public.master_recipes%ROWTYPE;
  v_menu_id integer;
  v_menu_business uuid;
  v_recipe_id integer;
  v_ing record;
  v_map public.tenant_ingredient_maps%ROWTYPE;
  v_item public.inventory_items%ROWTYPE;
  v_unit text;
  v_grams_per_unit numeric;
  v_yield numeric;
  v_raw_grams numeric;
  v_qty_used numeric;
  v_required_gaps integer := 0;
  v_gap_count integer := 0;
  v_push_id uuid;
  v_status text;
  v_card jsonb;
  v_steps jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_actor uuid;
  v_item_ok boolean;
  v_reason text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
    END IF;
    IF NOT (
      public.chef_can(p_business_id, 'can_push_recipes')
      OR public.staff_can_admin_business(p_business_id)
    ) THEN
      RAISE EXCEPTION 'not allowed to push recipes into business %', p_business_id
        USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT * INTO v_version FROM public.master_recipe_versions WHERE id = p_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'master version % not found', p_version_id USING ERRCODE = 'P0002';
  END IF;
  IF v_version.status <> 'published' THEN
    RAISE EXCEPTION 'only a published version can be pushed' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_master FROM public.master_recipes WHERE id = v_version.master_recipe_id;
  IF v_master.is_archived THEN
    RAISE EXCEPTION 'archived master recipe' USING ERRCODE = '22023';
  END IF;

  v_actor := public.current_employee_id();

  SELECT id, business_id
    INTO v_menu_id, v_menu_business
  FROM public.menu_items
  WHERE master_recipe_id = v_master.id
    AND business_id = p_business_id
  ORDER BY id
  LIMIT 1;

  IF v_menu_id IS NULL THEN
    INSERT INTO public.menu_items (
      name,
      price,
      category,
      business_id,
      description,
      image_url,
      is_prep_required,
      kds_routing_logic,
      master_recipe_id,
      is_in_stock
    ) VALUES (
      v_master.name,
      COALESCE(v_version.suggested_price, 0),
      COALESCE(NULLIF(v_master.category, ''), 'kitchen'),
      p_business_id,
      v_version.notes,
      v_version.plating_media_url,
      true,
      COALESCE(NULLIF(v_master.kds_routing_logic, ''), 'MADE_TO_ORDER'),
      v_master.id,
      true
    )
    RETURNING id INTO v_menu_id;
  END IF;

  SELECT id INTO v_recipe_id
  FROM public.recipes
  WHERE menu_item_id = v_menu_id
    AND (business_id = p_business_id OR business_id IS NULL)
  ORDER BY id DESC
  LIMIT 1;

  IF v_recipe_id IS NULL THEN
    INSERT INTO public.recipes (
      menu_item_id,
      instructions,
      preparation_quantity,
      quantity_unit,
      business_id
    ) VALUES (
      v_menu_id,
      '',
      GREATEST(v_version.yield_quantity, 1),
      v_version.yield_unit,
      p_business_id
    )
    RETURNING id INTO v_recipe_id;
  END IF;

  v_lines := '[]'::jsonb;

  FOR v_ing IN
    SELECT *
    FROM public.master_recipe_ingredients
    WHERE version_id = v_version.id
    ORDER BY sort_order, canonical_name
  LOOP
    v_item_ok := false;
    v_grams_per_unit := NULL;
    v_reason := NULL;

    SELECT * INTO v_map
    FROM public.tenant_ingredient_maps
    WHERE business_id = p_business_id
      AND canonical_key = v_ing.canonical_key;

    IF FOUND THEN
      SELECT * INTO v_item
      FROM public.inventory_items
      WHERE id = v_map.inventory_item_id
        AND business_id = p_business_id;
      v_item_ok := FOUND;
    END IF;

    IF v_item_ok THEN
      v_unit := replace(replace(lower(trim(coalesce(v_item.unit, ''))), '״', '"'), '׳', '''');
      v_grams_per_unit := COALESCE(
        v_map.grams_per_stock_unit,
        v_item.weight_per_unit,
        CASE v_unit
          WHEN 'g' THEN 1
          WHEN 'gram' THEN 1
          WHEN 'grams' THEN 1
          WHEN 'גרם' THEN 1
          WHEN 'kg' THEN 1000
          WHEN 'ק"ג' THEN 1000
          WHEN 'קג' THEN 1000
          ELSE NULL
        END
      );
    END IF;

    IF v_item_ok AND v_grams_per_unit IS NOT NULL AND v_grams_per_unit > 0 THEN
      v_yield := COALESCE(v_ing.yield_percent, v_version.yield_percent, 100);
      v_raw_grams := v_ing.quantity_grams / (v_yield / 100.0);
      v_qty_used := round(v_raw_grams / v_grams_per_unit, 4);
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'mapped', true,
        'reason', NULL,
        'inventory_item_id', v_item.id,
        'quantity_used', v_qty_used,
        'unit_of_measure', COALESCE(v_item.unit, 'unit'),
        'canonical_name', v_ing.canonical_name,
        'canonical_key', v_ing.canonical_key,
        'quantity_grams', v_ing.quantity_grams,
        'yield_percent', v_ing.yield_percent,
        'is_optional', v_ing.is_optional
      ));
    ELSE
      v_gap_count := v_gap_count + 1;
      IF NOT v_ing.is_optional THEN
        v_required_gaps := v_required_gaps + 1;
      END IF;
      v_reason := CASE
        WHEN NOT v_item_ok THEN 'unmapped ingredient'
        ELSE 'no grams per stock unit'
      END;
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'mapped', false,
        'reason', v_reason,
        'inventory_item_id', NULL,
        'quantity_used', NULL,
        'unit_of_measure', NULL,
        'canonical_name', v_ing.canonical_name,
        'canonical_key', v_ing.canonical_key,
        'quantity_grams', v_ing.quantity_grams,
        'yield_percent', v_ing.yield_percent,
        'is_optional', v_ing.is_optional
      ));
    END IF;
  END LOOP;

  IF v_required_gaps = 0 THEN
    v_status := 'applied';
    DELETE FROM public.recipe_ingredients WHERE recipe_id = v_recipe_id;
    INSERT INTO public.recipe_ingredients (
      recipe_id, inventory_item_id, quantity_used, unit_of_measure
    )
    SELECT
      v_recipe_id,
      (e->>'inventory_item_id')::integer,
      (e->>'quantity_used')::numeric,
      e->>'unit_of_measure'
    FROM jsonb_array_elements(v_lines) e
    WHERE COALESCE((e->>'mapped')::boolean, false);
  ELSE
    v_status := 'partial';
    UPDATE public.recipe_ingredients ri
    SET quantity_used = (e->>'quantity_used')::numeric,
        unit_of_measure = e->>'unit_of_measure'
    FROM jsonb_array_elements(v_lines) e
    WHERE ri.recipe_id = v_recipe_id
      AND COALESCE((e->>'mapped')::boolean, false)
      AND ri.inventory_item_id = (e->>'inventory_item_id')::integer;

    INSERT INTO public.recipe_ingredients (
      recipe_id, inventory_item_id, quantity_used, unit_of_measure
    )
    SELECT
      v_recipe_id,
      (e->>'inventory_item_id')::integer,
      (e->>'quantity_used')::numeric,
      e->>'unit_of_measure'
    FROM jsonb_array_elements(v_lines) e
    WHERE COALESCE((e->>'mapped')::boolean, false)
      AND NOT EXISTS (
        SELECT 1
        FROM public.recipe_ingredients ri
        WHERE ri.recipe_id = v_recipe_id
          AND ri.inventory_item_id = (e->>'inventory_item_id')::integer
      );
  END IF;

  UPDATE public.recipes
  SET instructions = (
        SELECT string_agg(
          s.step_order || '. ' || s.title || E'\n' || s.instruction,
          E'\n\n'
          ORDER BY s.phase DESC, s.step_order
        )
        FROM public.master_sop_steps s
        WHERE s.version_id = v_version.id
      ),
      preparation_quantity = GREATEST(v_version.yield_quantity, 1),
      quantity_unit = v_version.yield_unit,
      business_id = p_business_id
  WHERE id = v_recipe_id;

  IF v_status = 'applied' THEN
    UPDATE public.menu_items
    SET master_recipe_id = v_master.id,
        master_version_id = v_version.id,
        recipe_pushed_at = now()
    WHERE id = v_menu_id
      AND business_id = p_business_id;
  ELSE
    UPDATE public.menu_items
    SET master_recipe_id = v_master.id
    WHERE id = v_menu_id
      AND business_id = p_business_id
      AND master_recipe_id IS NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'phase', s.phase,
      'step_order', s.step_order,
      'title', s.title,
      'instruction', s.instruction,
      'quantity_grams', s.quantity_grams,
      'duration_seconds', s.duration_seconds,
      'media_url', s.media_url
    )
    ORDER BY CASE s.phase WHEN 'prep' THEN 0 ELSE 1 END, s.step_order
  ), '[]'::jsonb)
  INTO v_steps
  FROM public.master_sop_steps s
  WHERE s.version_id = v_version.id;

  v_card := jsonb_build_object(
    'recipe_name', v_master.name,
    'version_no', v_version.version_no,
    'complete', v_status = 'applied',
    'yield_quantity', v_version.yield_quantity,
    'yield_unit', v_version.yield_unit,
    'yield_percent', v_version.yield_percent,
    'allergen_tags', to_jsonb(v_version.allergen_tags),
    'target_prep_seconds', v_version.target_prep_seconds,
    'plating_media_url', v_version.plating_media_url,
    'steps', v_steps,
    'ingredients', v_lines
  );

  INSERT INTO public.assembly_cards (
    business_id, menu_item_id, master_recipe_id, master_version_id, version_no,
    target_prep_seconds, plating_media_url, card, updated_at
  ) VALUES (
    p_business_id, v_menu_id, v_master.id, v_version.id, v_version.version_no,
    v_version.target_prep_seconds, v_version.plating_media_url, v_card, now()
  )
  ON CONFLICT (menu_item_id) DO UPDATE
  SET business_id = EXCLUDED.business_id,
      master_recipe_id = EXCLUDED.master_recipe_id,
      master_version_id = EXCLUDED.master_version_id,
      version_no = EXCLUDED.version_no,
      target_prep_seconds = EXCLUDED.target_prep_seconds,
      plating_media_url = EXCLUDED.plating_media_url,
      card = EXCLUDED.card,
      updated_at = now();

  INSERT INTO public.recipe_pushes (
    master_version_id, business_id, menu_item_id, recipe_id,
    status, gap_count, pushed_by, details
  ) VALUES (
    v_version.id, p_business_id, v_menu_id, v_recipe_id,
    v_status, v_gap_count, v_actor,
    jsonb_build_object('required_gaps', v_required_gaps)
  )
  RETURNING id INTO v_push_id;

  INSERT INTO public.recipe_push_gaps (
    push_id, canonical_key, canonical_name, quantity_grams, is_optional, reason
  )
  SELECT
    v_push_id,
    e->>'canonical_key',
    e->>'canonical_name',
    (e->>'quantity_grams')::numeric,
    COALESCE((e->>'is_optional')::boolean, false),
    e->>'reason'
  FROM jsonb_array_elements(v_lines) e
  WHERE NOT COALESCE((e->>'mapped')::boolean, false);

  RETURN jsonb_build_object(
    'push_id', v_push_id,
    'status', v_status,
    'business_id', p_business_id,
    'menu_item_id', v_menu_id,
    'recipe_id', v_recipe_id,
    'master_version_id', v_version.id,
    'gap_count', v_gap_count,
    'required_gaps', v_required_gaps
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Daily prep
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_daily_prep_tasks(
  p_business_id uuid,
  p_service_date date
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
    END IF;
    IF NOT (
      public.staff_can_admin_business(p_business_id)
      OR public.chef_can(p_business_id, 'can_push_recipes')
    ) THEN
      RAISE EXCEPTION 'not allowed to generate prep for business %', p_business_id
        USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO public.prep_tasks (
    business_id, template_id, service_date, menu_item_id, master_version_id,
    name, station, target_yield_grams, target_minutes, sort_order, created_by
  )
  SELECT
    t.business_id,
    t.id,
    p_service_date,
    t.menu_item_id,
    t.master_version_id,
    t.name,
    t.station,
    t.target_yield_grams,
    t.target_minutes,
    t.sort_order,
    public.current_employee_id()
  FROM public.prep_task_templates t
  WHERE t.business_id = p_business_id
    AND t.is_active
    AND (
      t.days_of_week IS NULL
      OR EXTRACT(DOW FROM p_service_date)::smallint = ANY (t.days_of_week)
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.prep_tasks p
      WHERE p.business_id = t.business_id
        AND p.service_date = p_service_date
        AND p.template_id = t.id
    );

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_prep_task(
  p_prep_task_id uuid,
  p_client_mutation_id uuid,
  p_actual_yield_grams numeric,
  p_checked_at timestamptz DEFAULT now(),
  p_notes text DEFAULT NULL,
  p_checked_by uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.prep_tasks%ROWTYPE;
  v_log_id uuid;
BEGIN
  SELECT * INTO v_task FROM public.prep_tasks WHERE id = p_prep_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'prep task % not found', p_prep_task_id USING ERRCODE = 'P0002';
  END IF;

  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() IS NOT NULL THEN
    IF NOT public.user_can_access_business(v_task.business_id) THEN
      RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO public.prep_task_logs (
    prep_task_id, business_id, client_mutation_id, checked_at,
    checked_by, actual_yield_grams, notes
  ) VALUES (
    v_task.id,
    v_task.business_id,
    p_client_mutation_id,
    COALESCE(p_checked_at, now()),
    COALESCE(p_checked_by, public.current_employee_id()),
    p_actual_yield_grams,
    p_notes
  )
  ON CONFLICT (prep_task_id, client_mutation_id) DO NOTHING
  RETURNING id INTO v_log_id;

  IF v_log_id IS NULL THEN
    SELECT id INTO v_log_id
    FROM public.prep_task_logs
    WHERE prep_task_id = v_task.id
      AND client_mutation_id = p_client_mutation_id;
  ELSE
    UPDATE public.prep_tasks
    SET status = 'done',
        updated_at = now()
    WHERE id = v_task.id
      AND status <> 'done';
  END IF;

  RETURN jsonb_build_object(
    'prep_task_id', v_task.id,
    'log_id', v_log_id,
    'business_id', v_task.business_id,
    'status', 'done'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_assembly_cards_for_sync(p_business_id uuid)
RETURNS SETOF public.assembly_cards
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() IS NOT NULL THEN
    IF NOT public.user_can_access_business(p_business_id) THEN
      RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.assembly_cards
  WHERE business_id = p_business_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_prep_tasks_for_sync(
  p_business_id uuid,
  p_service_date date DEFAULT CURRENT_DATE
) RETURNS SETOF public.prep_tasks
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() IS NOT NULL THEN
    IF NOT public.user_can_access_business(p_business_id) THEN
      RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.prep_tasks
  WHERE business_id = p_business_id
    AND service_date >= p_service_date - 1
    AND service_date <= p_service_date + 1;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Command-center telemetry
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_chef_command_center_telemetry(
  p_from timestamptz,
  p_to timestamptz,
  p_business_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids uuid[];
  v_bid uuid;
  v_name text;
  v_show_money boolean;
  v_ledger boolean;
  v_businesses jsonb := '[]'::jsonb;
  v_food jsonb;
  v_variance jsonb;
  v_kds jsonb;
  v_stock jsonb;
  v_prep jsonb;
BEGIN
  IF p_from IS NULL OR p_to IS NULL OR p_from >= p_to THEN
    RAISE EXCEPTION 'p_from must be earlier than p_to' USING ERRCODE = '22023';
  END IF;

  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF p_business_id IS NOT NULL THEN
    IF auth.role() IS DISTINCT FROM 'service_role'
       AND NOT public.user_can_access_business(p_business_id) THEN
      RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
    END IF;
    v_ids := ARRAY[p_business_id];
  ELSIF auth.role() = 'service_role' OR public.is_super_admin() THEN
    SELECT COALESCE(array_agg(b.id), '{}')
      INTO v_ids
    FROM public.businesses b;
  ELSE
    SELECT COALESCE(array_agg(DISTINCT x), '{}')
      INTO v_ids
    FROM (
      SELECT e.business_id AS x
      FROM public.employees e
      WHERE e.auth_user_id = auth.uid()
        AND e.business_id IS NOT NULL
      UNION
      SELECT c.business_id
      FROM public.employees e
      JOIN public.chef_managed_tenants c ON c.chef_employee_id = e.id
      WHERE e.auth_user_id = auth.uid()
        AND e.access_level = 'remote_chef'
        AND c.revoked_at IS NULL
    ) s;
  END IF;

  FOREACH v_bid IN ARRAY v_ids
  LOOP
    SELECT b.name INTO v_name FROM public.businesses b WHERE b.id = v_bid;

    v_show_money := auth.role() = 'service_role'
      OR public.is_super_admin()
      OR public.staff_is_member(v_bid)
      OR public.chef_can(v_bid, 'can_view_financials');

    SELECT EXISTS (
      SELECT 1
      FROM public.inventory_usage_events e
      WHERE e.business_id = v_bid
        AND e.occurred_at >= p_from
        AND e.occurred_at < p_to
    ) INTO v_ledger;

    IF v_show_money THEN
      WITH latest_price AS (
        SELECT DISTINCT ON (soi.inventory_item_id)
          soi.inventory_item_id,
          soi.unit_price
        FROM public.supplier_order_items soi
        JOIN public.supplier_orders so ON so.id = soi.supplier_order_id
        WHERE so.business_id = v_bid
          AND soi.unit_price IS NOT NULL
        ORDER BY soi.inventory_item_id, COALESCE(soi.received_date, soi.created_at) DESC, soi.id DESC
      ),
      item_cost AS (
        SELECT
          mi.id AS menu_item_id,
          mi.name,
          mi.price,
          SUM(ri.quantity_used * COALESCE(lp.unit_price, ii.cost_per_unit, 0)) AS theoretical_cost
        FROM public.menu_items mi
        JOIN LATERAL (
          SELECT r.id
          FROM public.recipes r
          WHERE r.menu_item_id = mi.id
            AND (r.business_id = v_bid OR r.business_id IS NULL)
          ORDER BY (r.business_id IS NOT NULL) DESC, r.id DESC
          LIMIT 1
        ) r ON true
        JOIN public.recipe_ingredients ri ON ri.recipe_id = r.id
        JOIN public.inventory_items ii ON ii.id = ri.inventory_item_id
        LEFT JOIN latest_price lp ON lp.inventory_item_id = ii.id
        WHERE mi.business_id = v_bid
        GROUP BY mi.id, mi.name, mi.price
      )
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'menu_item_id', c.menu_item_id,
          'name', c.name,
          'price', c.price,
          'theoretical_cost', round(c.theoretical_cost, 4),
          'food_cost_pct', CASE
            WHEN c.price IS NULL OR c.price = 0 THEN NULL
            ELSE round((c.theoretical_cost / c.price) * 100, 2)
          END
        )
        ORDER BY c.name
      ), '[]'::jsonb)
      INTO v_food
      FROM item_cost c;
    ELSE
      v_food := NULL;
    END IF;

    WITH theoretical AS (
      SELECT
        ri.inventory_item_id,
        SUM(ri.quantity_used * oi.quantity) AS theoretical_qty
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      JOIN LATERAL (
        SELECT r.id
        FROM public.recipes r
        WHERE r.menu_item_id = oi.menu_item_id
          AND (r.business_id = o.business_id OR r.business_id IS NULL)
        ORDER BY (r.business_id IS NOT NULL) DESC, r.id DESC
        LIMIT 1
      ) r ON true
      JOIN public.recipe_ingredients ri ON ri.recipe_id = r.id
      WHERE o.business_id = v_bid
        AND o.created_at >= p_from
        AND o.created_at < p_to
        AND o.order_status IS DISTINCT FROM 'cancelled'
        AND oi.item_status IS DISTINCT FROM 'cancelled'
      GROUP BY ri.inventory_item_id
    ),
    actual AS (
      SELECT
        e.inventory_item_id,
        SUM(e.quantity) FILTER (WHERE e.event_type = 'consumption') AS actual_qty
      FROM public.inventory_usage_events e
      WHERE e.business_id = v_bid
        AND e.occurred_at >= p_from
        AND e.occurred_at < p_to
      GROUP BY e.inventory_item_id
    )
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'inventory_item_id', ii.id,
        'name', ii.name,
        'theoretical_qty', round(t.theoretical_qty, 4),
        'actual_qty', CASE WHEN v_ledger THEN round(COALESCE(a.actual_qty, 0), 4) ELSE NULL END,
        'unexplained_qty', CASE
          WHEN NOT v_ledger OR t.theoretical_qty IS NULL THEN NULL
          ELSE round(COALESCE(a.actual_qty, 0) - t.theoretical_qty, 4)
        END,
        'unit', ii.unit
      )
      ORDER BY ii.name
    ), '[]'::jsonb)
    INTO v_variance
    FROM theoretical t
    JOIN public.inventory_items ii ON ii.id = t.inventory_item_id
    LEFT JOIN actual a ON a.inventory_item_id = t.inventory_item_id;

    SELECT jsonb_build_object(
      'sample_size', COUNT(*),
      'avg_ticket_seconds', round(AVG(EXTRACT(EPOCH FROM (
        oi.updated_at - COALESCE(oi.item_fired_at, oi.created_at)
      ))) FILTER (WHERE oi.updated_at IS NOT NULL)),
      'target_seconds', round(AVG(ac.target_prep_seconds)),
      'breach', CASE
        WHEN COUNT(*) < 5 THEN false
        WHEN AVG(ac.target_prep_seconds) IS NULL THEN false
        ELSE AVG(EXTRACT(EPOCH FROM (
          oi.updated_at - COALESCE(oi.item_fired_at, oi.created_at)
        ))) > AVG(ac.target_prep_seconds)
      END
    )
    INTO v_kds
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    JOIN public.assembly_cards ac
      ON ac.menu_item_id = oi.menu_item_id
     AND ac.business_id = o.business_id
    WHERE o.business_id = v_bid
      AND o.created_at >= p_from
      AND o.created_at < p_to
      AND oi.item_status IS DISTINCT FROM 'cancelled'
      AND oi.item_status IS DISTINCT FROM 'new'
      AND oi.updated_at IS NOT NULL;

    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'inventory_item_id', ii.id,
        'name', ii.name,
        'current_stock', ii.current_stock,
        'low_stock_alert', ii.low_stock_alert,
        'suggested_order_qty', CASE
          WHEN ii.case_quantity IS NOT NULL AND ii.case_quantity > 1 THEN
            ceil(GREATEST(ii.low_stock_alert - COALESCE(ii.current_stock, 0), 0) / ii.case_quantity)
              * ii.case_quantity
          ELSE GREATEST(ii.low_stock_alert - COALESCE(ii.current_stock, 0), 0)
        END,
        'supplier_id', ii.supplier_id
      )
      ORDER BY ii.name
    ), '[]'::jsonb)
    INTO v_stock
    FROM public.inventory_items ii
    WHERE ii.business_id = v_bid
      AND ii.low_stock_alert IS NOT NULL
      AND COALESCE(ii.current_stock, 0) <= ii.low_stock_alert;

    SELECT jsonb_build_object(
      'service_date', CURRENT_DATE,
      'open', COUNT(*) FILTER (WHERE p.status = 'open'),
      'done', COUNT(*) FILTER (WHERE p.status = 'done'),
      'skipped', COUNT(*) FILTER (WHERE p.status = 'skipped'),
      'actual_yield_grams', (
        SELECT SUM(l.actual_yield_grams)
        FROM public.prep_task_logs l
        JOIN public.prep_tasks pt ON pt.id = l.prep_task_id
        WHERE pt.business_id = v_bid
          AND pt.service_date = CURRENT_DATE
      )
    )
    INTO v_prep
    FROM public.prep_tasks p
    WHERE p.business_id = v_bid
      AND p.service_date = CURRENT_DATE;

    v_businesses := v_businesses || jsonb_build_array(jsonb_build_object(
      'business_id', v_bid,
      'name', v_name,
      'ledger_active', v_ledger,
      'financials_visible', v_show_money,
      'food_cost', v_food,
      'variance', v_variance,
      'kds', COALESCE(v_kds, '{}'::jsonb),
      'stock_alerts', COALESCE(v_stock, '[]'::jsonb),
      'prep', COALESCE(v_prep, '{}'::jsonb)
    ));
  END LOOP;

  RETURN jsonb_build_object(
    'generated_at', now(),
    'window_from', p_from,
    'window_to', p_to,
    'businesses', v_businesses
  );
END;
$$;

REVOKE ALL ON FUNCTION public.push_master_recipe_to_tenant(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_daily_prep_tasks(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_prep_task(uuid, uuid, numeric, timestamptz, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_assembly_cards_for_sync(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_prep_tasks_for_sync(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_chef_command_center_telemetry(timestamptz, timestamptz, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.push_master_recipe_to_tenant(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_daily_prep_tasks(uuid, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_prep_task(uuid, uuid, numeric, timestamptz, text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_assembly_cards_for_sync(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_prep_tasks_for_sync(uuid, date) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_chef_command_center_telemetry(timestamptz, timestamptz, uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 9. Master visibility helpers
-- Policy subqueries run as the table owner and bypass RLS, so a bare
-- EXISTS (SELECT 1 FROM master_recipes) would expose every version.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_read_master_recipe(p_recipe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.master_recipes m
      WHERE m.id = p_recipe_id
        AND (
          m.created_by = public.current_employee_id()
          OR (
            m.owner_business_id IS NULL
            AND EXISTS (
              SELECT 1
              FROM public.employees e
              WHERE e.auth_user_id = auth.uid()
                AND e.access_level = 'remote_chef'
            )
          )
          OR public.user_can_access_business(m.owner_business_id)
          OR EXISTS (
            SELECT 1
            FROM public.assembly_cards ac
            WHERE ac.master_recipe_id = m.id
              AND public.user_can_access_business(ac.business_id)
          )
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_write_master_recipe(p_recipe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.master_recipes m
      WHERE m.id = p_recipe_id
        AND (
          m.created_by = public.current_employee_id()
          OR public.staff_can_admin_business(m.owner_business_id)
        )
    );
$$;

REVOKE ALL ON FUNCTION public.can_read_master_recipe(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_write_master_recipe(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_master_recipe(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_write_master_recipe(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 10. RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.chef_managed_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_recipe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_sop_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_ingredient_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_pushes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_push_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prep_task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS remote_chef_grants_select ON public.chef_managed_tenants;
CREATE POLICY remote_chef_grants_select ON public.chef_managed_tenants
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR chef_employee_id = public.current_employee_id()
    OR public.staff_is_member(business_id)
  );

DROP POLICY IF EXISTS remote_chef_grants_write ON public.chef_managed_tenants;
CREATE POLICY remote_chef_grants_write ON public.chef_managed_tenants
  FOR ALL TO authenticated
  USING (public.staff_can_admin_business(business_id))
  WITH CHECK (public.staff_can_admin_business(business_id));

DROP POLICY IF EXISTS remote_chef_master_recipes_select ON public.master_recipes;
CREATE POLICY remote_chef_master_recipes_select ON public.master_recipes
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR created_by = public.current_employee_id()
    OR (
      owner_business_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.employees e
        WHERE e.auth_user_id = auth.uid()
          AND e.access_level = 'remote_chef'
      )
    )
    OR public.user_can_access_business(owner_business_id)
    OR EXISTS (
      SELECT 1
      FROM public.assembly_cards ac
      WHERE ac.master_recipe_id = id
        AND public.user_can_access_business(ac.business_id)
    )
  );

DROP POLICY IF EXISTS remote_chef_master_recipes_write ON public.master_recipes;
CREATE POLICY remote_chef_master_recipes_write ON public.master_recipes
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR created_by = public.current_employee_id()
    OR public.staff_can_admin_business(owner_business_id)
  )
  WITH CHECK (
    public.is_super_admin()
    OR created_by = public.current_employee_id()
    OR public.staff_can_admin_business(owner_business_id)
  );

DROP POLICY IF EXISTS remote_chef_versions_all ON public.master_recipe_versions;
CREATE POLICY remote_chef_versions_select ON public.master_recipe_versions
  FOR SELECT TO authenticated
  USING (public.can_read_master_recipe(master_recipe_id));

DROP POLICY IF EXISTS remote_chef_versions_write ON public.master_recipe_versions;
CREATE POLICY remote_chef_versions_write ON public.master_recipe_versions
  FOR ALL TO authenticated
  USING (public.can_write_master_recipe(master_recipe_id))
  WITH CHECK (public.can_write_master_recipe(master_recipe_id));

DROP POLICY IF EXISTS remote_chef_ingredients_all ON public.master_recipe_ingredients;
CREATE POLICY remote_chef_ingredients_select ON public.master_recipe_ingredients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.master_recipe_versions v
      WHERE v.id = version_id
        AND public.can_read_master_recipe(v.master_recipe_id)
    )
  );

DROP POLICY IF EXISTS remote_chef_ingredients_write ON public.master_recipe_ingredients;
CREATE POLICY remote_chef_ingredients_write ON public.master_recipe_ingredients
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.master_recipe_versions v
      WHERE v.id = version_id
        AND public.can_write_master_recipe(v.master_recipe_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.master_recipe_versions v
      WHERE v.id = version_id
        AND public.can_write_master_recipe(v.master_recipe_id)
    )
  );

DROP POLICY IF EXISTS remote_chef_sop_all ON public.master_sop_steps;
CREATE POLICY remote_chef_sop_select ON public.master_sop_steps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.master_recipe_versions v
      WHERE v.id = version_id
        AND public.can_read_master_recipe(v.master_recipe_id)
    )
  );

DROP POLICY IF EXISTS remote_chef_sop_write ON public.master_sop_steps;
CREATE POLICY remote_chef_sop_write ON public.master_sop_steps
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.master_recipe_versions v
      WHERE v.id = version_id
        AND public.can_write_master_recipe(v.master_recipe_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.master_recipe_versions v
      WHERE v.id = version_id
        AND public.can_write_master_recipe(v.master_recipe_id)
    )
  );

DROP POLICY IF EXISTS remote_chef_maps_all ON public.tenant_ingredient_maps;
CREATE POLICY remote_chef_maps_all ON public.tenant_ingredient_maps
  FOR ALL TO authenticated
  USING (
    public.user_can_access_business(business_id)
    AND (
      public.staff_can_admin_business(business_id)
      OR public.chef_can(business_id, 'can_push_recipes')
      OR public.is_super_admin()
    )
  )
  WITH CHECK (
    public.staff_can_admin_business(business_id)
    OR public.chef_can(business_id, 'can_push_recipes')
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS remote_chef_maps_select ON public.tenant_ingredient_maps;
CREATE POLICY remote_chef_maps_select ON public.tenant_ingredient_maps
  FOR SELECT TO authenticated
  USING (public.user_can_access_business(business_id));

DROP POLICY IF EXISTS remote_chef_pushes_select ON public.recipe_pushes;
CREATE POLICY remote_chef_pushes_select ON public.recipe_pushes
  FOR SELECT TO authenticated
  USING (public.user_can_access_business(business_id));

DROP POLICY IF EXISTS remote_chef_gaps_select ON public.recipe_push_gaps;
CREATE POLICY remote_chef_gaps_select ON public.recipe_push_gaps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.recipe_pushes p
      WHERE p.id = push_id
        AND public.user_can_access_business(p.business_id)
    )
  );

DROP POLICY IF EXISTS remote_chef_cards_select ON public.assembly_cards;
CREATE POLICY remote_chef_cards_select ON public.assembly_cards
  FOR SELECT TO authenticated
  USING (public.user_can_access_business(business_id));

DROP POLICY IF EXISTS remote_chef_prep_templates_select ON public.prep_task_templates;
CREATE POLICY remote_chef_prep_templates_select ON public.prep_task_templates
  FOR SELECT TO authenticated
  USING (public.user_can_access_business(business_id));

DROP POLICY IF EXISTS remote_chef_prep_templates_write ON public.prep_task_templates;
CREATE POLICY remote_chef_prep_templates_write ON public.prep_task_templates
  FOR ALL TO authenticated
  USING (
    public.staff_can_admin_business(business_id)
    OR public.chef_can(business_id, 'can_push_recipes')
  )
  WITH CHECK (
    public.staff_can_admin_business(business_id)
    OR public.chef_can(business_id, 'can_push_recipes')
  );

DROP POLICY IF EXISTS remote_chef_prep_tasks_select ON public.prep_tasks;
CREATE POLICY remote_chef_prep_tasks_select ON public.prep_tasks
  FOR SELECT TO authenticated
  USING (public.user_can_access_business(business_id));

DROP POLICY IF EXISTS remote_chef_prep_logs_select ON public.prep_task_logs;
CREATE POLICY remote_chef_prep_logs_select ON public.prep_task_logs
  FOR SELECT TO authenticated
  USING (public.user_can_access_business(business_id));

DROP POLICY IF EXISTS remote_chef_usage_select ON public.inventory_usage_events;
CREATE POLICY remote_chef_usage_select ON public.inventory_usage_events
  FOR SELECT TO authenticated
  USING (public.user_can_access_business(business_id));

-- Permissive policies on existing tables. They grant extra access when RLS
-- is already on. They do nothing while RLS is off. They are not an ENABLE.

DROP POLICY IF EXISTS remote_chef_menu_select ON public.menu_items;
CREATE POLICY remote_chef_menu_select ON public.menu_items
  FOR SELECT TO authenticated
  USING (public.user_can_access_business(business_id));

DROP POLICY IF EXISTS remote_chef_menu_write ON public.menu_items;
CREATE POLICY remote_chef_menu_write ON public.menu_items
  FOR UPDATE TO authenticated
  USING (
    public.staff_can_admin_business(business_id)
    OR public.chef_can(business_id, 'can_edit_menu')
  )
  WITH CHECK (
    public.staff_can_admin_business(business_id)
    OR public.chef_can(business_id, 'can_edit_menu')
  );

DROP POLICY IF EXISTS remote_chef_recipes_select ON public.recipes;
CREATE POLICY remote_chef_recipes_select ON public.recipes
  FOR SELECT TO authenticated
  USING (public.user_can_access_business(business_id));

DROP POLICY IF EXISTS remote_chef_recipe_ingredients_select ON public.recipe_ingredients;
CREATE POLICY remote_chef_recipe_ingredients_select ON public.recipe_ingredients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.recipes r
      WHERE r.id = recipe_id
        AND public.user_can_access_business(r.business_id)
    )
  );

DROP POLICY IF EXISTS remote_chef_inventory_select ON public.inventory_items;
CREATE POLICY remote_chef_inventory_select ON public.inventory_items
  FOR SELECT TO authenticated
  USING (public.user_can_access_business(business_id));

DROP POLICY IF EXISTS remote_chef_orders_select ON public.orders;
CREATE POLICY remote_chef_orders_select ON public.orders
  FOR SELECT TO authenticated
  USING (public.user_can_access_business(business_id));

DROP POLICY IF EXISTS remote_chef_order_items_select ON public.order_items;
CREATE POLICY remote_chef_order_items_select ON public.order_items
  FOR SELECT TO authenticated
  USING (public.user_can_access_business(business_id));

DROP POLICY IF EXISTS remote_chef_supplier_items_select ON public.supplier_order_items;
CREATE POLICY remote_chef_supplier_items_select ON public.supplier_order_items
  FOR SELECT TO authenticated
  USING (
    public.staff_is_member(business_id)
    OR public.chef_can(business_id, 'can_view_financials')
    OR public.is_super_admin()
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chef_managed_tenants TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_recipes TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_recipe_versions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_recipe_ingredients TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_sop_steps TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_ingredient_maps TO authenticated, service_role;
GRANT SELECT ON public.recipe_pushes TO authenticated, service_role;
GRANT SELECT ON public.recipe_push_gaps TO authenticated, service_role;
GRANT SELECT ON public.assembly_cards TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prep_task_templates TO authenticated, service_role;
GRANT SELECT, UPDATE ON public.prep_tasks TO authenticated, service_role;
GRANT SELECT ON public.prep_task_logs TO authenticated, service_role;
GRANT SELECT ON public.inventory_usage_events TO authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'assembly_cards'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.assembly_cards;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'prep_tasks'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.prep_tasks;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'prep_task_logs'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.prep_task_logs;
    END IF;
  END IF;
END $$;
