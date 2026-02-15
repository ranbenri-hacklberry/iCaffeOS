
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findBusiness() {
    console.log('🔍 Searching for recent orders to identify Business ID (Jan 26)...');

    // Search for orders created today (assuming Jan 26, 2026 based on metadata)
    const today = new Date('2026-01-26').toISOString().split('T')[0];

    const { data: orders, error } = await supabase
        .from('orders')
        .select('business_id, order_number, customer_name, customer_phone, created_at')
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (orders && orders.length > 0) {
        console.log(`✅ Found ${orders.length} orders from today!`);
        const bizIds = [...new Set(orders.map(o => o.business_id))];
        console.log('📊 Business IDs found:', bizIds);

        orders.forEach(o => {
            console.log(`- #${o.order_number} | ${o.customer_name} | ${o.customer_phone} | Biz: ${o.business_id}`);
        });

        const mainBizId = bizIds[0];
        console.log(`\n🎯 Selecting first Business ID for deep check: ${mainBizId}`);
        await checkLoyalty(mainBizId);
    } else {
        console.log('❌ No orders found for today via ANON key. Trying all recent...');
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('business_id, order_number, customer_phone, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        if (recentOrders && recentOrders.length > 0) {
            console.log('📊 Recent orders found:', recentOrders.map(o => `${o.order_number} (${o.business_id})`));
            await checkLoyalty(recentOrders[0].business_id);
        } else {
            console.log('❌ No orders at all. RLS might be blocking everything.');
        }
    }
}

async function checkLoyalty(businessId) {
    const phones = ['0537457891', '0555667570', '0547323055', '0584000806'];

    console.log(`\n💳 Checking cards for Biz ${businessId}...`);
    const { data: cards } = await supabase
        .from('loyalty_cards')
        .select('*')
        .in('customer_phone', phones)
        .eq('business_id', businessId);

    if (cards && cards.length > 0) {
        cards.forEach(c => console.log(`- ${c.customer_phone}: Balance ${c.points_balance}`));
    } else {
        console.log('No cards found.');
    }

    console.log(`\n📜 Checking transactions for Biz ${businessId}...`);
    const { data: txs } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (txs && txs.length > 0) {
        txs.forEach(t => console.log(`- ${t.customer_phone}: ${t.change_amount} pts [${t.transaction_type}] at ${t.created_at}`));
    } else {
        console.log('No transactions found.');
    }
}

findBusiness();
