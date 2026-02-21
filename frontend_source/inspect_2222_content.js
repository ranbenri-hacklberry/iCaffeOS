
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://gxzsxvbercpkgxraiaex.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g'
);

async function inspect() {
    const bizId = '22222222-2222-2222-2222-222222222222';

    // 1. Categories
    console.log('--- Categories (2222) ---');
    const { data: cats } = await supabase.from('item_category').select('name').eq('business_id', bizId);
    console.log(cats?.map(c => c.name));

    // 2. Inventory Items
    console.log('\n--- Inventory Items (2222) [First 10] ---');
    const { data: inv } = await supabase.from('inventory_items').select('item_name, current_stock, unit_type').eq('business_id', bizId).limit(10);
    console.log(inv);

    // 3. Menu Items (1111 - Comparison)
    console.log('\n--- Menu Items (1111) [First 3] ---');
    const { data: menu1 } = await supabase.from('menu_items').select('name').eq('business_id', '11111111-1111-1111-1111-111111111111').limit(3);
    console.log(menu1);

    // 4. Check for orphaned items
    console.log('\n--- Orphaned Menu Items (NULL business_id) ---');
    const { count } = await supabase.from('menu_items').select('*', { count: 'exact', head: true }).is('business_id', null);
    console.log(`Count: ${count}`);
}

inspect();
