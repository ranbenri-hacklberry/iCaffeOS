
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAmitData() {
    const phone = '0524295176';

    console.log(`🔍 Checking Integrity for: ${phone}`);

    // 1. Check Loyalty Card
    const { data: card, error: cardErr } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('customer_phone', phone)
        .maybeSingle();

    if (cardErr) console.error('Card Error:', cardErr);
    console.log('💳 Loyalty Card:', card ? `Found (Balance: ${card.points_balance})` : 'MISSING');

    // 2. Check Recent Transactions
    const { data: txs } = await supabase
        .from('loyalty_transactions')
        .select('created_at, change_amount, transaction_type, order_id')
        .eq('card_id', card?.id)
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('📜 Last 5 Transactions:');
    if (txs) txs.forEach(t => console.log(`   - ${t.created_at}: ${t.transaction_type} (${t.change_amount}) [Order: ${t.order_id}]`));

    // 3. Check "Customers" table for redundant columns
    const { data: customer } = await supabase
        .from('customers')
        .select('*') // Select all to spy on hidden columns
        .eq('phone', phone)
        .limit(1);

    if (customer && customer.length > 0) {
        const c = customer[0];
        console.log('👤 Customer Record Found');
        // Check for suspicious columns
        if (c.loyalty_coffee_count !== undefined) console.log(`   ⚠️ WARNING: 'loyalty_coffee_count' exists on customers table! Value: ${c.loyalty_coffee_count}`);
        if (c.points !== undefined) console.log(`   ⚠️ WARNING: 'points' exists on customers table! Value: ${c.points}`);
    }
}

checkAmitData();
