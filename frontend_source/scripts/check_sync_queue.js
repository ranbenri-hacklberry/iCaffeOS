import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const LOCAL_URL = process.env.VITE_LOCAL_SUPABASE_URL || 'http://localhost:54321';
const LOCAL_KEY = process.env.VITE_LOCAL_SUPABASE_SERVICE_KEY || process.env.LOCAL_SUPABASE_SERVICE_KEY;

const supabase = createClient(LOCAL_URL, LOCAL_KEY);

async function checkQueue() {
    console.log(`Checking Sync Queue...`);
    const start = Date.now();
    try {
        const { count, error } = await supabase
            .from('sync_queue')
            .select('*', { count: 'exact', head: true });

        console.log(`Duration: ${Date.now() - start}ms`);

        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Total items in queue:', count);
        }

        // Check pending
        const { count: pending } = await supabase
            .from('sync_queue')
            .select('*', { count: 'exact', head: true })
            .in('status', ['PENDING', 'FAILED']);

        console.log('Pending/Failed items:', pending);

    } catch (e) {
        console.error('Exception:', e.message);
    }
}

checkQueue();
