
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkSchema() {
    console.log('🔍 Checking Order Structure...');
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .limit(1);

    if (orders && orders.length > 0) {
        console.log('Sample Order Keys:', Object.keys(orders[0]));
        if (orders[0].items) {
            console.log('Items column found (JSON):', JSON.stringify(orders[0].items, null, 2));
        } else {
            console.log('No "items" column. Checking for order_items table...');
            const { data: orderItems } = await supabase.from('order_items').select('*').limit(1);
            console.log('Order Items table:', orderItems ? 'Exists' : 'Not found');
        }
    } else {
        console.log('No orders found to check.');
    }
}

checkSchema();
