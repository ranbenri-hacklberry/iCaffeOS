
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching menu_items:', error);
    } else if (data && data.length > 0) {
        console.log('Columns in menu_items:', Object.keys(data[0]));
    } else {
        console.log('No data in menu_items or empty table.');
    }
}

checkColumns();
