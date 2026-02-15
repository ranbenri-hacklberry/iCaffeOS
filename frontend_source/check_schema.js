import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log('🔍 Checking businesses table schema...');
    const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error:', error);
    } else if (data && data.length > 0) {
        console.log('✅ Columns found:', Object.keys(data[0]).join(', '));
        if (data[0].settings) {
            console.log('✅ "settings" column EXISTS');
        } else {
            console.log('❌ "settings" column MISSING');
        }
    } else {
        console.log('⚠️ No data in businesses table to check schema');
    }
}

checkSchema();
