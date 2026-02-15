import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkOrders() {
    // Check all orders
    const { data: allOrders, error: err1 } = await supabase
        .from('orders')
        .select('id, business_id, customer_name, total_amount, order_status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
    
    console.log('📦 All Orders (last 10):');
    console.log(JSON.stringify(allOrders, null, 2));
    
    if (err1) console.log('Error:', err1);
    
    // Check orders for specific business
    const { data: bizOrders, error: err2 } = await supabase
        .from('orders')
        .select('id, business_id, customer_name, total_amount')
        .eq('business_id', '22222222-2222-2222-2222-222222222222');
    
    console.log('\n📦 Orders for iCaffe (22222222-2222-2222-2222-222222222222):');
    console.log(JSON.stringify(bizOrders, null, 2));
    
    // List all business IDs with orders
    const { data: bizIds } = await supabase
        .from('orders')
        .select('business_id')
        .limit(50);
    
    const uniqueBiz = [...new Set(bizIds?.map(o => o.business_id) || [])];
    console.log('\n🏢 Business IDs with orders:', uniqueBiz);
}

checkOrders();
