const { createClient } = require('@supabase/supabase-js');

// Config from desert_language.env
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; // Anon key
const TARGET_BUSINESS_ID = '11111111-1111-1111-1111-111111111111';

// Debug specific business ID '1111...'
console.log('FORCE CHECK FOR BUSINESS: 11111111-1111-1111-1111-111111111111');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectData() {
    console.log(`🔍 Inspecting data for Business ID: ${TARGET_BUSINESS_ID}`);

    // 1. Check Menu Items - RAW
    const { data: menuItems, error: menuErr } = await supabase
        .from('menu_items')
        .select('*')
        .eq('business_id', TARGET_BUSINESS_ID);

    if (menuErr) console.error('❌ Menu Items Error:', menuErr);
    else {
        console.log(`🍔 Found ${menuItems.length} menu items.`);
        if (menuItems.length > 0) {
            console.log('Sample Item:', menuItems[0]);
        }
    }

    // 2. Check Permissions / Profile access (Simulate fetch)
    // We can't check RLS easily with Anon key if rules block it, but let's check basic fetch
    const { data: recurringTasks, error: taskErr } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('business_id', TARGET_BUSINESS_ID);

    if (taskErr) console.error('❌ Tasks Error:', taskErr);
    else console.log(`📋 Found ${recurringTasks.length} recurring tasks.`);

    // 3. Check if RLS is blocking read?
    // Try to count all rows without filter
    const { count, error: countErr } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true });

    console.log(`🌍 Total Global Menu Items (RLS filtered view): ${count}`);
}

inspectData();
