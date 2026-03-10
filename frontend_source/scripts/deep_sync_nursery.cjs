
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CATALOG_PATH = '/Users/user/.gemini/antigravity/brain/d3687f98-ed43-4c68-a1b2-dc4712646802/plant_catalog.json';
const BIZ_ID = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';

function parsePrice(rawPrice) {
    const match = rawPrice.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
}

// Logic to extract multi-buy promotions
function getPromotions(nameText) {
    // Example: "3 יחידות ב25 ש"ח"
    const promoMatch = nameText.match(/(\d+)\s+יחידות\s+ב(\d+)/);
    if (promoMatch) {
        return {
            quantity: parseInt(promoMatch[1]),
            price: parseInt(promoMatch[2])
        };
    }
    return null;
}

async function run() {
    console.log('🔄 Deep Syncing Nursery Catalog (Promotions & Herbs Separation)...\n');

    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

    // Get current items to avoid duplicates
    const { data: currentItems } = await supabase
        .from('menu_items')
        .select('id, name')
        .eq('business_id', BIZ_ID);

    for (const entry of catalog) {
        let itemsToCreate = [];

        // Check for slash-separated names (herbs)
        if (entry.name.includes('/') && entry.category === 'עשבי תיבול') {
            // "נענע / שיבא / לואיזה" or "רוזמרין (זקוף/זוחל)"
            // Special case for Rosemary types vs separate herbs
            if (entry.name.includes('רוזמרין')) {
                itemsToCreate.push({ name: 'רוזמרין זקוף', entry });
                itemsToCreate.push({ name: 'רוזמרין זוחל', entry });
            } else if (entry.name.includes('נענע / שיבא / לואיזה')) {
                // These actually exist as separate entries in the catalog too, 
                // but let's ensure we have individual ones if the combined one is found.
                // Looking at the catalog, we have individual "לואיזה", "נענע", "שיבא".
                // So we can skip the combined one or ensure individuals exist.
                continue;
            } else if (entry.name.includes('עירית/בצל ירוק')) {
                itemsToCreate.push({ name: 'עירית', entry });
                itemsToCreate.push({ name: 'בצל ירוק', entry });
            }
        } else {
            // Standard single item
            let name = entry.name.replace(/\u00A0/g, ' ').split(' -')[0].split(' -')[0].split(' -')[0].split('-')[0].split('(')[0].trim();
            itemsToCreate.push({ name, entry });
        }

        for (const itemPlan of itemsToCreate) {
            const promo = getPromotions(itemPlan.entry.name);
            const basePrice = parsePrice(itemPlan.entry.price);

            // Check existence
            const existing = currentItems.find(i => i.name === itemPlan.name);

            const payload = {
                business_id: BIZ_ID,
                name: itemPlan.name,
                price: basePrice,
                category: itemPlan.entry.category,
                description: itemPlan.entry.name,
                is_in_stock: true,
                // Add promotion info to modifiers or description if no dedicated promo field
                // For now, let's put it in the description so users see it
                description: itemPlan.entry.name + (promo ? ` | מבצע: ${promo.quantity} ב-${promo.price} ש"ח` : '')
            };

            if (existing) {
                console.log(`✅ Updating: ${itemPlan.name}`);
                await supabase.from('menu_items').update(payload).eq('id', existing.id);
            } else {
                console.log(`➕ Adding: ${itemPlan.name}`);
                await supabase.from('menu_items').insert(payload);
            }
        }
    }

    console.log('\n🏁 Deep Sync Complete!');
}

run();
