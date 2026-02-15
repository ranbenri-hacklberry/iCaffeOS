import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'frontend_source/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCards() {
    const { data: cards, error } = await supabase
        .from('loyalty_cards')
        .select('points, updated_at, business_id');

    if (error) { console.error(error); return; }

    const filtered = cards.filter(c => c.business_id.startsWith('111111'));

    console.log('Loyalty cards found:', filtered.length);
    const total = filtered.reduce((sum, c) => sum + (c.points || 0), 0);
    console.log('Total points on cards:', total);

    // Recent updates
    const recent = filtered.filter(c => new Date(c.updated_at) >= new Date('2026-01-15T00:00:00Z'));
    console.log('Cards updated since Thursday:', recent.length);

    // Assuming 'points' is the CURRENT balance.
    // If we want points EARNED since Thursday, we'd need transactions.
    // But if transactions are empty, maybe we look at orders?
}

checkCards();
