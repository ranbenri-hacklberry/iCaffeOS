/**
 * DANGER: This script mirrors data from Supabase CLOUD to Supabase LOCAL.
 * It will OVERWRITE local data with cloud data for the specified business.
 * 
 * Usage: node scripts/sync_cloud_to_local.js [BUSINESS_ID]
 */

import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hardcoded recovered keys to bypass dotenv issues in current environment
const CLOUD_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const CLOUD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU2MzI3MCwiZXhwIjoyMDc3MTM5MjcwfQ.Z044cIO-6HflCAf5MD9rAIUjEzjnSH-wPSFpA9IfVXo';
const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

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
    'loyalty_cards',
    'loyalty_transactions'
];

let localSchemaCache = null;

async function getLocalSchema() {
    if (localSchemaCache) return localSchemaCache;
    console.log('🔍 Fetching local schema definitions via OpenAPI...');
    try {
        const response = await fetch(`${LOCAL_URL}/rest/v1/`, {
            headers: { 'apikey': LOCAL_KEY }
        });
        const spec = await response.json();
        localSchemaCache = {};
        
        // Map table names to their column sets
        if (spec.definitions) {
            Object.keys(spec.definitions).forEach(tableName => {
                const cols = Object.keys(spec.definitions[tableName].properties || {});
                localSchemaCache[tableName] = new Set(cols);
            });
        }
        return localSchemaCache;
    } catch (err) {
        console.error('❌ Failed to fetch local schema:', err.message);
        return {};
    }
}

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

    // 1.5 NEW: Get local schema from OpenAPI cache
    const schema = await getLocalSchema();
    const allowedColumns = schema[tableName];

    if (!allowedColumns) {
        if (tableName !== 'businesses') { // Skip warning for root
             console.warn(`⚠️ Table ${tableName} missing locally. Skipping.`);
             return;
        }
    } else {
        console.log(`🧹 Filtering data for ${allowedColumns.size} local columns...`);
    }

    // 2. Push to Local
    // Safety Check: Avoid overwriting newer local data if syncing accidentally
    // (Mainly for tables where local changes might happen like customers/employees)
    const { data: localData } = await local.from(tableName).select('id, updated_at');
    const localMap = new Map((localData || []).map(r => [r.id, r.updated_at]));

    const filteredData = data.filter(remoteRow => {
        const localUpdate = localMap.get(remoteRow.id);
        if (!localUpdate) return true; // New record
        return new Date(remoteRow.updated_at || 0) >= new Date(localUpdate);
    }).map(row => {
        if (!allowedColumns) return row;
        // Strip columns that don't exist locally
        const cleanRow = {};
        Object.keys(row).forEach(key => {
            if (allowedColumns.has(key)) {
                cleanRow[key] = row[key];
            } else {
                // INTELLIGENT MAPPING: Map 'role' to legacy admin flags if needed
                if (key === 'role' && row[key] === 'superadmin') {
                    if (allowedColumns.has('is_super_admin')) cleanRow['is_super_admin'] = true;
                    if (allowedColumns.has('is_admin')) cleanRow['is_admin'] = true;
                }
                if (key === 'role' && row[key] === 'admin') {
                    if (allowedColumns.has('is_admin')) cleanRow['is_admin'] = true;
                }
            }
        });
        return cleanRow;
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
