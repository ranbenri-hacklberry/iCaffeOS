
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkWithAuth() {
    console.log('🔐 Logging in as ran@mail.com...');

    // Login to get a token
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'ran@mail.com',
        password: '1234'
    });

    if (authError) {
        console.error('❌ Login Failed:', authError.message);
        return;
    }

    const token = authData.session.access_token;
    console.log('✅ Login Successful! User:', authData.user.email);

    // Check if we have business_id in metadata
    const businessId = authData.user.user_metadata?.business_id;
    console.log('🏢 Business ID (Metadata):', businessId);

    // Create a new client with the user's token
    const authClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });

    // 1. Find recent orders
    console.log('\n📦 Fetching recent orders...');
    const { data: orders, error: orderErr } = await authClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (orderErr) {
        console.error('❌ Orders Error:', orderErr.message);
    } else {
        orders.forEach(o => console.log(`- #${o.order_number} | ${o.customer_name} | Biz: ${o.business_id} | ${o.created_at}`));
    }

    // 2. Check Loyalty
    const phones = ['0537457891', '0555667570', '0547323055', '0584000806'];
    console.log('\n💳 Checking Loyalty Cards...');
    const { data: cards } = await authClient
        .from('loyalty_cards')
        .select('*')
        .in('customer_phone', phones);

    if (cards && cards.length > 0) {
        cards.forEach(c => console.log(`- ${c.customer_phone}: Balance ${c.points_balance}`));
    } else {
        console.log('No cards found.');
    }

    // 3. Check Transactions
    console.log('\n📜 Checking Transactions...');
    const { data: txs } = await authClient
        .from('loyalty_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (txs && txs.length > 0) {
        txs.forEach(t => console.log(`- ${t.customer_phone || 'N/A'}: ${t.change_amount} pts at ${t.created_at}`));
    } else {
        console.log('No transactions found.');
    }
}

checkWithAuth();
