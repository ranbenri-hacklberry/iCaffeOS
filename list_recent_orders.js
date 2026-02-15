
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
    console.log('--- Fetching Last 20 Orders (Any Customer) ---');

    const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, customer_name, customer_phone, total_amount')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    console.table(orders);

    // Check for Maya specifically
    console.log('\n--- Checking Maya (0548888888) ---');
    const { data: mayaCard } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('customer_phone', '0548888888');
    console.log('Maya Card:', mayaCard);
}

debug();
