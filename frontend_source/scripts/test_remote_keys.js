import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const REMOTE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const REMOTE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('--- Config Checks ---');
console.log('REMOTE_URL:', REMOTE_URL);
if (REMOTE_KEY) {
    console.log('REMOTE_KEY length:', REMOTE_KEY.length);
    console.log('REMOTE_KEY start:', REMOTE_KEY.substring(0, 10));
    console.log('REMOTE_KEY end:', REMOTE_KEY.substring(REMOTE_KEY.length - 10));
} else {
    console.error('REMOTE_KEY is MISSING!');
}

async function testConnection() {
    console.log('\n--- Testing Connection ---');
    if (!REMOTE_URL || !REMOTE_KEY) {
        console.error('Missing URL or Key, cannot test.');
        return;
    }

    const supabase = createClient(REMOTE_URL, REMOTE_KEY);

    try {
        console.log('Attempting to fetch businesses count...');
        const { data, error, count } = await supabase
            .from('businesses')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            console.error('Full Error:', error);
        } else {
            console.log('✅ Connection Successful!');
            console.log('Business Count:', count);
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err.message);
    }
}

testConnection();
