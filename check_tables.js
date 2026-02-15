
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    const { data, error } = await supabase.from('business_ai_settings').select('*').limit(1);
    console.log('business_ai_settings:', { data, error });

    const { data: bData, error: bError } = await supabase.from('businesses').select('id, container_seeds').limit(1);
    console.log('businesses:', { data: bData, error: bError });
}

checkTable();
