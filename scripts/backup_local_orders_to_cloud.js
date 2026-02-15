/**
 * BACKUP: This script pushes orders from Local Supabase to Supabase CLOUD.
 * It's intended to keep the cloud updated with transactions made locally.
 * 
 * Usage: node scripts/backup_local_orders_to_cloud.js [BUSINESS_ID]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const CLOUD_URL = process.env.VITE_SUPABASE_URL;
const CLOUD_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;
const LOCAL_URL = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const LOCAL_KEY = process.env.LOCAL_SUPABASE_SERVICE_KEY;

const businessId = process.argv[2] || '222';

if (!CLOUD_KEY || !LOCAL_KEY) {
    console.error('❌ Missing service keys in .env.local.');
    process.exit(1);
}

const cloud = createClient(CLOUD_URL, CLOUD_KEY);
const local = createClient(LOCAL_URL, LOCAL_KEY);

async function backupOrders() {
    console.log('🔄 Fetching recent orders from LOCAL...');

    // Get orders from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: orders, error: localErr } = await local
        .from('orders')
        .select('*, order_items(*)')
        .eq('business_id', businessId)
        .gte('updated_at', yesterday);

    if (localErr) {
        console.error('❌ Error fetching local orders:', localErr.message);
        return;
    }

    if (!orders || orders.length === 0) {
        console.log('📭 No new/updated orders found locally.');
        return;
    }

    console.log(`📤 Found ${orders.length} orders to backup. Pushing to Cloud...`);

    for (const order of orders) {
        const items = order.order_items;
        const orderData = { ...order };
        delete orderData.order_items; // Separate items for upsert

        // 1. Upsert Order
        const { error: orderPushErr } = await cloud.from('orders').upsert(orderData);
        if (orderPushErr) {
            console.error(`❌ Error backing up order ${order.order_number}:`, orderPushErr.message);
            continue;
        }

        // 2. Upsert Items
        if (items && items.length > 0) {
            const { error: itemsPushErr } = await cloud.from('order_items').upsert(items);
            if (itemsPushErr) {
                console.error(`❌ Error backing up items for order ${order.order_number}:`, itemsPushErr.message);
            }
        }

        console.log(`✅ Order ${order.order_number} backed up.`);
    }
}

async function main() {
    console.log('🚀 Starting Local-to-Cloud Backup Sync...');
    await backupOrders();
    console.log('🎉 Backup complete!');
}

main().catch(err => {
    console.error('💥 Fatal error:', err);
});
