
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixAvailability() {
    console.log('🔧 Fixing Availability for Biz 222...');

    const { data: b } = await supabase.from('businesses').select('id').ilike('id', '222%').single();
    if (!b) return;

    // Check what columns actually exist by trying to select them
    // We know 'is_in_stock' is used in the frontend hook.

    // 1. Update is_in_stock = true
    const { error: err1, count } = await supabase
        .from('menu_items')
        .update({ is_in_stock: true })
        .eq('business_id', b.id);

    if (err1) console.log('Error updating is_in_stock:', err1.message);
    else console.log(`✅ Updated is_in_stock for ${count} items.`);

    // 2. Double check category
    const { data: items } = await supabase.from('menu_items').select('name, category, is_in_stock').eq('business_id', b.id).limit(5);
    console.log('Sample items:', items);
}

fixAvailability();
