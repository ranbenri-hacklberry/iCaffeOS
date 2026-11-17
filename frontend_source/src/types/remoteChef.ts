/**
 * Remote Chef entities.
 * Tenant id in the product brief is businesses.id, stored as business_id.
 * Executable schema: supabase/migrations/20261117120000_remote_chef_architecture.sql
 */

export type ChefAccessLevel = 'Worker' | 'Manager' | 'Admin' | 'remote_chef';

export type ChefPermission =
  | 'can_edit_menu'
  | 'can_push_recipes'
  | 'can_view_financials';

export type MasterVersionStatus = 'draft' | 'published' | 'retired';

export type SopPhase = 'prep' | 'assembly';

export type RecipePushStatus = 'applied' | 'partial';

export type PrepTaskStatus = 'open' | 'done' | 'skipped';

export type InventoryUsageEventType = 'consumption' | 'receipt';

export interface ChefManagedTenant {
  id: string;
  chef_employee_id: string;
  business_id: string;
  can_edit_menu: boolean;
  can_push_recipes: boolean;
  can_view_financials: boolean;
  granted_by: string | null;
  granted_at: string;
  revoked_at: string | null;
  notes: string | null;
}

export interface MasterRecipe {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  kds_routing_logic: string;
  is_archived: boolean;
  /** Null is the global library. A value keeps the recipe private to that business. */
  owner_business_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MasterRecipeVersion {
  id: string;
  master_recipe_id: string;
  version_no: number;
  status: MasterVersionStatus;
  yield_quantity: number;
  yield_unit: string;
  /** Usable yield, 0–100. Null means 100% at push time. */
  yield_percent: number | null;
  suggested_price: number | null;
  target_prep_seconds: number | null;
  plating_media_url: string | null;
  allergen_tags: string[];
  notes: string | null;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MasterRecipeIngredient {
  id: string;
  version_id: string;
  canonical_name: string;
  canonical_key: string;
  quantity_grams: number;
  yield_percent: number | null;
  allergen_tags: string[];
  is_optional: boolean;
  sort_order: number;
}

export interface MasterSopStep {
  id: string;
  version_id: string;
  phase: SopPhase;
  step_order: number;
  title: string;
  instruction: string;
  quantity_grams: number | null;
  duration_seconds: number | null;
  media_url: string | null;
}

export interface TenantIngredientMap {
  id: string;
  business_id: string;
  canonical_key: string;
  inventory_item_id: number;
  /** Grams represented by one inventory_items.current_stock unit. */
  grams_per_stock_unit: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecipePush {
  id: string;
  master_version_id: string;
  business_id: string;
  menu_item_id: number | null;
  recipe_id: number | null;
  status: RecipePushStatus;
  gap_count: number;
  pushed_by: string | null;
  pushed_at: string;
  details: {
    required_gaps?: number;
  };
}

export interface RecipePushGap {
  id: string;
  push_id: string;
  canonical_key: string;
  canonical_name: string;
  quantity_grams: number | null;
  is_optional: boolean;
  reason: string;
}

export interface AssemblyCardIngredient {
  mapped: boolean;
  reason: string | null;
  inventory_item_id: number | null;
  quantity_used: number | null;
  unit_of_measure: string | null;
  canonical_name: string;
  canonical_key: string;
  quantity_grams: number;
  yield_percent: number | null;
  is_optional: boolean;
}

export interface AssemblyCardStep {
  phase: SopPhase;
  step_order: number;
  title: string;
  instruction: string;
  quantity_grams: number | null;
  duration_seconds: number | null;
  media_url: string | null;
}

/** Denormalized payload stored on assembly_cards.card and in Dexie. */
export interface AssemblyCardPayload {
  recipe_name: string;
  version_no: number;
  complete: boolean;
  yield_quantity: number;
  yield_unit: string;
  yield_percent: number | null;
  allergen_tags: string[];
  target_prep_seconds: number | null;
  plating_media_url: string | null;
  steps: AssemblyCardStep[];
  ingredients: AssemblyCardIngredient[];
}

export interface AssemblyCard {
  id: string;
  business_id: string;
  menu_item_id: number;
  master_recipe_id: string | null;
  master_version_id: string | null;
  version_no: number | null;
  target_prep_seconds: number | null;
  plating_media_url: string | null;
  card: AssemblyCardPayload;
  updated_at: string;
}

export interface PrepTaskTemplate {
  id: string;
  business_id: string;
  menu_item_id: number | null;
  master_version_id: string | null;
  name: string;
  station: string | null;
  target_yield_grams: number | null;
  target_minutes: number | null;
  sort_order: number;
  /** 0 = Sunday … 6 = Saturday. Null means every day. */
  days_of_week: number[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrepTask {
  id: string;
  business_id: string;
  template_id: string | null;
  service_date: string;
  menu_item_id: number | null;
  master_version_id: string | null;
  name: string;
  station: string | null;
  target_yield_grams: number | null;
  target_minutes: number | null;
  sort_order: number;
  status: PrepTaskStatus;
  created_by: string | null;
  updated_at: string;
}

export interface PrepTaskLog {
  id: string;
  prep_task_id: string;
  business_id: string;
  client_mutation_id: string;
  checked_at: string;
  checked_by: string | null;
  actual_yield_grams: number | null;
  notes: string | null;
  created_at: string;
  /** Local-only. True until offline_queue_v3 flushes COMPLETE_PREP_TASK. */
  pending_sync?: boolean;
}

export interface InventoryUsageEvent {
  id: string;
  business_id: string | null;
  inventory_item_id: number;
  event_type: InventoryUsageEventType;
  quantity: number;
  unit: string | null;
  source: string;
  occurred_at: string;
}

export interface RecipePushResult {
  push_id: string;
  status: RecipePushStatus;
  business_id: string;
  menu_item_id: number;
  recipe_id: number;
  master_version_id: string;
  gap_count: number;
  required_gaps: number;
}

export interface PrepTaskCompletionResult {
  prep_task_id: string;
  log_id: string;
  business_id: string;
  status: 'done';
}

export interface FoodCostRow {
  menu_item_id: number;
  name: string;
  price: number | null;
  theoretical_cost: number;
  food_cost_pct: number | null;
}

export interface UsageVarianceRow {
  inventory_item_id: number;
  name: string;
  theoretical_qty: number;
  /** Null until inventory_usage_events exists inside the window. */
  actual_qty: number | null;
  /** actual − theoretical. Positive means more left the shelf than tickets explain. */
  unexplained_qty: number | null;
  unit: string | null;
}

export interface KdsTelemetry {
  sample_size: number;
  avg_ticket_seconds: number | null;
  target_seconds: number | null;
  breach: boolean;
}

export interface StockAlertRow {
  inventory_item_id: number;
  name: string;
  current_stock: number | null;
  low_stock_alert: number | null;
  suggested_order_qty: number;
  supplier_id: number | null;
}

export interface PrepTelemetry {
  service_date: string;
  open: number;
  done: number;
  skipped: number;
  actual_yield_grams: number | null;
}

export interface ChefBusinessTelemetry {
  business_id: string;
  name: string | null;
  ledger_active: boolean;
  financials_visible: boolean;
  /** Null when the chef lacks can_view_financials and is not staff or super admin. */
  food_cost: FoodCostRow[] | null;
  variance: UsageVarianceRow[];
  kds: KdsTelemetry;
  stock_alerts: StockAlertRow[];
  prep: PrepTelemetry;
}

export interface ChefCommandCenterTelemetry {
  generated_at: string;
  window_from: string;
  window_to: string;
  businesses: ChefBusinessTelemetry[];
}
