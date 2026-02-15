
import { createClient } from '@supabase/supabase-js';

// Cloud Credentials from user's .env
const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
    console.log('--- Debugging Amit & Maya (Cloud) ---');

    // 1. Check Orders for "Amit"
    const { data: orders, error: oError } = await supabase
        .from('orders')
        .select('id, created_at, customer_name, customer_phone')
        .ilike('customer_name', '%עמית%')
        .order('created_at', { ascending: false })
        .limit(5);

    if (oError) { console.error('Orders error:', oError); return; }

    console.log('Recent Amit Orders:', orders);

    const phones = new Set(orders.map(o => o.customer_phone).filter(Boolean));
    phones.add('0548888888'); // Maya

    // 2. Check Customer Records
    if (phones.size > 0) {
        const { data: customers, error: cError } = await supabase
            .from('customers')
            .select('id, name, phone, loyalty_points, is_club_member')
            .in('phone', Array.from(phones));

        console.log('\n--- Customers Table ---');
        console.table(customers);
    }

    // 3. Check Loyalty Cards
    if (phones.size > 0) {
        const { data: cards, error: lcError } = await supabase
            .from('loyalty_cards')
            .select('*')
            .in('customer_phone', Array.from(phones));

        console.log('\n--- Loyalty Cards Table ---');
        console.table(cards);

        const cardIds = cards.map(c => c.id);

        // 4. Check Transactions
        if (cardIds.length > 0) {
            const { data: txs, error: txError } = await supabase
                .from('loyalty_transactions')
                .select('*')
                .in('card_id', cardIds)
                .order('created_at', { ascending: false })
                .limit(10);

            console.log('\n--- Recent Transactions ---');
            console.table(txs);
        }
    }
}

debug();
