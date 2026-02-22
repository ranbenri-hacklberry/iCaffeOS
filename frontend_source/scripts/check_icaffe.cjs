const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';
const supabase = createClient(supabaseUrl, supabaseKey);

const ICAFFE_BIZ_ID = '22222222-2222-2222-2222-222222222222';

async function check() {
    console.log(`🔍 Diagnostic for iCaffe (${ICAFFE_BIZ_ID})`);

    // 1. Check Orders 3671 and 3672 for iCaffe
    const { data: orders, error: oError } = await supabase
        .from('orders')
        .select(`
            id, 
            order_number, 
            order_status, 
            order_items (
                id, 
                menu_item_id, 
                item_status,
                menu_items ( name, is_hot_drink, kds_routing_logic, category, inventory_settings )
            )
        `)
        .eq('business_id', ICAFFE_BIZ_ID)
        .in('order_number', ['3671', '3672']);

    if (orders) {
        orders.forEach(o => {
            console.log(`\n📦 Order #${o.order_number} | Status: ${o.order_status}`);
            o.order_items.forEach(item => {
                const mi = item.menu_items;
                console.log(`  - ${mi?.name} | ItemStatus: ${item.item_status}`);
                console.log(`    Settings -> Hot: ${mi?.is_hot_drink} | Logic: ${JSON.stringify(mi?.kds_routing_logic)} | Settings: ${JSON.stringify(mi?.inventory_settings)}`);
            });
        });
    }

    // 2. Check "אספרסו כפול קצר" and "קורטדו" directly
    console.log('\n☕ Checking specific items...');
    const { data: menuItems } = await supabase
        .from('menu_items')
        .select('id, name, is_hot_drink, kds_routing_logic, category, inventory_settings')
        .eq('business_id', ICAFFE_BIZ_ID)
        .or('name.ilike.%אספרסו%,name.ilike.%קורטדו%');

    if (menuItems) {
        menuItems.forEach(i => {
            console.log(`  - ${i.name} | Hot: ${i.is_hot_drink} | Logic: ${JSON.stringify(i.kds_routing_logic)} | Cat: ${i.category}`);
        });
    }
}

check().catch(e => console.error(e));
