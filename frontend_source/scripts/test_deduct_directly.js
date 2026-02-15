import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';
const ORDER_ID = '0a1653d5-0cf8-4f9d-b46f-17de421432ed'; // From previous output

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInventoryDeductDirectly() {
    console.log(`🔧 Testing deduct_inventory_for_order DIRECTLY on Order: ${ORDER_ID}`);

    // Check stock before
    const { data: before } = await supabase.from('inventory_items').select('current_stock').eq('id', 464).single();
    console.log(`Before: ${before.current_stock}`);

    // CALL THE FUNCTION
    const { error } = await supabase.rpc('deduct_inventory_for_order', {
        p_order_id: ORDER_ID,
        p_business_id: BUSINESS_ID
    });

    if (error) {
        console.error('❌ RPC Failed:', error.message);
    } else {
        console.log('✅ RPC Success.');
    }

    // Check stock after
    const { data: after } = await supabase.from('inventory_items').select('current_stock').eq('id', 464).single();
    console.log(`After: ${after.current_stock}`);

    if (before.current_stock > after.current_stock) {
        console.log('🎉 IT WORKED DIRECTLY!');
    } else {
        console.log('💀 STILL FAILED DIRECTLY.');
    }
}

testInventoryDeductDirectly();
