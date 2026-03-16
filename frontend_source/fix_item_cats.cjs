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

const CATEGORY_MAP = {
    'עצי פרי': [
        'הדרים', 'גויאבות', 'אגוזים', 'אקזוטי',
        'פירות גן', 'זיתים', 'נשירים'
    ],
    'צמחי בית': ['צמחי בית'],
    'פרחי חוץ': ['צמחי חוץ', 'עונתיים'],
    'צמחי תבלין': ['תבלינים'],
    'כלי עבודה': ['מוצרים משלימים']
};

const CATEGORY_IDS = {
    'פרחי חוץ': '8fe96162-6dcd-4d82-95f9-a63d3e737c0a',
    'צמחי בית': '6e0e2ab8-d3e2-46d9-86f0-375311161f8e',
    'צמחי תבלין': 'de0da9f9-6bcb-434a-9502-a177d304e8ee',
    'עצי פרי': 'b4b14a7c-96f3-45a6-8007-3a39d243dbea',
    'כלי עבודה': 'a5afdaec-c3a6-444f-8174-fff0721d6154'
};

async function fixCategoryIds() {
    console.log(`🛠️ Fixing category_id for nursery items...`);

    const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, name, category, category_id')
        .eq('business_id', BUSINESS_ID);

    if (itemsError) {
        console.error('❌ Error fetching items:', itemsError);
        return;
    }

    console.log(`📋 Found ${items.length} items to evaluate.`);
    let count = 0;

    for (const item of items) {
        let targetCatId = null;

        // Find the mapping
        for (const [catName, subCats] of Object.entries(CATEGORY_MAP)) {
            if (item.category && subCats.includes(item.category)) {
                targetCatId = CATEGORY_IDS[catName];
                break;
            }
        }

        if (targetCatId && item.category_id !== targetCatId) {
            const { error: updateError } = await supabase
                .from('menu_items')
                .update({ category_id: targetCatId })
                .eq('id', item.id);

            if (updateError) {
                console.error(`❌ Failed to update item ${item.name}:`, updateError);
            } else {
                count++;
                // console.log(`✅ Updated ${item.name} to category_id ${targetCatId}`);
            }
        }
    }

    console.log(`✨ Successfully updated category_id for ${count} items.`);
}

fixCategoryIds();
