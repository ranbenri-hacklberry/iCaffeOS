
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const REMOTE_URL = process.env.VITE_SUPABASE_URL || 'https://gxzsxvbercpkgxraiaex.supabase.co';
const REMOTE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const LOCAL_URL = 'http://100.85.85.33:54321';
const LOCAL_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const remote = createClient(REMOTE_URL, REMOTE_KEY);
const local = createClient(LOCAL_URL, LOCAL_KEY);

const TABLES = [
    'businesses',
    'business_secrets',
    'employees',
    'customers',
    'inventory_items',
    'menu_items',
    'item_category',
    'optiongroups',
    'optionvalues',
    'recipe_ingredients',
    'recipes',
    'orders',
    'order_items',
    'loyalty_cards',
    'loyalty_transactions',
    'discounts',
    'prepared_items_inventory'
];

async function sync(table) {
    console.log(`[SYNC] Starting ${table}...`);
    try {
        let query = remote.from(table).select('*');
        if (table === 'orders' || table === 'order_items') {
            query = query.order('created_at', { ascending: false }).limit(500);
        }

        const { data, error } = await query;
        if (error) {
            console.error(`[SYNC] Error fetching ${table}:`, error.message);
            return;
        }

        if (!data || data.length === 0) {
            console.log(`[SYNC] No data for ${table}`);
            return;
        }

        console.log(`[SYNC] Fetched ${data.length} rows for ${table}. Upserting...`);

        // Chunked upsert
        const size = 50;
        for (let i = 0; i < data.length; i += size) {
            const chunk = data.slice(i, i + size);
            const { error: upsertError } = await local.from(table).upsert(chunk);
            if (upsertError) {
                console.error(`[SYNC] Error upserting ${table} chunk ${i}:`, upsertError.message);
            } else {
                console.log(`[SYNC]  Chunk ${i / size + 1} done.`);
            }
        }
        console.log(`[SYNC] ✅ ${table} finished.`);
    } catch (e) {
        console.error(`[SYNC] Fatal error in ${table}:`, e.message);
    }
}

async function run() {
    for (const t of TABLES) {
        await sync(t);
    }
    console.log('[SYNC] 🏁 All done.');
}

run();
