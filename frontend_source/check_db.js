import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: businesses } = await supabase.from('business_config').select('*').eq('business_type', 'LAW_FIRM');
    console.log(`LAW_FIRM tenants:`, businesses.length);
    console.log(businesses);

    const { data: cases } = await supabase.from('cases').select('*');
    console.log(`Total cases:`, cases.length);
    console.log(cases);
}

checkData();
