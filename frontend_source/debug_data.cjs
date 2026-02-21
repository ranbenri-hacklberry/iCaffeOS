const { createClient } = require('@supabase/supabase-js');

// Config from desert_language.env
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; // Anon key
const TARGET_BUSINESS_ID = '22222222-2222-2222-2222-222222222222';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectData() {
    console.log(`🔍 Inspecting data for Business ID: ${TARGET_BUSINESS_ID}`);

    // 1. Check Recurring Tasks
    const { data: tasks, error: tasksErr } = await supabase
        .from('recurring_tasks')
        .select('id, name, is_active, category, business_id')
        .eq('business_id', TARGET_BUSINESS_ID);

    if (tasksErr) console.error('❌ Tasks Error:', tasksErr);
    else console.log(`📋 Found ${tasks.length} recurring tasks.`);
    if (tasks && tasks.length > 0) {
        console.log('Sample Task:', tasks[0]);
    }

    // 2. Check Menu Items with Inventory Settings
    const { data: menuItems, error: menuErr } = await supabase
        .from('menu_items')
        .select('id, name, inventory_settings')
        .eq('business_id', TARGET_BUSINESS_ID);

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

    // 3. Check Inventory Items
    const { data: invItems, error: invErr } = await supabase
        .from('inventory_items')
        .select('id, name, current_stock, low_stock_alert')
        .eq('business_id', TARGET_BUSINESS_ID);

    if (invErr) console.error('❌ Inventory Error:', invErr);
    else {
        console.log(`📦 Found ${invItems.length} inventory items.`);
        const lowStock = invItems.filter(i => {
            const buffer = i.low_stock_alert !== null ? Number(i.low_stock_alert) : 0;
            return buffer > 0 && Number(i.current_stock || 0) <= buffer;
        });
        console.log(`⚠️ ${lowStock.length} items below minimum.`);
        if (lowStock.length > 0) {
            console.log('Sample Low Stock:', lowStock[0]);
        }
    }
}

inspectData();
