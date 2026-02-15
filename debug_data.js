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

async function checkData() {
    console.log('Using URL:', supabaseUrl);

    const { count: orderCount, error: oErr } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

    if (oErr) console.error('Orders Count Error:', oErr);
    else console.log('Total Orders in DB:', orderCount);

    const { data: recent, error: rErr } = await supabase
        .from('orders')
        .select('id, created_at, business_id, customer_name')
        .order('created_at', { ascending: false })
        .limit(5);

    if (rErr) console.error('Recent Orders Error:', rErr);
    else console.log('Recent 5 Orders:', recent);

    const bizId = '22222222-2222-2222-2222-222222222222';
    const { count: txCount, error: tErr } = await supabase
        .from('loyalty_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', bizId);

    if (tErr) console.error('Loyalty Tx Count Error:', tErr);
    else console.log('Total Loyalty Transactions for iCaffe:', txCount);
}

checkData();
