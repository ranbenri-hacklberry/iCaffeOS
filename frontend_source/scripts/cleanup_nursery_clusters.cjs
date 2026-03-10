
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BIZ_ID = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';

async function run() {
    console.log('🧹 Cleaning up clustered / combined items...\n');

    const { data: items, error } = await supabase
        .from('menu_items')
        .select('id, name, is_deleted')
        .eq('business_id', BIZ_ID)
        .eq('is_deleted', false);

    if (error) {
        console.error('❌ Error fetching items:', error.message);
        return;
    }

    const keywordsToDeactivate = [
        '/', // Catch items with slashes
    ];

    for (const item of items) {
        // If it contains a slash, it's likely a combined item (except for maybe some specific edge cases, but for this nursery it seems problematic as per user complaint)
        if (item.name.includes('/')) {
            // Check if it's an item we want to keep? No, user said they should be separate.
            // Items like "נענע / שיבא / לואיזה" should be hidden.
            console.log(`🗑 Deactivating combined item: "${item.name}"`);
            await supabase.from('menu_items')
                .update({ is_deleted: true, is_visible_pos: false, is_visible_online: false })
                .eq('id', item.id);
        }
    }

    console.log('\n✅ Cleanup complete! Clustered items are now hidden.');
}

run();
