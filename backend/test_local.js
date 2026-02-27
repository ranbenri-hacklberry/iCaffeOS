import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.LOCAL_SUPABASE_ANON_KEY;

console.log(`Testing Local Supabase at ${supabaseUrl}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        const { data, error } = await supabase.from('businesses').select('id').limit(1);
        if (error) {
            console.error('❌ Local test failed:', error);
        } else {
            console.log('✅ Local test successful! Data:', data);
        }
    } catch (e) {
        console.error('❌ Fatal error during local test:', e);
    }
}

test();
