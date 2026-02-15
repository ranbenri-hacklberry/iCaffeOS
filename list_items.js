import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listItems() {
    const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, category, image_url')
        .eq('business_id', '11111111-1111-1111-1111-111111111111')
        .eq('category', 'שתיה קרה')
        .order('name');

    if (error) {
        console.error('Error fetching items:', error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

listItems();
