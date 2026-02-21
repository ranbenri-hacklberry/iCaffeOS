const { createClient } = require('@supabase/supabase-js');

// Config from desert_language.env
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; // Anon key

// Target Business ID - Let's try to find ANY data first to see if Business ID is wrong
// const TARGET_BUSINESS_ID = '22222222-2222-2222-2222-222222222222'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectData() {
    console.log(`🔍 Inspecting data to find valid Business IDs...`);

    // 1. List all businesses
    const { data: businesses, error: busErr } = await supabase
        .from('businesses')
        .select('id, name');

    if (busErr) {
        console.error('❌ Business Fetch Error:', busErr);
        return;
    }

    console.log('🏢 Available Businesses:', businesses);

    if (businesses.length === 0) {
        console.log('⚠️ No businesses found in the database. Only "PrepPage" logic will fail if it relies on a valid business_id.');
        return;
    }

    const targetId = businesses.find(b => b.name.includes('עגלת') || b.name.includes('Coffee') || b.id.startsWith('2222'))?.id || businesses[0].id;
    console.log(`\n🎯 Selecting Target Business: ${targetId}`);

    // 2. Check Menu Items for this ID
    const { data: menuItems, error: menuErr } = await supabase
        .from('menu_items')
        .select('id, name, inventory_settings')
        .eq('business_id', targetId);

    if (menuErr) console.error('❌ Menu Items Error:', menuErr);
    else {
        const tracked = menuItems.filter(i => {
            const s = i.inventory_settings;
            return s && (s.prepType === 'production' || s.prepType === 'completion' || s.prepType === 'defrost' || s.prepType === 'requires_prep');
        });
        console.log(`🍔 Found ${menuItems.length} menu items, ${tracked.length} tracked for Prep.`);
        if (tracked.length > 0) {
            console.log('Sample Tracked Item:', tracked[0]);
        }
    }

    // 3. Check Inventory for this ID (Handling missing column gracefully)
    // We already know low_stock_alert column is missing from previous run, checking low_stock_threshold_units instead?
    // Or just check raw columns
    const { data: invItems, error: invErr } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('business_id', targetId)
        .limit(1);

    if (invErr) console.error('❌ Inventory Error:', invErr);
    else if (invItems.length > 0) {
        console.log('📦 Sample Inventory Item Keys:', Object.keys(invItems[0]));
        console.log('📦 Sample Inventory Item:', invItems[0]);
    } else {
        console.log('📦 No inventory items found for this business.');
    }
}

inspectData();
