
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkFinalAmitStatus() {
    const phone = '0524295176';
    console.log(`🔍 FINAL TRUTH CHECK for: ${phone}`);

    // Check Balance
    const { data: card } = await supabase.from('loyalty_cards').select('*').eq('customer_phone', phone).single();
    if (card) {
        console.log(`✅ Loyalty Card Balance: ${card.points_balance}`);
    } else {
        console.log('❌ Card NOT FOUND');
    }

    // Check Last Transaction
    if (card) {
        const { data: tx } = await supabase.from('loyalty_transactions')
            .select('*')
            .eq('card_id', card.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (tx && tx.length > 0) {
            console.log('📜 Last Transaction:', {
                time: tx[0].created_at,
                type: tx[0].transaction_type,
                amount: tx[0].change_amount,
                points_earned: tx[0].points_earned
            });
        }
    }
}

checkFinalAmitStatus();
