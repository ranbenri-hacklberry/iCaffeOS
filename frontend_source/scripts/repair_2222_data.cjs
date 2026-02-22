require('dotenv').config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env' });
const { createClient } = require('@supabase/supabase-js');

const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.VITE_LOCAL_SUPABASE_SERVICE_KEY || process.env.LOCAL_SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function repair() {
    console.log('Starting data repair for Business 2222');

    // 1. Get all categories for this business
    console.log('Fetching categories...');
    const { data: categories, error: catErr } = await supabase
        .from('item_category')
        .select('*')
        .eq('business_id', BUSINESS_ID);

    if (catErr) {
        console.error('Error fetching categories:', catErr);
        return;
    }

    console.log(`Found ${categories.length} categories.`);
    const catMap = {};
    categories.forEach(c => {
        catMap[c.name] = c.id;
        if (c.name_he) catMap[c.name_he] = c.id;
    });

    // 2. Get all menu items
    const { data: items, error: itemErr } = await supabase
        .from('menu_items')
        .select('*')
        .eq('business_id', BUSINESS_ID);

    if (itemErr) {
        console.error('Error fetching items:', itemErr);
        return;
    }

    console.log(`Found ${items.length} items.`);

    for (const item of items) {
        let targetCatId = item.category_id;
        let targetCatName = item.category;

        // Attempt to find correct category ID if missing or string-based
        // If category (string) is a UUID, try to find the category by that UUID
        const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

        if (!targetCatId && isUuid(targetCatName)) {
            // Case where category name IS the id
            targetCatId = targetCatName;
            const cat = categories.find(c => c.id === targetCatId);
            if (cat) targetCatName = cat.name;
        }

        if (!targetCatId && catMap[targetCatName]) {
            targetCatId = catMap[targetCatName];
        }

        // Final check: if we have cat ID but maybe targetCatName is wrong
        if (targetCatId && (!targetCatName || isUuid(targetCatName))) {
            const cat = categories.find(c => c.id === targetCatId);
            if (cat) targetCatName = cat.name;
        }

        // Update if anything changed
        if (targetCatId !== item.category_id || targetCatName !== item.category) {
            console.log(`Updating ${item.name}: CatID=${targetCatId}, CatName=${targetCatName}`);
            await supabase.from('menu_items')
                .update({
                    category_id: targetCatId,
                    category: targetCatName
                })
                .eq('id', item.id);
        }
    }

    console.log('Repair complete!');
}

repair();
