import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';
const ITEM_ID = 265; // Cappuccino

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyFix() {
    console.log(`🔍 Verifying inventory fix for Business: ${BUSINESS_ID}`);

    // 1. Check Recipe
    const { data: recipe } = await supabase.from('recipes').select('id, business_id').eq('menu_item_id', ITEM_ID).single();
    if (!recipe) {
        console.error('❌ Recipe lost?!');
        return;
    }
    console.log(`✅ Recipe ${recipe.id} belongs to Business ${recipe.business_id}`);

    // 2. Report Initial Stock
    const { data: invItem } = await supabase.from('inventory_items').select('current_stock').eq('id', 464).single();
    console.log(`🥛 Initial Cow Milk Stock: ${invItem.current_stock}`);

    // 3. Submit Order
    console.log('\n🚀 Submitting test order (submit_order_v3)...');
    const { data: orderResult, error: oError } = await supabase.rpc('submit_order_v3', {
        p_business_id: BUSINESS_ID,
        p_final_total: 10,
        p_order_type: 'dine_in',
        p_payment_method: 'cash',
        p_customer_name: 'Inventory Verify Bot',
        p_customer_phone: '0540000000',
        p_items: [{
            item_id: ITEM_ID,
            name: 'קפוצ׳ינו (test)',
            price: 10,
            quantity: 1, // Should deduct 0.2
            kds_routing_logic: 'MADE_TO_ORDER',
            item_status: 'in_progress',
            is_hot_drink: true
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

    // 4. Check Stock Again
    const { data: finalInv } = await supabase.from('inventory_items').select('current_stock').eq('id', 464).single();

    console.log(`🥛 Final Cow Milk Stock: ${finalInv.current_stock}`);

    const diff = invItem.current_stock - finalInv.current_stock;
    if (diff > 0) {
        console.log(`💪 SUCCESS: Stock decreased by ${diff.toFixed(2)}`);
    } else {
        console.log('❌ FAILURE: Stock did not change.');
    }

    // cleanup
    await supabase.from('orders').delete().eq('id', orderResult.order_id);
}

verifyFix();
