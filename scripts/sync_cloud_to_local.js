/**
 * DANGER: This script mirrors data from Supabase CLOUD to Supabase LOCAL.
 * It will OVERWRITE local data with cloud data for the specified business.
 * 
 * Usage: node scripts/sync_cloud_to_local.js [BUSINESS_ID]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const CLOUD_URL = process.env.VITE_SUPABASE_URL;
const CLOUD_KEY = process.env.VITE_SUPABASE_SERVICE_KEY; // Requires service role for bypass RLS
const LOCAL_URL = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const LOCAL_KEY = process.env.LOCAL_SUPABASE_SERVICE_KEY;

const businessId = process.argv[2] || '222'; // Default business for testing

if (!CLOUD_KEY || !LOCAL_KEY) {
    console.error('❌ Missing service keys in .env.local. Need service_role keys to sync.');
    process.exit(1);
}

const cloud = createClient(CLOUD_URL, CLOUD_KEY);
const local = createClient(LOCAL_URL, LOCAL_KEY);

const TABLES_TO_SYNC = [
    'businesses',
    'menu_items',
    'item_category',
    'optiongroups',
    'optionvalues',
    'menuitemoptions',
    'ingredients',
    'discounts',
    'employees',
    'customers',
    'loyalty_cards'
];

async function syncTable(tableName) {
    console.log(`🔄 Syncing table: ${tableName}...`);

    // 1. Pull from Cloud
    let query = cloud.from(tableName).select('*');

    // Filter by business_id if it exists in the table
    // We'll check the first row or assume based on schema knowledge
    const multiTenantTables = ['menu_items', 'customers', 'loyalty_cards', 'employees', 'discounts', 'orders'];
    if (multiTenantTables.includes(tableName)) {
        query = query.eq('business_id', businessId);
    }

    const { data, error } = await query;

    if (error) {
        console.error(`❌ Error pulling ${tableName}:`, error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log(`📭 No data found for ${tableName} in cloud.`);
        return;
    }

    console.log(`📥 Downloaded ${data.length} rows from cloud.`);

    // 2. Push to Local
    // Safety Check: Avoid overwriting newer local data if syncing accidentally
    // (Mainly for tables where local changes might happen like customers/employees)
    const { data: localData } = await local.from(tableName).select('id, updated_at');
    const localMap = new Map((localData || []).map(r => [r.id, r.updated_at]));

    const filteredData = data.filter(remoteRow => {
        const localUpdate = localMap.get(remoteRow.id);
        if (!localUpdate) return true; // New record
        return new Date(remoteRow.updated_at || 0) >= new Date(localUpdate);
    });

    if (filteredData.length === 0) {
        console.log(`ℹ️ [${tableName}] Local data is already up-to-date or newer. Skipping push.`);
        return;
    }

    const { error: pushError } = await local.from(tableName).upsert(filteredData);

    if (pushError) {
        console.error(`❌ Error pushing ${tableName} to local:`, pushError.message);
    } else {
        console.log(`✅ Table ${tableName} synced successfully (${filteredData.length}/${data.length} rows updated).`);
    }
}

async function main() {
    console.log('🚀 Starting Cloud-to-Local Mirror Sync...');
    console.log(`📍 Business ID: ${businessId}`);
    console.log(`📍 Source: ${CLOUD_URL}`);
    console.log(`📍 Target: ${LOCAL_URL}`);

    for (const table of TABLES_TO_SYNC) {
        await syncTable(table);
    }

    console.log('🎉 Sync complete!');
}

main().catch(err => {
    console.error('💥 Fatal error:', err);
});
