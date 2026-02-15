import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';
const ITEM_ID = 265; // Cappuccino
const SOY_MILK_MOD_ID = '93aab4e8-bc4c-4d62-b58e-c20d30327a54';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyModDeduction() {
    console.log(`🔍 Verifying Soy Milk Modifier deduction...`);

    // 1. Initial Stock
    const { data: initStock } = await supabase.from('inventory_items').select('current_stock').eq('id', 459).single();
    console.log(`🥛 Initial Soy Milk Stock (459): ${initStock.current_stock}`);

    // 2. Submit Order with Modifier
    console.log('\n🚀 Submitting test order with Soy Milk...');
    const { data: orderResult, error: oError } = await supabase.rpc('submit_order_v3', {
        p_business_id: BUSINESS_ID,
        p_final_total: 12,
        p_order_type: 'dine_in',
        p_payment_method: 'cash',
        p_customer_name: 'Soy Milk Tester',
        p_customer_phone: '0540000000',
        p_items: [{
            item_id: ITEM_ID,
            name: 'קפוצ׳ינו סויה',
            price: 10,
            quantity: 1,
            kds_routing_logic: 'MADE_TO_ORDER',
            item_status: 'in_progress',
            is_hot_drink: true,
            mods: [
                {
                    id: SOY_MILK_MOD_ID,
                    name: 'חלב סויה',
                    price: 2
                }
            ]
        }]
    });

    if (oError) {
        console.error('❌ Order submission failed:', oError.message);
        return;
    }
    console.log(`✅ Order submitted! ID: ${orderResult.order_id}`);

    // Wait for trigger
    console.log('Waiting 5 seconds for inventory triggers...');
    await new Promise(r => setTimeout(r, 5000));

    // 3. Check Stock Again
    const { data: finalStock } = await supabase.from('inventory_items').select('current_stock').eq('id', 459).single();
    console.log(`🥛 Final Soy Milk Stock: ${finalStock.current_stock}`);

    const diff = initStock.current_stock - finalStock.current_stock;
    if (diff > 0) {
        // Expected logic:
        // Logic says: if mod_qty > 5 (it is 200) -> 200/1000 = 0.2 deduction
        console.log(`💪 SUCCESS: Stock decreased by ${diff.toFixed(2)} (Expected ~0.2)`);
    } else {
        console.log('❌ FAILURE: Stock did not change.');
    }

    // cleanup
    await supabase.from('orders').delete().eq('id', orderResult.order_id);
}

verifyModDeduction();
