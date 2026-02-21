
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://gxzsxvbercpkgxraiaex.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g'
);

async function checkAll() {
    const bizId = '22222222-2222-2222-2222-222222222222';
    console.log(`Checking data for business: ${bizId}`);

    // List of tables to check
    const tables = [
        'menu_items',
        'item_category',
        'optiongroups',
        'optionvalues',
        'recipes',
        'ingredients',
        'prepared_items_inventory',
        'inventory_items',
        'employees',
        'businesses',
        'menuitemoptions' // Junction
    ];

    for (const table of tables) {
        // Try to count rows for this business
        // Note: Some tables might not have 'business_id' column or might be named differently
        // We will try/catch
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })
                .eq('business_id', bizId);

            if (error) {
                console.log(`[${table}] Error: ${error.message} (rls? column missing?)`);
            } else {
                console.log(`[${table}] Count: ${count}`);
            }
        } catch (e) {
            console.log(`[${table}] Exception: ${e.message}`);
        }
    }
}

checkAll();
