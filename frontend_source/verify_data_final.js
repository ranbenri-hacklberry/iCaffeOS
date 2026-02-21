
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';

async function verifyMenuData() {
    console.log('🔍 Checking Menu Data for Business ID:', BUSINESS_ID);

    // 1. Check Categories
    const { data: categories, error: catError } = await supabase
        .from('item_category')
        .select('*')
        .eq('business_id', BUSINESS_ID);

    console.log(`\n📂 Categories found: ${categories?.length || 0}`);
    if (catError) console.error('❌ Category Error:', catError);
    if (categories?.length > 0) {
        console.log('Sample Categories:', categories.slice(0, 3).map(c => c.name_he || c.name));
    }

    // 2. RUN EXACT FRONTEND FUNCTION (menu_items)
    console.log('\n🚀 Running Frontend Fetch Logic (menu_items)...');
    const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name, price, sale_price, category, category_id, is_hot_drink, kds_routing_logic, allow_notes, is_in_stock, description, modifiers, image_url, inventory_settings, is_deleted')
        .eq('business_id', BUSINESS_ID)
        .not('is_deleted', 'eq', true)
        .order('id', { ascending: true });

    if (menuError) {
        console.error('❌ Menu Fetch Error:', menuError);
    } else {
        console.log(`✅ Menu Items found: ${menuItems?.length || 0}`);
        if (menuItems?.length > 0) {
            console.log('Sample Items:', menuItems.slice(0, 5).map(i => i.name));
        } else {
            console.log('⚠️ Warning: No active menu items found for this business.');
        }
    }

    // 3. Check for ANY item in menu_items (ignoring business_id) to see what IDs exist
    console.log('\n🔍 Global inspection of menu_items table...');
    const { data: allItems } = await supabase
        .from('menu_items')
        .select('business_id, count(*)')
        .is('is_deleted', false)
        .limit(100);

    // Aggregate by business_id in JS
    const stats = {};
    const { data: rawItems } = await supabase.from('menu_items').select('business_id');
    rawItems?.forEach(item => {
        stats[item.business_id] = (stats[item.business_id] || 0) + 1;
    });

    console.log('Distribution of items per Business ID:');
    console.log(stats);

    // 4. Check if inventory_items are linked to anything
    console.log('\n📦 Checking Inventory Item Links...');
    const { data: invItems } = await supabase
        .from('inventory_items')
        .select('name, business_id')
        .eq('business_id', BUSINESS_ID)
        .limit(5);
    console.log(`Inventory items for 2222: ${invItems?.length || 0} samples:`, invItems?.map(i => i.name));
}

verifyMenuData();
