const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('🔍 Diagnostic: Checking Orders #3671, #3672 and Menu Items...');

    // 1. Check Orders and their items
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
            id, 
            order_number, 
            order_status, 
            business_id,
            order_items (
                id, 
                menu_item_id, 
                item_status, 
                is_early_delivered,
                menu_items (
                    id, 
                    name, 
                    is_hot_drink, 
                    kds_routing_logic,
                    category
                )
            )
        `)
        .in('order_number', ['3671', '3672']);

    if (orderError) {
        console.error('❌ Order Error:', orderError);
        return;
    }

    if (!orderData || orderData.length === 0) {
        console.log('❓ Orders not found in DB!');
    } else {
        orderData.forEach(order => {
            console.log(`\n📦 Order #${order.order_number} | Status: ${order.order_status}`);
            order.order_items.forEach(item => {
                const mi = item.menu_items;
                console.log(`  - Item: ${mi?.name || 'Unknown'} | Status: ${item.item_status} | Early: ${item.is_early_delivered}`);
                console.log(`    DB Settings -> HotDrink: ${mi?.is_hot_drink} | Logic: ${mi?.kds_routing_logic} | Cat: ${mi?.category}`);
            });
        });
    }

    // 2. Sample check for some coffee items in general
    console.log('\n☕ Checking general coffee items settings...');
    const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name, is_hot_drink, kds_routing_logic, category')
        .ilike('name', '%אספרסו%')
        .limit(5);

    if (menuItems) {
        menuItems.forEach(i => {
            console.log(`  - ${i.name} | Hot: ${i.is_hot_drink} | Logic: ${i.kds_routing_logic} | Cat: ${i.category}`);
        });
    }
}

check().catch(e => console.error(e));
