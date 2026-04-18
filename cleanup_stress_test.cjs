const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('/Users/icaffeos/icaffeos/frontend_source/.env', 'utf8');
const subUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const subKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(subUrl, subKey);

async function cleanup() {
    console.log('🧹 CLEANING UP STRESS TEST DATA...');
    
    // 1. Find all order_items with the specific note
    const { data: items, error: itemError } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('notes', 'Stress Test Order');
        
    if (itemError) {
        console.error('Error finding items:', itemError.message);
        return;
    }
    
    if (!items || items.length === 0) {
        console.log('No stress test items found.');
        return;
    }
    
    const orderIds = [...new Set(items.map(i => i.order_id))];
    console.log(`Found ${orderIds.length} orders to delete.`);
    
    // 2. Delete the orders (Cascade should handle items and loyalty)
    const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds);
        
    if (deleteError) {
        console.error('Error deleting orders:', deleteError.message);
    } else {
        console.log('✅ Stress test orders deleted successfully.');
    }
}

cleanup();
