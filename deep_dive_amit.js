
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deepDiveAmit() {
    const rawPhone = '0524295176';
    console.log(`🕵️ DEEP DIVE FOR: ${rawPhone}`);

    // 1. Check Loyalty Card (Exact Match)
    const { data: exactCard } = await supabase.from('loyalty_cards').select('*').eq('customer_phone', rawPhone);
    console.log('💳 Loyalty Card (Exact):', exactCard);

    // 2. Check Loyalty Card (Like Match) - maybe hidden chars?
    const { data: fuzzyCards } = await supabase.from('loyalty_cards').select('*').ilike('customer_phone', `%4295176%`);
    console.log('💳 Loyalty Card (Fuzzy):', fuzzyCards);

    // 3. Check Transactions (Assuming we found a card)
    if (exactCard && exactCard.length > 0) {
        const cardId = exactCard[0].id;
        const { data: txs } = await supabase.from('loyalty_transactions').select('*').eq('card_id', cardId).order('created_at', { ascending: false });
        console.log(`📜 Transactions for Card ${cardId}:`, txs);
    } else if (fuzzyCards && fuzzyCards.length > 0) {
        const cardId = fuzzyCards[0].id;
        const { data: txs } = await supabase.from('loyalty_transactions').select('*').eq('card_id', cardId).order('created_at', { ascending: false });
        console.log(`📜 Transactions for Fuzzy Card ${cardId}:`, txs);
    } else {
        console.log('❌ NO CARD FOUND AT ALL! The function failed to create it.');
    }
}

deepDiveAmit();
