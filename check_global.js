import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'frontend_source/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
    const { data: businesses, error } = await supabase
        .from('businesses')
        .select('id, name');

    if (error) console.error(error);
    else console.log('Businesses:', businesses);

    const { data: recentOrders, error: oError } = await supabase
        .from('orders')
        .select('id, created_at, business_id, customer_name, order_number')
        .order('created_at', { ascending: false })
        .limit(10);

    if (oError) console.error(oError);
    else console.log('Recent 10 Orders Global:', recentOrders);
}

checkAll();
