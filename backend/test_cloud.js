import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log(`Testing Cloud Supabase at ${supabaseUrl}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        const { data, error } = await supabase.from('businesses').select('id').limit(1);
        if (error) {
            console.error('❌ Cloud test failed:', error);
        } else {
            console.log('✅ Cloud test successful! Data:', data);
        }
    } catch (e) {
        console.error('❌ Fatal error during cloud test:', e);
    }
}

test();
