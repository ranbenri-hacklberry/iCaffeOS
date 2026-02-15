
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugFix() {
    console.log('🐞 Debug Fix...');
    const { data: b } = await supabase.from('businesses').select('id').ilike('id', '222%').single();

    // Check count of 'שתייה חמה' (2 yods)
    const { count: c1 } = await supabase.from('menu_items').select('*', { count: 'exact' }).eq('business_id', b.id).eq('category', 'שתייה חמה');
    console.log(`Remaining with 2 yods: ${c1}`);

    // Update
    const { error } = await supabase.from('menu_items')
        .update({ category: 'שתיה חמה' })
        .eq('business_id', b.id)
        .eq('category', 'שתייה חמה');

    if (error) console.log(error);

    // Check count of 'שתיה חמה' (1 yod)
    const { count: c2 } = await supabase.from('menu_items').select('*', { count: 'exact' }).eq('business_id', b.id).eq('category', 'שתיה חמה');
    console.log(`Now with 1 yod: ${c2}`);
}

debugFix();
