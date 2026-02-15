
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function safeFix() {
    console.log('🔄 Safe Fix Availability...');

    // Fetch business ID safely
    const { data: businesses } = await supabase.from('businesses').select('id');
    const b = businesses?.find(x => x.id.startsWith('222')); // Manual filter

    if (!b) {
        console.error('❌ Business 222 not found via select *');
        return;
    }
    console.log(`Found Business: ${b.id}`);

    // Update
    // Column 'is_in_stock' was confirmed by user to be used in frontend hook?
    // Actually the hook uses it.

    // Check if column exists via RPC/Hack? No, just try update.
    // If it fails, it fails.

    const { error } = await supabase
        .from('menu_items')
        .update({ is_in_stock: true }) // Set to true
        .eq('business_id', b.id);

    if (error) {
        console.error('Update Error:', error.message);
        // Try 'available'? Some schemas use that.
        // Replication failed for 'available' earlier.
    } else {
        console.log('✅ Updated is_in_stock = true for all items.');
    }

    // Verify count
    const { count } = await supabase.from('menu_items').select('*', { count: 'exact' }).eq('business_id', b.id).eq('is_in_stock', true);
    console.log(`Verified ${count} items in stock.`);
}

safeFix();
