-- Add business_id to prepared_items_inventory to fix schema cache error
-- and enable multi-tenant isolation.
-- 1. Add column
ALTER TABLE public.prepared_items_inventory
ADD COLUMN IF NOT EXISTS business_id UUID;
-- 2. Backfill data from parent menu_items
UPDATE public.prepared_items_inventory pi
SET business_id = mi.business_id
FROM public.menu_items mi
WHERE pi.item_id = mi.id
    AND pi.business_id IS NULL;
-- 3. Add Index for performance
CREATE INDEX IF NOT EXISTS idx_prepared_items_inventory_business_id ON public.prepared_items_inventory(business_id);
-- 4. Enable RLS (Row Level Security)
ALTER TABLE public.prepared_items_inventory ENABLE ROW LEVEL SECURITY;
-- 5. Add RLS Policies
DROP POLICY IF EXISTS "Prepared items isolation" ON public.prepared_items_inventory;
CREATE POLICY "Prepared items isolation" ON public.prepared_items_inventory FOR ALL USING (business_id = current_user_business_id()) WITH CHECK (business_id = current_user_business_id());
-- 6. Add Trigger to auto-set business_id on insert
DROP TRIGGER IF EXISTS trigger_set_business_id_prepared_items ON public.prepared_items_inventory;
CREATE TRIGGER trigger_set_business_id_prepared_items BEFORE
INSERT ON public.prepared_items_inventory FOR EACH ROW EXECUTE FUNCTION public.set_business_id_automatically();