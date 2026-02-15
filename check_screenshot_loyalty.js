
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const phones = [
    '0537457891', // חגי
    '0555667570', // יאיר
    '0547323055', // שרה
    '0584000806'  // זק
];

async function checkLoyaltyStatus() {
    console.log('🔍 Checking Loyalty status for phones from screenshot...');

    // 1. Check Cards
    const { data: cards, error: cardError } = await supabase
        .from('loyalty_cards')
        .select('*')
        .in('customer_phone', phones);

    if (cardError) {
        console.error('❌ Error fetching cards:', cardError.message);
    } else {
        console.log('\n💳 Loyalty Cards:');
        cards.forEach(card => {
            console.log(`- Phone: ${card.customer_phone}, Balance: ${card.points_balance}, Redeemed: ${card.total_free_coffees_redeemed}`);
        });
    }

    // 2. Check Recent Transactions
    const { data: txs, error: txError } = await supabase
        .from('loyalty_transactions')
        .select('*, orders(order_number)')
        .order('created_at', { ascending: false })
        .limit(20);

    if (txError) {
        console.error('❌ Error fetching transactions:', txError.message);
    } else {
        console.log('\n📜 Recent Transactions:');
        txs.forEach(tx => {
            console.log(`- Phone: ${tx.customer_phone}, Change: ${tx.points_change}, Type: ${tx.transaction_type}, Date: ${tx.created_at}`);
        });
    }

    // 3. Check Orders to see if they are missing loyalty associations
    const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('id, order_number, customer_phone, total_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (orderError) {
        console.error('❌ Error fetching orders:', orderError.message);
    } else {
        console.log('\n📦 Recent Orders:');
        orders.forEach(o => {
            console.log(`- #${o.order_number}, Phone: ${o.customer_phone}, Total: ${o.total_amount}, Date: ${o.created_at}`);
        });
    }
}

checkLoyaltyStatus();
