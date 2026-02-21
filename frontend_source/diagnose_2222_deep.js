
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://gxzsxvbercpkgxraiaex.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g'
);

async function diagnose() {
    console.log('--- DIAGNOSIS STARTED ---');
    const bizId = '22222222-2222-2222-2222-222222222222';

    // 1. Check Categories
    console.log('\n1. Checking Categories for', bizId);
    const { data: cats, error: catError } = await supabase
        .from('item_category')
        .select('*')
        .eq('business_id', bizId);

    if (catError) console.error('Cat Error:', catError);
    else console.log('Categories found:', cats?.length);
    if (cats?.length) console.log('Categories:', cats.map(c => ({ id: c.id, name: c.name, hidden: c.is_hidden, deleted: c.is_deleted })));

    // 2. Check Menu Items (Filtered)
    console.log('\n2. Checking Menu Items (standard filter)');
    const { data: items, error: itemError } = await supabase
        .from('menu_items')
        .select('id, name, is_deleted')
        .eq('business_id', bizId)
        .not('is_deleted', 'eq', true); // Mimic app logic

    if (itemError) console.error('Item Error:', itemError);
    else console.log('Active Items found:', items?.length);

    // 3. Check Menu Items (UNFILTERED)
    console.log('\n3. Checking Menu Items (ALL for biz)');
    const { data: allItems, error: allItemError } = await supabase
        .from('menu_items')
        .select('id, name, is_deleted, business_id')
        .eq('business_id', bizId);

    if (allItemError) console.error('All Item Error:', allItemError);
    else console.log('Total Items found (including deleted):', allItems?.length);
    if (allItems?.length) {
        console.log('Sample items:', allItems.slice(0, 3));
        const deletedCount = allItems.filter(i => i.is_deleted).length;
        console.log(`Deleted items count: ${deletedCount}`);
    }

    // 4. Check ANY item from table (to verify connection/RLS)
    console.log('\n4. Checking ANY item from table (limit 1)');
    const { data: anyItem, error: anyError } = await supabase
        .from('menu_items')
        .select('id, business_id')
        .limit(1);

    if (anyError) console.error('Any Item Error:', anyError);
    else console.log('Can I see *any* item?', anyItem?.length > 0 ? 'YES' : 'NO');
    if (anyItem?.length) console.log('Sample business_id seen:', anyItem[0].business_id);
}

diagnose();
