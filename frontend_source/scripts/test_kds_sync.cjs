require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_LOCAL_SUPABASE_SERVICE_KEY || process.env.LOCAL_SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
    console.error('Missing Local Supabase Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';

async function injectOrders() {
    console.log(`🚀 Injecting 5 Stress Test Orders into Local DB (${supabaseUrl})`);

    // Using simple/fake items just for testing reactivity
    const ordersToInsert = [];
    const itemsToInsert = [];

    for (let i = 1; i <= 5; i++) {
        const orderId = uuidv4();
        const customerName = `Test Customer ${i} 🧪`;

        ordersToInsert.push({
            id: orderId,
            business_id: BUSINESS_ID,
            customer_name: customerName,
            order_status: 'new',
            is_paid: false,
            total_amount: Math.floor(Math.random() * 50) + 10,
            payment_method: 'cash',
            order_origin: 'pos',
            created_at: new Date().toISOString()
        });

        itemsToInsert.push({
            id: uuidv4(),
            order_id: orderId,
            menu_item_id: 10,  // Using an actual existing item ID from earlier logs
            quantity: 1,
            price: 10,
            item_status: 'new',
            business_id: BUSINESS_ID
        });
    }

    // Insert Orders
    const { error: orderError } = await supabase.from('orders').insert(ordersToInsert);
    if (orderError) {
        console.error('Failed to insert orders:', orderError);
        return;
    }

    // Insert Items
    const { error: itemError } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemError) {
        console.error('Failed to insert items:', itemError);
        return;
    }

    console.log(`✅ Successfully injected 5 test orders for stress testing!`);
    console.log(`👀 Check your KDS screen - the UI should have updated instantly via Dexie!`);

    console.log('\n--- WAN Simualtion Instructions ---');
    console.log('To simulate a network disconnect, you can disable your Wi-Fi/Ethernet.');
    console.log('The Local Docker instance will remain alive, and the UI should stay completely interactive!');
}

injectOrders();
