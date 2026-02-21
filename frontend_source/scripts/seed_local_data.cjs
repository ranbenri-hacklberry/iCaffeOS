
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend_source/.env' });

// FORCE LOCAL for this seed script
const supabaseUrl = process.env.VITE_LOCAL_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_LOCAL_SUPABASE_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

console.log(`🔌 Connecting to Local Supabase: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Local Supabase Config');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';

async function seedData() {
    console.log(`🌱 Seeding data for business: ${BUSINESS_ID}...`);

    // 1. Seed Inventory (Low Stock)
    const inventoryItems = [
        {
            name: 'Milk 3%',
            current_stock: 2,
            low_stock_threshold_units: 10,
            unit: 'bottles',
            business_id: BUSINESS_ID,
            category: 'dairy'
        },
        {
            name: 'Coffee Beans (House Blend)',
            current_stock: 500, // grams below 1000
            low_stock_threshold_units: 1000,
            unit: 'grams',
            business_id: BUSINESS_ID,
            category: 'coffee'
        }
    ];

    for (const item of inventoryItems) {
        // We use upsert to create or update
        // Assuming unique(name, business_id) exists, or we heavily rely on IDs which we don't have here.
        // Actually for inventory we might need ID. Let's try inserting and ignore conflict if name constraint exists.
        // Or query first.
        const { data: existing } = await supabase.from('inventory_items').select('id').eq('name', item.name).eq('business_id', BUSINESS_ID).single();

        let error;
        if (existing) {
            ({ error } = await supabase.from('inventory_items').update(item).eq('id', existing.id));
        } else {
            ({ error } = await supabase.from('inventory_items').insert(item));
        }

        if (error) console.error(`Error upserting ${item.name}:`, error.message);
    }
    console.log('✅ Inventory seeded.');

    // 2. Seed Orders (History)
    const orders = [
        {
            business_id: BUSINESS_ID,
            customer_name: 'John Doe',
            total_amount: 45.00,
            order_status: 'completed', // was 'status' -> 'order_status'
            order_type: 'dine_in',
            created_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
        },
        {
            business_id: BUSINESS_ID,
            customer_name: 'Jane Smith',
            total_amount: 120.00,
            order_status: 'completed',
            order_type: 'takeaway',
            created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        }
    ];

    const { error: orderError } = await supabase.from('orders').insert(orders);
    if (orderError) console.error('Error seeding orders:', orderError.message);
    else console.log('✅ Orders seeded.');

    // 3. Seed Recurring Tasks
    const tasks = [
        {
            business_id: BUSINESS_ID,
            name: 'Close Register', // was title -> name
            description: 'Count cash and close daily batch',
            frequency: 'daily',
            category: 'shift_manager', // used category as role proxy
            is_active: true
        },
        {
            business_id: BUSINESS_ID,
            name: 'Clean Coffee Machine',
            description: 'Run cleaning cycle with tablet',
            frequency: 'daily',
            category: 'barista',
            is_active: true
        }
    ];

    for (const task of tasks) {
        const { data: existing } = await supabase.from('recurring_tasks').select('id').eq('name', task.name).eq('business_id', BUSINESS_ID).single();
        if (!existing) {
            const { error } = await supabase.from('recurring_tasks').insert(task);
            if (error) console.error('Error seeding task:', error.message);
        }
    }
    console.log('✅ Tasks seeded.');
}

seedData();
