
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findBusinessId() {
    console.log('🔍 Searching for Order #3526 to find Business ID...');

    // We try to find the order by number. Some businesses might have same numbers, but we'll take recent.
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, business_id, order_number, customer_phone, created_at')
        .eq('order_number', '3526')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (orders && orders.length > 0) {
        const order = orders[0];
        console.log(`✅ Found Order #3526! Business ID: ${order.business_id}`);
        console.log(`   Customer: ${order.customer_phone}, Date: ${order.created_at}`);

        // Now check loyalty for this business specifically
        await checkLoyalty(order.business_id);
    } else {
        console.log('❌ Order #3526 not found or not accessible via ANON key.');

        // Try searching for any recent orders to get BIZ_ID
        const { data: anyOrders } = await supabase
            .from('orders')
            .select('business_id, order_number')
            .limit(5);

        if (anyOrders && anyOrders.length > 0) {
            console.log('📊 Found other orders. BIZ IDs:', anyOrders.map(o => o.business_id));
        }
    }
}

async function checkLoyalty(businessId) {
    console.log(`\n🔍 Checking Loyalty for Business: ${businessId}`);

    // Check specific phones from screenshot
    const phones = ['0537457891', '0555667570', '0547323055', '0584000806'];

    const { data: cards, error: cardErr } = await supabase
        .from('loyalty_cards')
        .select('*')
        .in('customer_phone', phones)
        .eq('business_id', businessId);

    if (cardErr) {
        console.error('❌ Card Error:', cardErr.message);
    } else {
        console.log('\n💳 Loyalty Cards:');
        cards.forEach(c => console.log(`- ${c.customer_phone}: Balance ${c.points_balance}, Purchased ${c.total_coffees_purchased}`));
    }

    // Check transactions
    const { data: txs, error: txErr } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(10);

    if (txErr) {
        console.error('❌ Transaction Error:', txErr.message);
    } else {
        console.log('\n📜 Recent Transactions:');
        txs.forEach(t => console.log(`- ${t.customer_phone}: Change ${t.change_amount}, Type ${t.transaction_type}, Date ${t.created_at}`));
    }
}

findBusinessId();
