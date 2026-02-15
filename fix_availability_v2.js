
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function retryFix() {
    console.log('Using exact count from select instead of update return...');

    // update() count is null sometimes?
    const { data: b } = await supabase.from('businesses').select('id').ilike('id', '222%').single();

    // First, verify is_in_stock column exists in schema via a select
    const { data: check, error: checkErr } = await supabase.from('menu_items').select('is_in_stock').limit(1);
    if (checkErr) {
        console.log('is_in_stock check failed:', checkErr.message);
        // It's possible the column is simply missing or named differently.
        // checkItemsV2 failed earlier.
        // Let's try to update 'available' instead? But replication failed on 'available'.
        // Maybe it's 'is_instock'? No, replication failed on that.
        // Maybe 'stock'?
        return;
    }

    const { error } = await supabase
        .from('menu_items')
        .update({ is_in_stock: true })
        .eq('business_id', b.id);

    if (error) console.log('Update failed:', error.message);
    else console.log('Update executed.');

    const { data: items } = await supabase.from('menu_items').select('id, name, is_in_stock, category').eq('business_id', b.id);
    console.log(`Verified ${items.length} items.`);
    if (items.length > 0) console.log(items[0]);
}

retryFix();
