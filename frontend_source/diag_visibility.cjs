const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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

async function diagnoseVisibility() {
    console.log(`🔍 Diagnosing visibility for business: ${BUSINESS_ID}`);

    // 1. Fetch Categories
    const { data: categories, error: catError } = await supabase
        .from('item_category')
        .select('id, name, name_he, is_deleted, is_hidden')
        .eq('business_id', BUSINESS_ID);

    if (catError) {
        console.error('❌ Category error:', catError);
        return;
    }

    console.log(`📂 Categories found: ${categories.length}`);
    categories.forEach(c => {
        console.log(`   - ID: ${c.id}, Name: ${c.name_he || c.name}, Deleted: ${c.is_deleted}, Hidden: ${c.is_hidden}`);
    });

    // 2. Fetch Menu Items
    const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, name, category, category_id, is_deleted')
        .eq('business_id', BUSINESS_ID);

    if (itemsError) {
        console.error('❌ Items error:', itemsError);
        return;
    }

    console.log(`📦 Items found: ${items.length}`);

    const activeItems = items.filter(i => !i.is_deleted);
    console.log(`✅ Active items: ${activeItems.length}`);

    // 3. Check linkages
    const catIds = new Set(categories.map(c => String(c.id)));
    const itemsWithValidCat = activeItems.filter(i => catIds.has(String(i.category_id)));
    const itemsWithInvalidCat = activeItems.filter(i => !catIds.has(String(i.category_id)));

    console.log(`🔗 Items with valid category_id: ${itemsWithValidCat.length}`);
    console.log(`🚫 Items with MISSING/INVALID category_id: ${itemsWithInvalidCat.length}`);

    if (itemsWithInvalidCat.length > 0) {
        console.log('\n--- Samples of Items with invalid/missing category linkage ---');
        itemsWithInvalidCat.slice(0, 10).forEach(i => {
            console.log(`   - Name: ${i.name}, Category (text): ${i.category}, Category ID: ${i.category_id}`);
        });
    }
}

diagnoseVisibility();
