
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSpelling() {
    console.log('🕵️‍♀️ Checking Category Spelling for Biz 222...');

    // Get business id
    const { data: b } = await supabase.from('businesses').select('id').ilike('id', '222%').single();
    if (!b) return;

    // Check items
    const { data: items } = await supabase.from('menu_items')
        .select('id, name, category')
        .eq('business_id', b.id);

    if (items.length > 0) {
        console.log(`Found ${items.length} items.`);
        // Distinct categories
        const cats = [...new Set(items.map(i => i.category))];
        console.log('Categories found:', cats);
    } else {
        console.log('No items found.');
    }
}

checkSpelling();
