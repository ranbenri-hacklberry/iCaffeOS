
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixSpelling() {
    console.log('🔧 Fixing Category Spelling for Biz 222...');

    // Get business id
    const { data: b } = await supabase.from('businesses').select('id').ilike('id', '222%').single();
    if (!b) return;

    // 1. UPDATE 'מוקה', 'שוקו', etc. from 'שתייה חמה' (2 yods) to 'שתיה חמה' (1 yod)
    const { error, count } = await supabase
        .from('menu_items')
        .update({ category: 'שתיה חמה' }) // Target: 1 Yod matching CATEGORY_MAP
        .eq('business_id', b.id)
        .eq('category', 'שתייה חמה'); // Source: 2 Yods (My mistake)

    if (error) console.error('Update failed:', error);
    else console.log(`✅ Updated items.`);

    // 2. Also ensure 'categories' or 'item_category' table (if exists) has it too?
    // We determined earlier that 'categories' table doesn't exist or is inaccessible.
    // 'item_category' was referenced in useMenuItems.js:68. Let's try to insert there?

    try {
        const { error: catErr } = await supabase.from('item_category').insert({
            business_id: b.id,
            name: 'hot-drinks', // db_name usually
            name_he: 'שתיה חמה', // Display name
            icon: 'Coffee',
            position: 1
        });
        if (catErr) console.log('Notice: item_category insert result:', catErr.message);
        else console.log('✅ Created category in item_category table as well.');
    } catch (e) { }
}

fixSpelling();
