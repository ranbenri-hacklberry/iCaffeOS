
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRoutine() {
    const { data, error } = await supabase.rpc('get_routine_src', { name: 'submit_order_v3' });
    if (error) {
        // Fallback: Try query if RPC doesn't exist
        const { data: qData, error: qError } = await supabase
            .from('information_schema.routines')
            .select('routine_definition')
            .eq('routine_name', 'submit_order_v3')
            .eq('routine_schema', 'public');

        if (qError) console.error('Query Error:', qError);
        else console.log('Definition:', qData);
    } else {
        console.log('RPC Source:', data);
    }
}

// Helper RPC to fetch source if we can't query information_schema directly via client
// (Sometimes pg_catalog is locked down)
async function checkDirect() {
    console.log('Checking via standard query...');
    // Note: PostgREST doesn't expose information_schema by default.
    // We usually need a custom RPC to get function definitions.

    // Let's try to infer if it exists by calling it with dummy nulls
    const { error } = await supabase.rpc('submit_order_v3', {
        p_customer_phone: null,
        p_customer_name: null,
        p_items: []
    });

    console.log('Call result:', error ? error.message : 'Function exists (args mismatch maybe?)');
}

checkDirect();
