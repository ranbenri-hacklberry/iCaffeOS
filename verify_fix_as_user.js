
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// Fallback if .env is missing/empty, use the known URL
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEMO_EMAIL = 'ran@mail.com';
const DEMO_PASSWORD = '1234';

async function verifyFix() {
    console.log(`🔐 Authenticating as ${DEMO_EMAIL}...`);

    // 1. Sign In
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD
    });

    if (authError) {
        console.error('❌ Login failed:', authError.message);
        return;
    }

    const { session, user } = authData;
    console.log('✅ Logged in!');
    console.log('   User ID:', user.id);

    // Get Business ID context from employees table ideally, but let's see if we can just fetch data
    // The RLS usually requires us to be an employee.

    console.log('\n🔍 Check 1: Fetching Loyalty Cards (showing top 5)...');
    const { data: cards, error: cardsError } = await supabase
        .from('loyalty_cards')
        .select(`
            id, 
            customer_phone, 
            points_balance,
            business_id
        `)
        .limit(5);

    if (cardsError) {
        console.error('❌ Failed to fetch cards:', cardsError.message);
    } else {
        console.log(`✅ Found ${cards.length} cards.`);
        const missingBiz = cards.filter(c => !c.business_id).length;
        if (missingBiz > 0) {
            console.error(`❌ STATUS CHECK: ${missingBiz} cards are STILL missing business_id!`);
        } else {
            console.log('✅ STATUS CHECK: All fetched cards have a business_id.');
        }

        if (cards.length > 0) {
            console.log('   Sample:', cards[0]);
        }
    }

    console.log('\n🔍 Check 2: Fetching Loyalty Transactions (showing top 5)...');
    const { data: txs, error: txsError } = await supabase
        .from('loyalty_transactions')
        .select(`
            id, 
            transaction_type, 
            change_amount, 
            business_id,
            created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (txsError) {
        console.error('❌ Failed to fetch transactions:', txsError.message);
    } else {
        console.log(`✅ Found ${txs.length} transactions.`);
        const missingBizTx = txs.filter(t => !t.business_id).length;
        if (missingBizTx > 0) {
            console.error(`❌ STATUS CHECK: ${missingBizTx} transactions are STILL missing business_id!`);
        } else {
            console.log('✅ STATUS CHECK: All fetched transactions have a business_id.');
        }

        if (txs.length > 0) {
            console.log('   Sample:', txs[0]);
        }
    }

    console.log('\n🔍 Check 3: Testing get_exact_loyalty_balance RPC...');
    // Pick a phone if we found one
    const testPhone = cards?.[0]?.customer_phone || '0500000000';
    const testBizId = cards?.[0]?.business_id;

    if (testBizId) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_exact_loyalty_balance', {
            p_phone: testPhone,
            p_business_id: testBizId
        });

        if (rpcError) {
            console.error('❌ RPC Failed (Maybe not applied yet?):', rpcError.message);
        } else {
            console.log(`✅ RPC Success for ${testPhone}:`, rpcData);
        }
    } else {
        console.log('⚠️ Skipping RPC test (no business_id found to test with).');
    }
}

verifyFix();
