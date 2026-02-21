const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Or SERVICE_ROLE if available

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentOrders() {
    console.log('🔍 Checking recent orders in Supabase...');
    console.log('Timestamp:', new Date().toISOString());

    // Fetch last 5 orders
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('❌ Error fetching orders:', error.message);
        return;
    }

    if (data.length === 0) {
        console.log('⚠️ No orders found in Supabase.');
    } else {
        console.log(`✅ Found ${data.length} recent orders:`);
        data.forEach(o => {
            console.log(`- Order #${o.order_number} (ID: ${o.id})`);
            console.log(`  Created: ${o.created_at}`);
            console.log(`  Status: ${o.order_status}`);
            console.log(`  Business: ${o.business_id}`);
            console.log('---');
        });
    }
}

checkRecentOrders();
