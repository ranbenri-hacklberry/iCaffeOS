
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve('frontend_source', '.env') });

const supabaseUrl = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.LOCAL_SUPABASE_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Fallback to what we saw in the .env file if env loading fails

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLoyalty() {
    console.log('\n--- Checking Recent Orders ---');
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, customer_name, customer_phone')
        .order('created_at', { ascending: false })
        .limit(10);

    if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
    }

    console.table(orders);

    const phonesToCheck = new Set(['0548888888']);
    orders.forEach(o => {
        if (o.customer_name && (o.customer_name.includes('עמית') || o.customer_name.toLowerCase().includes('amit'))) {
            phonesToCheck.add(o.customer_phone);
            console.log(`Found Amit: ${o.customer_name} (${o.customer_phone})`);
        }
    });

    console.log('\n--- Checking Customers Status ---');
    const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('*')
        .in('phone', Array.from(phonesToCheck));

    if (custError) console.error('Error fetching customers:', custError);
    else console.table(customers);

    // Check specific transactions for these customers
    console.log('\n--- Checking Loyalty Transactions ---');
    const { data: transactions, error: txError } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .in('customer_phone', Array.from(phonesToCheck))
        .order('created_at', { ascending: false });

    if (txError) console.error('Error fetching transactions:', txError);
    else console.table(transactions);
}

checkLoyalty();
