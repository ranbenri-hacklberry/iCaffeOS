
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DIR_CONV = '/Users/user/.gemini/antigravity/brain/35def183-2a8a-4203-80a4-5673d276cebc';

const PLANT_IMAGES = [
    // Batch 2 & 3
    { file: 'begonia_desert_nursery_v3_extreme_crop_1772650372634.png', namePattern: 'גוניה' },
    { file: 'pansy_desert_nursery_v1_bg_seed_used_1772650412354.png', namePattern: 'אמנון' },
    { file: 'impatiens_desert_nursery_v2_bg_seed_used_1772650499134.png', namePattern: 'בשמת' },
    { file: 'geranium_french_desert_v2_exact_likeness_retry_1772650712429.png', namePattern: 'צרפתי' },
    { file: 'bidens_desert_nursery_v1_bg_seed_used_1772650837586.png', namePattern: 'בידנס' },
    { file: 'chinese_carnation_desert_v1_bg_seed_used_1772651066058.png', namePattern: 'ציפורן' },
    { file: 'daisy_desert_nursery_v1_bg_seed_used_1772651158529.png', namePattern: 'חרצית' },
    { file: 'snapdragon_desert_nursery_v1_bg_seed_used_tall_1772651259964.png', namePattern: 'לוע הארי' },
    { file: 'lobelia_desert_nursery_v1_bg_seed_used_1772651345289.png', namePattern: 'לובליה' },
    { file: 'geranium_trailing_desert_v1_bg_seed_used_1772651430675.png', namePattern: 'זוחל' },

    // Batch 4
    { file: 'godetia_desert_v1_bg_seed_used_1772730995188.png', namePattern: 'גודטיה' },
    { file: 'geranium_upright_desert_v1_bg_seed_used_1772731013158.png', namePattern: 'זקוף' },
    { file: 'geranium_citronella_desert_v1_bg_seed_used_1772731033599.png', namePattern: 'לימוני' },
    { file: 'dichondra_silver_desert_v1_bg_seed_used_1772731048979.png', namePattern: 'דיכונדרה' },
    { file: 'areca_palm_desert_v1_bg_seed_used_1772731072236.png', namePattern: 'אריקה' },

    // Batch 5
    { file: 'zz_plant_desert_v1_bg_seed_used_1772731112363.png', namePattern: 'זמיקוקולוס' },
    { file: 'rosemary_desert_v1_bg_seed_used_1772731131047.png', namePattern: 'רוזמרין' },
    { file: 'snake_plant_desert_v1_bg_seed_used_1772731147384.png', namePattern: 'סנסיווריה' },
    { file: 'monstera_deliciosa_desert_v1_bg_seed_used_1772731162640.png', namePattern: 'דליסיוסה' },
    { file: 'monstera_adansonii_desert_v1_bg_seed_used_1772731178818.png', namePattern: 'מאנקי' },

    // Batch 6
    { file: 'tradescantia_nanouk_desert_v1_bg_seed_used_1772731527042.png', namePattern: 'נאנוק' },
    { file: 'spider_plant_desert_v1_bg_seed_used_1772731545420.png', namePattern: 'ירקה' },
    { file: 'peperomia_desert_v1_bg_seed_used_1772731562340.png', namePattern: 'פפרומיה' },
    { file: 'calathea_desert_v1_bg_seed_used_1772731578312.png', namePattern: 'קלתאה' },
    { file: 'calathea_pink_desert_v1_bg_seed_used_1772731597682.png', namePattern: 'קלתאה ורוד' },

    // Batch 7
    { file: 'ivy_bowl_desert_v1_bg_seed_used_1772731654948.png', namePattern: 'קיסוס' },
    { file: 'fern_bowl_desert_v1_bg_seed_used_1772731673744.png', namePattern: 'שרך' },
];

function imageToBase64(filePath) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
}

async function run() {
    console.log('🌿 Starting ULTIMATE upload of nursery images (Batch 1-7)...\n');

    for (const plant of PLANT_IMAGES) {
        const filePath = path.join(DIR_CONV, plant.file);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ File not found: ${plant.file}`);
            continue;
        }

        console.log(`\n🔍 Searching for menu items matching "${plant.namePattern}"...`);

        const { data: items, error: itemErr } = await supabase
            .from('menu_items')
            .select('id, name, business_id')
            .eq('business_id', '8e4e05da-2d99-4bd9-aedf-8e54cbde930a')
            .ilike('name', `%${plant.namePattern}%`);

        if (itemErr) {
            console.error(`❌ Error searching for ${plant.namePattern}:`, itemErr.message);
            continue;
        }

        if (!items || items.length === 0) {
            console.warn(`   ⚠️ No menu items found for "${plant.namePattern}"`);
            continue;
        }

        console.log(`   Found ${items.length} item(s)`);

        const base64 = imageToBase64(filePath);
        for (const item of items) {
            console.log(`   ⬆️ Updating "${item.name}"...`);
            const { error: updateErr } = await supabase
                .from('menu_items')
                .update({ image_url: base64 })
                .eq('id', item.id);

            if (updateErr) {
                console.error(`   ❌ Failed:`, updateErr.message);
            } else {
                console.log(`   ✅ Success!`);
            }
        }
    }

    console.log('\n🏁 Finished uploading all batches!');
}

run();
