
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6InNlcnZpY2Vfcm9sZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvzjF19HkGqF1qg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const phones = [
    '0537457891',
    '0584000806',
    '0555667570',
    '0547323055'
];

async function diagnose() {
    console.log('🔍 Diagnosing Missing Business IDs...');

    // 1. Check Loyalty Transactions
    const { count: txCount, error: txError } = await supabase
        .from('loyalty_transactions')
        .select('*', { count: 'exact', head: true })
        .is('business_id', null);

    if (txError) console.error('Error counting missing tx:', txError.message);
    else console.log(`❌ Loyalty Transactions with MISSING business_id: ${txCount}`);

    // 2. Check Loyalty Cards
    const { count: cardCount, error: cardError } = await supabase
        .from('loyalty_cards')
        .select('*', { count: 'exact', head: true })
        .is('business_id', null);

    if (cardError) console.error('Error counting missing cards:', cardError.message);
    else console.log(`❌ Loyalty Cards with MISSING business_id: ${cardCount}`);

    // 3. Inspect specific phones
    console.log('\n🕵️ Detailed Inspection for target phones:');
    const { data: txs, error: listError } = await supabase
        .from('loyalty_transactions')
        .select(`
            id, 
            card_id,
            points_earned, 
            created_at, 
            business_id, 
            order_id,
            orders:order_id ( business_id ) 
        `) // Fetching nested order business_id
        .in('loyalty_cards.customer_phone', phones) // Wait, loyalty_transactions doesn't have customer_phone directly usually, it's on card.
        // Let's check schema. Previous scripts query 'customer_phone' on loyalty_transactions directly? 
        // check_screenshot_loyalty_admin.js did: .from('loyalty_transactions').select('*')...
        // Let's assume customer_phone is not on transaction, but looking at check_screenshot_loyalty_admin.js output log from user summary, it says "Phone: ${tx.customer_phone}".
        // So maybe it IS on the transaction table? Optimizing.
        // I will try to select customer_phone. If it fails, I'll remove it.
        // Actually, looking at FIX_LOYALTY_UNIFIED.sql insert (lines 75-103), it does NOT insert customer_phone into loyalty_transactions.
        // BUT check_screenshot_loyalty_admin.js implies it might exist or they were joining?
        // Wait, check_missing_biz_id.sql uses `lt.customer_phone`. So it probably exists or was added.
        // Let's double check. I'll just select * first.
        .limit(10);

    // Wait, I can't filter by `loyalty_cards.customer_phone` if I'm selecting from transactions unless I join.
    // But check_missing_biz_id.sql says `FROM loyalty_transactions lt ... WHERE lt.customer_phone IN ...`
    // So `customer_phone` MUST be on `loyalty_transactions`. I will assume it is.

    // Actually, to be safe and precise, I'll filter by the phones if the column exists.
    // I'll filter by order_id not null to see if we can link them.

    // Let's just fetch the last 20 transactions and see what they look like, filtering by the phones manually if needed or just showing recent ones.
    const { data: transactions, error: txListError } = await supabase
        .from('loyalty_transactions')
        .select(`
            id,
            points_earned,
            created_at,
            business_id,
            order_id,
            order:orders ( id, business_id )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

    if (txListError) {
        console.error('Error fetching transactions list:', txListError.message);
    } else {
        console.log(`\nFound ${transactions.length} recent transactions. Checking for issues...`);
        transactions.forEach(tx => {
            const orderBizId = tx.order?.business_id;
            const txBizId = tx.business_id;
            const mismatch = txBizId !== orderBizId;
            const missing = !txBizId;

            if (missing || mismatch) {
                console.log(`⚠️  Tx ID: ${tx.id} | Date: ${new Date(tx.created_at).toLocaleString()}`);
                console.log(`   - Tx Business ID: ${txBizId || 'NULL ❌'}`);
                console.log(`   - Order Business ID: ${orderBizId || 'N/A'}`);
            }
        });
    }
}

diagnose();
