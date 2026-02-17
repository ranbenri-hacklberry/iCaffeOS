import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Manually set the key from .env.local
const REMOTE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const REMOTE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU2MzI3MCwiZXhwIjoyMDc3MTM5MjcwfQ.Z044cIO-6HflCAf5MD9rAIUjEzjnSH-wPSFpA9IfVXo';

console.log('--- Testing Key from .env.local ---');
console.log('REMOTE_URL:', REMOTE_URL);
console.log('REMOTE_KEY length:', REMOTE_KEY.length);

async function testConnection() {
    const supabase = createClient(REMOTE_URL, REMOTE_KEY);

    try {
        console.log('Attempting to fetch businesses count...');
        const { data, error, count } = await supabase
            .from('businesses')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed:', error.message);
        } else {
            console.log('✅ Connection Successful!');
            console.log('Business Count:', count);
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err.message);
    }
}

testConnection();
