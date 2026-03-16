
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use cloud Supabase (production)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE env vars. Run with: node -r dotenv/config scripts/upload_desert_plants.cjs');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ARTIFACTS_DIR = '/Users/user/.gemini/antigravity/brain/d3687f98-ed43-4c68-a1b2-dc4712646802';

// Map plant image files to their menu item names
const PLANT_IMAGES = [
    { file: 'snapdragon_desert_v5_1772601756026.png', namePattern: 'snapdragon' },
    { file: 'alternanthera_desert_v5_1772602242212.png', namePattern: 'alternanthera' },
    { file: 'bidens_desert_v5_1772602312235.png', namePattern: 'bidens' },
    { file: 'beach_sunflower_desert_v5_1772602378979.png', namePattern: 'beach_sunflower' },
    { file: 'lobelia_desert_v5_1772602446461.png', namePattern: 'lobelia' },
];

function imageToBase64(filePath) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
}

async function run() {
    console.log('🌿 Uploading desert plant composite images to Supabase...\n');

    // First, find all businesses to determine which one is the nursery
    const { data: businesses, error: bizErr } = await supabase
        .from('businesses')
        .select('id, name');

    if (bizErr) {
        console.error('❌ Error fetching businesses:', bizErr.message);
        process.exit(1);
    }

    console.log('📋 Available businesses:');
    businesses.forEach(b => console.log(`   - ${b.name} (${b.id})`));

    // Find menu items that match our plant names (search across ALL businesses)
    for (const plant of PLANT_IMAGES) {
        const filePath = path.join(ARTIFACTS_DIR, plant.file);

        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ File not found: ${plant.file}`);
            continue;
        }

        console.log(`\n🔍 Searching for menu items matching "${plant.namePattern}"...`);

        const { data: items, error: itemErr } = await supabase
            .from('menu_items')
            .select('id, name, business_id')
            .ilike('name', `%${plant.namePattern}%`);

        if (itemErr) {
            console.error(`❌ Error searching for ${plant.namePattern}:`, itemErr.message);
            continue;
        }

        if (!items || items.length === 0) {
            console.warn(`   ⚠️ No menu items found for "${plant.namePattern}"`);
            continue;
        }

        console.log(`   Found ${items.length} item(s):`);
        items.forEach(i => console.log(`     - "${i.name}" (business: ${i.business_id})`));

        // Convert image to base64 and update
        const base64 = imageToBase64(filePath);
        console.log(`   📸 Image size: ${(base64.length / 1024 / 1024).toFixed(2)} MB`);

        for (const item of items) {
            const { error: updateErr } = await supabase
                .from('menu_items')
                .update({ image_url: base64 })
                .eq('id', item.id);

            if (updateErr) {
                console.error(`   ❌ Failed to update "${item.name}":`, updateErr.message);
            } else {
                console.log(`   ✅ Updated "${item.name}" successfully!`);
            }
        }
    }

    console.log('\n🏁 Upload complete!');
}

run();
