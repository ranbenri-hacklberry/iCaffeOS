
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkItems() {
    console.log('🕵️‍♀️ Checking Items for Business 222...');

    const { data: businesses } = await supabase.from('businesses').select('id');
    const targetBiz = businesses.find(b => b.id.startsWith('222'));

    if (!targetBiz) { console.error('Target Not Found'); return; }

    // Check Items
    const { data: items, error } = await supabase.from('menu_items')
        .select('id, name, category, category_id, is_instock, available')
        .eq('business_id', targetBiz.id);

    if (error) console.error('Error fetching items:', error);
    else {
        console.log(`Found ${items.length} items.`);
        if (items.length > 0) {
            console.log('Sample Items:', items.slice(0, 5));
        } else {
            console.log('No items found? That is weird if insert succeeded.');
        }
    }
}

checkItems();
