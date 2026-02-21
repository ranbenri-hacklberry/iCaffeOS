
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BIZ_ID = '22222222-2222-2222-2222-222222222222';

const SEED_ITEMS = [
    {
        id: 500,
        name: 'קפה הפוך',
        category: '314b61d0-5ea1-4925-bb0f-306c3c3857f9', // Coffee
        price: 12,
        is_hot_drink: true,
        business_id: BIZ_ID,
        is_in_stock: true,
        kds_routing_logic: 'NONE'
    },
    {
        id: 501,
        name: 'קפוצ׳ינו',
        category: '314b61d0-5ea1-4925-bb0f-306c3c3857f9', // Coffee
        price: 14,
        is_hot_drink: true,
        business_id: BIZ_ID,
        is_in_stock: true,
        kds_routing_logic: 'NONE'
    },
    {
        id: 502,
        name: 'כריך חלומי',
        category: '9adfda71-18da-4866-9179-2acf55c0f256', // Sandwiches
        price: 32,
        is_hot_drink: false,
        business_id: BIZ_ID,
        is_in_stock: true,
        kds_routing_logic: 'MADE_TO_ORDER'
    },
    {
        id: 503,
        name: 'עוגת שוקולד',
        category: 'b1defc92-9654-4cc5-9c64-a126c1fb38cd', // Desserts
        price: 24,
        is_hot_drink: false,
        business_id: BIZ_ID,
        is_in_stock: true,
        kds_routing_logic: 'NONE'
    }
];

async function seedMenuItems() {
    console.log('🚀 Seeding test menu items for 2222 with explicit IDs...');

    // First, verify categories still exist to be safe
    const { data: cats } = await supabase.from('item_category').select('id, name').eq('business_id', BIZ_ID);
    console.log('Available categories:', cats?.map(c => `${c.name} (${c.id})`));

    const { data, error } = await supabase
        .from('menu_items')
        .insert(SEED_ITEMS)
        .select();

    if (error) {
        console.error('❌ Failed to seed:', error.message);
    } else {
        console.log(`✅ Successfully seeded ${data.length} items.`);
    }
}

seedMenuItems();
