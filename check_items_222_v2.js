
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkItemsV2() {
    console.log('🕵️‍♀️ Checking Items for Business 222 (Retry with is_in_stock)...');

    const { data: businesses } = await supabase.from('businesses').select('id');
    const targetBiz = businesses.find(b => b.id.startsWith('222'));

    // Select * avoids column guessing errors hopefully
    const { data: items, error } = await supabase.from('menu_items')
        .select('*')
        .eq('business_id', targetBiz.id);

    if (error) console.error('Error fetching items:', error);
    else {
        console.log(`Found ${items.length} items.`);
        if (items.length > 0) {
            console.log('Sample Item Keys:', Object.keys(items[0]));
            console.log('Sample Item:', {
                name: items[0].name,
                category: items[0].category,
                category_id: items[0].category_id
            });
        }
    }
}

checkItemsV2();
