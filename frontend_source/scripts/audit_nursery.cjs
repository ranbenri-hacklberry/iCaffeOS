
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CATALOG_PATH = '/Users/user/.gemini/antigravity/brain/d3687f98-ed43-4c68-a1b2-dc4712646802/plant_catalog.json';
const SEEDS_DIR = '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/public/assets/nursery/';
const BIZ_ID = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';

async function run() {
    console.log('🔍 Starting Nursery Audit...\n');

    // 1. Get Catalog Data
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

    // 2. Get DB Data
    const { data: dbItems } = await supabase
        .from('menu_items')
        .select('id, name')
        .eq('business_id', BIZ_ID);

    // 3. Get Available Seeds
    const seeds = fs.readdirSync(SEEDS_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

    console.log(`📊 Catalog size: ${catalog.length}`);
    console.log(`📊 Database items: ${dbItems?.length || 0}`);
    console.log(`📊 Total seeds: ${seeds.length}\n`);

    const missingInDB = [];
    const matched = [];

    catalog.forEach(cat => {
        // Simple match logic (contains name)
        const match = dbItems.find(db => {
            // Remove emojis and price info for better matching
            const cleanCatName = cat.name.split('-')[0].split('(')[0].trim();
            return db.name.includes(cleanCatName) || cleanCatName.includes(db.name);
        });

        if (match) {
            matched.push({ catalog: cat.name, db: match.name, id: match.id });
        } else {
            missingInDB.push(cat.name);
        }
    });

    console.log('✅ MATCHED (Already in DB):');
    matched.forEach(m => console.log(`   - ${m.db}`));

    console.log('\n❌ MISSING IN DB (Exist in Catalog only):');
    missingInDB.forEach(m => console.log(`   - ${m}`));

    console.log('\n🌿 SEED COVERAGE (Items we can generate for):');
    dbItems.forEach(item => {
        const seed = seeds.find(s => s.includes(item.name) || item.name.includes(s.replace('.jpg', '')));
        if (seed) {
            console.log(`   [FOUND SEED] ${item.name} -> ${seed}`);
        } else {
            console.log(`   [NO SEED]    ${item.name}`);
        }
    });
}

run();
