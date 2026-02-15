
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
// Taking the Service Role Key from apply_migration_helper.js
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6InNlcnZpY2Vfcm9sZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvzjF19HkGqF1qg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const phones = [
    '0537457891', // חגי
    '0555667570', // יאיר
    '0547323055', // שרה
    '0584000806'  // זק
];

async function checkLoyaltyStatus() {
    console.log('🔍 Checking Loyalty status with SERVICE ROLE KEY...');

    // 1. Check Cards
    const { data: cards, error: cardError } = await supabase
        .from('loyalty_cards')
        .select('*')
        .in('customer_phone', phones);

    if (cardError) {
        console.error('❌ Error fetching cards:', cardError.message);
    } else {
        console.log('\n💳 Loyalty Cards:');
        if (cards.length === 0) console.log('No cards found for these phones.');
        cards.forEach(card => {
            console.log(`- Phone: ${card.customer_phone}, Balance: ${card.points_balance}, Redeemed: ${card.total_free_coffees_redeemed}`);
        });
    }

    // 2. Check Recent Transactions
    const { data: txs, error: txError } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

    if (txError) {
        console.error('❌ Error fetching transactions:', txError.message);
    } else {
        console.log('\n📜 Recent Transactions (last 30):');
        txs.forEach(tx => {
            console.log(`- Phone: ${tx.customer_phone}, Change: ${tx.points_change}, Type: ${tx.transaction_type}, Date: ${tx.created_at}, OrderID: ${tx.order_id}`);
        });
    }

    // 3. Check Orders from today
    const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('id, order_number, customer_phone, total_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

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
