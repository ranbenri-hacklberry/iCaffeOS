import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'frontend_source/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPoints() {
    const { data: businesses, error: bError } = await supabase
        .from('businesses')
        .select('id, name');

    if (bError) { console.error('Error fetching businesses:', bError); return; }

    const filtered = businesses.filter(b => b.id.startsWith('111111'));

    if (!filtered || filtered.length === 0) {
        console.log('No business found starting with 111111');
        return;
    }

    const business = filtered[0];
    const businessId = business.id;
    console.log(`Checking points for: ${business.name} (${businessId})`);

    // Last Thursday was Jan 15, 2026
    const startDate = '2026-01-15T00:00:00Z';

    const { data: transactions, error: tError } = await supabase
        .from('loyalty_transactions')
        .select('points_earned, transaction_type')
        .eq('business_id', businessId)
        .gte('created_at', startDate);

    if (tError) { console.error('Error fetching transactions:', tError); return; }

    const totalPoints = transactions.reduce((sum, t) => sum + (Number(t.points_earned) || 0), 0);
    console.log(`Total points earned since Thursday (2026-01-15): ${totalPoints}`);
    console.log(`Number of transactions: ${transactions.length}`);
}

checkPoints();
