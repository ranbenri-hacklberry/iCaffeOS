
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CATALOG_PATH = '/Users/user/.gemini/antigravity/brain/d3687f98-ed43-4c68-a1b2-dc4712646802/plant_catalog.json';
const BIZ_ID = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';

// Items to ignore (trees handled separately)
const TREE_KEYWORDS = ['לימון', 'תפוז', 'אתרוג', 'פומלה', 'אשכולית', 'פומלית', 'זית', 'מנגו', 'פקאן', 'אבוקדו', 'תאנה', 'שסק', 'אנונה', 'פאפיה', 'רימון', 'חרוב', 'אפרסק', 'נקטרינה', 'שזיף', 'אגס', 'גודגדן', 'תפוח', 'משמש'];

const HERB_CATEGORY = 'צמחי תבלין';

async function run() {
    console.log('🚀 Starting ULTIMATE Nursery Sync...');

    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

    // 1. Fetch current items to preserve image_urls if they exist
    const { data: existingItems } = await supabase
        .from('menu_items')
        .select('name, image_url, id')
        .eq('business_id', BIZ_ID);

    const imageMap = {};
    if (existingItems) {
        existingItems.forEach(item => {
            if (item.image_url && item.image_url.startsWith('data:image')) {
                // If we have a clean name-to-image mapping, save it
                // We'll use the name as key, but clean it first
                const cleanKey = item.name.split(' ')[0].split('-')[0].trim();
                imageMap[cleanKey] = item.image_url;
            }
        });
    }

    // 2. Mark ALL existing items for this business as deleted to start fresh (Soft Reset)
    console.log('🧹 Soft resetting current items...');
    await supabase.from('menu_items')
        .update({ is_deleted: true, is_visible_online: false, is_visible_pos: false })
        .eq('business_id', BIZ_ID);

    for (const entry of catalog) {
        const fullRawName = entry.name.replace(/\u00A0/g, ' ');
        // Set category to HERB_CATEGORY if it was 'עשבי תיבול'
        const category = entry.category === 'עשבי תיבול' ? HERB_CATEGORY : entry.category;

        // Skip trees
        if (TREE_KEYWORDS.some(k => fullRawName.includes(k))) continue;

        let baseName = fullRawName.split(' -')[0].split(' -')[0].split('-')[0].split('(')[0].trim();
        let itemsToCreate = [];

        // --- SPECIAL HANDLING: Herbs separation ---
        if (category === HERB_CATEGORY) {
            if (fullRawName.includes('נענע / שיבא / לואיזה')) {
                itemsToCreate.push({ name: 'נענע', price: 12, category });
                itemsToCreate.push({ name: 'שיבא', price: 13, category });
                itemsToCreate.push({ name: 'לואיזה', price: 13, category });
            } else if (fullRawName.includes('עירית/בצל ירוק')) {
                itemsToCreate.push({ name: 'עירית', price: 13, category });
                itemsToCreate.push({ name: 'בצל ירוק', price: 13, category });
            } else if (fullRawName.includes('רוזמרין')) {
                itemsToCreate.push({ name: 'רוזמרין זקוף', price: 13, category });
                itemsToCreate.push({ name: 'רוזמרין זוחל', price: 13, category });
            } else {
                // Standard herb
                const priceMatch = entry.price.match(/\d+/);
                itemsToCreate.push({ name: baseName, price: priceMatch ? parseInt(priceMatch[0]) : 0, category });
            }
        }
        // --- SPECIAL HANDLING: Multi-priced items (Pot sizes) ---
        else if (fullRawName.includes('עציץ 12') || fullRawName.includes('ע. 12') || fullRawName.includes('ע.12')) {
            // "דקל אריקה - ע. 12 - 25 ש"ח ע.18 - 45 ש"ח"
            if (fullRawName.includes('אריקה')) {
                itemsToCreate.push({ name: 'דקל אריקה ע. 12', price: 25, category });
                itemsToCreate.push({ name: 'דקל אריקה ע. 18', price: 45, category });
            } else if (fullRawName.includes('קלתאה ורוד')) {
                itemsToCreate.push({ name: 'קלתאה ורוד ע. 12', price: 85, category });
            } else if (fullRawName.includes('קלתאה מגוון')) {
                itemsToCreate.push({ name: 'קלתאה ע. 12', price: 75, category });
            } else if (fullRawName.includes('פפרומיה')) {
                itemsToCreate.push({ name: 'פפרומיה ע. 12', price: 25, category });
            } else if (fullRawName.includes('ספיטיפיליום')) {
                itemsToCreate.push({ name: 'ספיטיפיליום ע. 12', price: 55, category });
            } else if (fullRawName.includes('סינגוניום')) {
                itemsToCreate.push({ name: 'סינגוניום ע. 12', price: 25, category });
                itemsToCreate.push({ name: 'סינגוניום ע. 18', price: 45, category });
            }
        }
        else if (fullRawName.includes('יחידות ב25')) {
            itemsToCreate.push({ name: 'אמנון ותמר', price: 9, category, promo: '3 יחידות ב-25 ש"ח' });
        }
        else {
            const priceMatch = entry.price.match(/\d+/);
            itemsToCreate.push({ name: baseName, price: priceMatch ? parseInt(priceMatch[0]) : 0, category });
        }

        for (const item of itemsToCreate) {
            console.log(`➕ Creating/Updating: ${item.name} (${item.category})`);

            // Try to recover image_url
            const cleanKey = item.name.split(' ')[0].trim();
            const preservedImage = imageMap[cleanKey] || null;

            const payload = {
                business_id: BIZ_ID,
                name: item.name,
                price: item.price,
                category: item.category,
                description: item.promo ? `מבצע: ${item.promo}` : fullRawName,
                is_in_stock: true,
                is_deleted: false,
                is_visible_online: true,
                is_visible_pos: true,
                image_url: preservedImage
            };

            const existingIdMatch = existingItems?.[0] ? existingItems.find(ei => ei.name === item.name) : null;
            if (existingIdMatch) {
                await supabase.from('menu_items').update(payload).eq('id', existingIdMatch.id);
            } else {
                await supabase.from('menu_items').insert(payload);
            }
        }
    }

    console.log('\n🏁 ULTIMATE sync finished! Herbs separated, pot sizes distinct, category renamed.');
}

run();
