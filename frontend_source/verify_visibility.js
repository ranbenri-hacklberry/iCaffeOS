
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BIZ_ID = '22222222-2222-2222-2222-222222222222';

async function verifyFrontendVisibility() {
    console.log('🧐 Final Verification: Frontend Visibility Simulation');

    // 1. Fetch Categories (as the app does)
    const { data: categories } = await supabase
        .from('item_category')
        .select('*')
        .eq('business_id', BIZ_ID);

    // 2. Fetch Menu Items (as the app does)
    const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('business_id', BIZ_ID)
        .not('is_deleted', 'eq', true);

    console.log(`\n📦 Database: ${categories?.length || 0} categories, ${menuItems?.length || 0} items found.`);

    // 3. Apply useMenuItems filter logic
    const usedCategoryIds = new Set(menuItems?.map(item => item.category));
    const availableCategories = categories?.filter(cat => usedCategoryIds.has(cat.id));

    console.log('\n✨ UI EXPECTATION:');
    if (availableCategories?.length > 0) {
        console.log(`✅ ${availableCategories.length} categories will be visible:`);
        availableCategories.forEach(cat => {
            const itemsInCat = menuItems.filter(i => i.category === cat.id);
            console.log(`   - ${cat.name_he || cat.name}: ${itemsInCat.length} items`);
        });
    } else {
        console.log('❌ Still 0 visible categories. Something is filtering them out.');
    }
}

verifyFrontendVisibility();
