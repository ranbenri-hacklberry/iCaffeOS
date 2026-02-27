import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.LOCAL_SUPABASE_URL || 'http://host.docker.internal:54321';
const supabaseKey = process.env.LOCAL_SUPABASE_ANON_KEY;

console.log(`Testing Fetch from ${supabaseUrl}...`);

async function test() {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/businesses?select=id`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('❌ Fetch failed:', response.status, err);
        } else {
            const data = await response.json();
            console.log('✅ Fetch successful! Data:', data);
        }
    } catch (e) {
        console.error('❌ Fatal error during fetch test:', e);
    }
}

test();
