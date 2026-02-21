
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://gxzsxvbercpkgxraiaex.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g'
);

async function inspect() {
    console.log('--- Inspecting Inventory 2222 ---');
    const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('business_id', '22222222-2222-2222-2222-222222222222')
        .limit(5);

    if (error) console.error(error);
    else console.log(data);
}

inspect();
