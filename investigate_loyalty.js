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

async function investigate() {
    const BIZ_ID = '11111111-1111-1111-1111-111111111111';

    console.log('--- Orders for Biz 111111 (Last 5) ---');
    const { data: orders, error: oErr } = await supabase
        .from('orders')
        .select('id, created_at, customer_phone, total_amount, order_status, order_number')
        .eq('business_id', BIZ_ID)
        .order('created_at', { ascending: false })
        .limit(5);

    if (oErr) console.error('Orders error:', oErr);
    else console.log(orders);

    if (orders && orders.length > 0) {
        const latestOrderId = orders[0].id;
        const latestPhone = orders[0].customer_phone;
        console.log(`\n--- Latest Order ID: ${latestOrderId} Customer: ${latestPhone} ---`);

        console.log('\n--- Loyalty Transactions for this Order ---');
        const { data: transactions, error: tErr } = await supabase
            .from('loyalty_transactions')
            .select('*')
            .eq('order_id', latestOrderId);

        if (tErr) console.error('Transactions error:', tErr);
        else console.log(transactions);

        if (latestPhone) {
            console.log(`\n--- Loyalty Card for ${latestPhone} ---`);
            const { data: card, error: cErr } = await supabase
                .from('loyalty_cards')
                .select('*')
                .eq('customer_phone', latestPhone.replace(/\D/g, ''))
                .eq('business_id', BIZ_ID);

            if (cErr) console.error('Card error:', cErr);
            else console.log(card);
        }
    }
}

investigate();
