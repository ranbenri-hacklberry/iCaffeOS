-- Add business_id to recurring_tasks table for multi-tenancy support
-- This enables proper filtering of tasks by business

ALTER TABLE public.recurring_tasks
ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_business_id
ON public.recurring_tasks(business_id);

-- Update existing tasks to assign them to a business (optional - run manually if needed)
-- UPDATE public.recurring_tasks SET business_id = 'your-business-uuid' WHERE business_id IS NULL;

COMMENT ON COLUMN public.recurring_tasks.business_id IS 'Business this task belongs to for multi-tenancy';
