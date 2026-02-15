
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function addOrder() {
    console.log('Inserting dummy order...');
    const { error } = await supabase.from('orders').insert({
        business_id: 1,
        total_amount: 50,
        order_status: 'ready',
        customer_name: 'יוסי דמה',
        created_at: new Date().toISOString()
    });

    if (error) console.error('Error:', error);
    else console.log('✅ Order added! Now ask Maia.');
}

addOrder();
