import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1MDk5NzcsImV4cCI6MjA0NzA4NTk3N30.ts3om9lTE_zNnHLxLVGO_shboNWJJlxKqiTLqYdTF-I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrder1764() {
    console.log('🔍 Checking order 1764...\n');

    // Get the order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', '1764')
        .single();

    if (orderError) {
        console.error('❌ Error fetching order:', orderError);
        return;
    }

    console.log('📋 Order Details:');
    console.log('  ID:', order.id);
    console.log('  Number:', order.order_number);
    console.log('  Customer:', order.customer_name);
    console.log('  Status:', order.order_status);
    console.log('  Created:', order.created_at);
    console.log('  Total:', order.total_amount);
    console.log('');

    // Get order items
    const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*, menu_items(id, name, category)')
        .eq('order_id', order.id);

    if (itemsError) {
        console.error('❌ Error fetching items:', itemsError);
        return;
    }

    console.log(`📦 Order Items (${items.length}):`);
    items.forEach((item, idx) => {
        console.log(`\n  Item ${idx + 1}:`);
        console.log('    ID:', item.id);
        console.log('    Menu Item ID:', item.menu_item_id);
        console.log('    Menu Item Name:', item.menu_items?.name || 'NOT FOUND');
        console.log('    Category:', item.menu_items?.category || 'N/A');
        console.log('    Quantity:', item.quantity);
        console.log('    Status:', item.item_status);
        console.log('    Price:', item.price);
        console.log('    Mods:', item.mods);
        console.log('    Notes:', item.notes);
    });

    console.log('\n\n🔍 Checking for menu_item_id mismatches...');

    for (const item of items) {
        if (!item.menu_items) {
            console.log(`\n⚠️ PROBLEM FOUND!`);
            console.log(`  Order Item ID: ${item.id}`);
            console.log(`  Menu Item ID: ${item.menu_item_id}`);
            console.log(`  ❌ This menu_item_id does NOT exist in menu_items table!`);

            // Try to find what this ID might have been
            const { data: allMenuItems } = await supabase
                .from('menu_items')
                .select('id, name, category')
                .limit(5);

            console.log(`\n  📋 Sample of existing menu items:`);
            allMenuItems?.forEach(mi => {
                console.log(`    - ${mi.id}: ${mi.name} (${mi.category})`);
            });
        }
    }
}

checkOrder1764().catch(console.error);
