import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';
const ITEM_ID = 265; // Cappuccino

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyFixDetailed() {
    console.log(`🔍 Verifying inventory fix (DETAILED)`);

    // 1. Initial Stock
    const { data: invItem } = await supabase.from('inventory_items').select('current_stock').eq('id', 464).single();
    console.log(`🥛 Initial Cow Milk Stock: ${invItem.current_stock}`);

    // 2. Submit Order
    console.log('\n🚀 Submitting test order...');
    const { data: orderResult, error: oError } = await supabase.rpc('submit_order_v3', {
        p_business_id: BUSINESS_ID,
        p_final_total: 10,
        p_items: [{
            item_id: ITEM_ID,
            name: 'DETAILED TEST',
            price: 10,
            quantity: 5, // Deduct 1.0 (0.2 * 5)
            item_status: 'in_progress'
        }]
    });

    if (oError) {
        console.error('❌ Order submission failed:', oError.message);
        return;
    }
    console.log(`✅ Order submitted! ID: ${orderResult.order_id}`);

    // 3. Inspect Order Items immediately
    const { data: ois } = await supabase.from('order_items').select('*').eq('order_id', orderResult.order_id);
    console.log('Order Items in DB:', ois);

    // 4. Check Stock Again
    console.log('Waiting for triggers...');
    await new Promise(r => setTimeout(r, 3000));

    const { data: finalInv } = await supabase.from('inventory_items').select('current_stock').eq('id', 464).single();
    console.log(`🥛 Final Cow Milk Stock: ${finalInv.current_stock}`);

    // cleanup
    // await supabase.from('orders').delete().eq('id', orderResult.order_id);
}

verifyFixDetailed();
