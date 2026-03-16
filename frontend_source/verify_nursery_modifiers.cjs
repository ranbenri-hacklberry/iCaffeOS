const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = '/Users/user/.gemini/antigravity/scratch/onlinestore/.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUSINESS_ID = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';

async function verifyModifiers() {
    console.log(`🔍 Verifying modifiers for business: ${BUSINESS_ID} (שפת המדבר)`);

    // 1. Fetch menu items
    const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, name, modifiers, category')
        .eq('business_id', BUSINESS_ID)
        .is('is_deleted', false);

    if (itemsError) {
        console.error('❌ Error fetching items:', itemsError);
        return;
    }

    console.log(`📦 Found ${items.length} active items.`);

    const itemsWithJsonb = items.filter(i => i.modifiers && Array.isArray(i.modifiers) && i.modifiers.length > 0);
    const itemsWithoutJsonb = items.filter(i => !i.modifiers || !Array.isArray(i.modifiers) || i.modifiers.length === 0);

    console.log(`💎 Items with JSONB modifiers: ${itemsWithJsonb.length}`);
    console.log(`🕰️ Items WITHOUT JSONB (Legacy/None): ${itemsWithoutJsonb.length}`);

    if (itemsWithJsonb.length > 0) {
        console.log('\n--- Sample JSONB Modifiers ---');
        itemsWithJsonb.slice(0, 3).forEach(item => {
            console.log(`Item: ${item.name} (ID: ${item.id})`);
            console.log(JSON.stringify(item.modifiers, null, 2));
            console.log('---');
        });
    }

    // 2. Check legacy modifiers for items without JSONB
    if (itemsWithoutJsonb.length > 0) {
        console.log('\n--- Checking Legacy Modifiers for remaining items ---');
        for (const item of itemsWithoutJsonb.slice(0, 5)) {
            // Check linked groups
            const { data: links } = await supabase
                .from('menuitemoptions')
                .select('group_id')
                .eq('item_id', item.id);

            const groupIds = links?.map(l => l.group_id) || [];

            // Also check private groups (menu_item_id == item.id)
            const { data: privateGroups } = await supabase
                .from('optiongroups')
                .select('id, name')
                .eq('menu_item_id', item.id);

            const allGroupIds = [...new Set([...groupIds, ...privateGroups.map(g => g.id)])];

            if (allGroupIds.length > 0) {
                console.log(`Item: ${item.name} has ${allGroupIds.length} legacy modifier groups.`);
            } else {
                console.log(`Item: ${item.name} has NO legacy modifiers.`);
            }
        }
    }
}

verifyModifiers();
