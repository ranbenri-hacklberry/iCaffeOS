
import { createClient } from '@supabase/supabase-js';

// ADMIN Credentials (SERVICE_ROLE) - Bypasses RLS to ensure we find everything
const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
// WARNING: This key can do anything. Use with care.
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvzjF19HkGqF1qg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ORDERS_TO_FIX = [
    "ac1b6476-30bb-4ce4-93b8-d147914886f3", // Maya 26/01
    "e5402467-da03-4d95-a790-5d5c81ff4b3c", // Amit 25/01
    "74dca79f-44c5-4d55-879f-179b5bc77eeb", // Amit 25/01
    "497070a1-1824-4355-b34d-471b16b0bcea", // Maya 23/01
    "913a88aa-193c-4e5c-9af8-764ef24cc14d", // Maya 22/01
    "d15450bd-e035-4d66-bab5-067a148cea16", // Maya 22/01
    "63d73da7-9e7f-47cd-9628-035ae7eb7f5f", // Maya 20/01
    "e781a196-a7f7-4b0a-93c8-8df9da50a55e", // Maya 20/01
    "0461226b-61e4-4d43-9468-f12fe1e56b23", // Maya 20/01
    "9cf04246-0a8c-4a62-babf-6fcc63995aa4", // Maya 20/01
    "043a9b1f-d563-42c3-a7d7-fe86a9a2919a", // Maya 20/01
    "fd48e6a9-bd79-4703-a601-82f40608b5a8", // Maya 19/01
    "6e87489b-3966-4cd3-bc78-59b12ab85a24"  // Maya 19/01
];

async function fixLoyalty() {
    console.log(`🔧 Starting ADMIN Fix for ${ORDERS_TO_FIX.length} orders...`);

    for (const orderId of ORDERS_TO_FIX) {
        // Fetch Order
        const { data: orders, error: orderErr } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId);

        if (orderErr) {
            console.error(`❌ Fetch Error ${orderId}:`, orderErr.message);
            continue;
        }

        if (!orders || orders.length === 0) {
            console.warn(`⚠️ Order ${orderId} STILL NOT FOUND even with Admin Key.`);
            continue;
        }

        const order = orders[0];

        // Fetch Items Count
        const { count: itemsCount } = await supabase
            .from('order_items')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', orderId)
            .neq('item_status', 'cancelled');

        // Check Existing
        const { data: existingTx } = await supabase
            .from('loyalty_transactions')
            .select('*')
            .eq('order_id', orderId)
            .eq('transaction_type', 'purchase');

        if (existingTx && existingTx.length > 0) {
            console.log(`⏭️ Order ${orderId.slice(0, 8)} already has a transaction. Skipping.`);
            continue;
        }

        const pointsToAdd = itemsCount || 1;

        console.log(`Processing Order ${orderId.slice(0, 8)}...`);
        console.log(`   Customer: ${order.customer_name} (${order.customer_phone})`);
        console.log(`   Points to add: ${pointsToAdd}`);

        // Execute RPC
        const { data: result, error: rpcErr } = await supabase.rpc('handle_loyalty_purchase', {
            p_phone: order.customer_phone,
            p_order_id: orderId,
            p_items_count: pointsToAdd
        });

        if (rpcErr) {
            console.error(`   ❌ RPC Failed:`, rpcErr.message);
        } else {
            console.log(`   ✅ Success! New Balance: ${result.new_balance}`);
        }

        await new Promise(r => setTimeout(r, 200));
    }

    console.log('🏁 Admin Batch Fix Complete.');
}

fixLoyalty();
