
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CATALOG_PATH = '/Users/user/.gemini/antigravity/brain/d3687f98-ed43-4c68-a1b2-dc4712646802/plant_catalog.json';
const BIZ_ID = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a'; // שפת המדבר

// Keywords to identify "trees" that should be handled separately or skipped
const TREE_KEYWORDS = ['לימון', 'תפוז', 'אתרוג', 'פומלה', 'אשכולית', 'פומלית', 'זית', 'מנגו', 'פקאן', 'אבוקדו', 'תאנה', 'שסק', 'אנונה', 'פאפיה', 'רימון', 'חרוב', 'אפרסק', 'נקטרינה', 'שזיף', 'אגס', 'גודגדן', 'תפוח', 'משמש'];

function cleanName(rawName) {
    // Normalize spaces (replacing non-breaking spaces with normal spaces)
    let name = rawName.replace(/\u00A0/g, ' ');
    // Remove everything after the first dash or parenthesis
    name = name.split(' -')[0].split(' -')[0].split('-')[0].split('(')[0].trim();
    return name;
}

function parsePrice(rawPrice) {
    const match = rawPrice.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
}

async function run() {
    console.log('🔄 Syncing Nursery Database items...\n');

    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

    const { data: currentItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('business_id', BIZ_ID);

    console.log(`📊 Catalog items: ${catalog.length}`);
    console.log(`📊 DB items before: ${currentItems?.length || 0}`);

    for (const entry of catalog) {
        const cleanedName = cleanName(entry.name);

        // Skip trees as requested
        const isTree = TREE_KEYWORDS.some(k => cleanedName.includes(k));
        if (isTree) {
            console.log(`⏩ Skipping tree: ${cleanedName}`);
            continue;
        }

        const price = parsePrice(entry.price);

        // Check if exists
        const existing = currentItems.find(item =>
            item.name === cleanedName ||
            cleanedName.includes(item.name) ||
            item.name.includes(cleanedName)
        );

        if (existing) {
            console.log(`✅ Item exists: "${existing.name}" (Updating if needed)`);
            await supabase.from('menu_items')
                .update({
                    category: entry.category,
                    price: price || existing.price,
                    description: entry.name
                })
                .eq('id', existing.id);
        } else {
            console.log(`➕ Adding missing item: "${cleanedName}"`);
            const { error } = await supabase.from('menu_items').insert({
                business_id: BIZ_ID,
                name: cleanedName,
                price: price,
                category: entry.category,
                description: entry.name,
                image_url: null,
                is_in_stock: true
            });
            if (error) console.error(`   ❌ Error adding ${cleanedName}:`, error.message);
        }
    }

    console.log('\n🏁 Sync complete!');
}

run();
