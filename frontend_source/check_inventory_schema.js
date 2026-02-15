import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkInventorySchema() {
    console.log('🔍 Checking inventory_items table schema...');
    const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error:', error);
    } else if (data && data.length > 0) {
        console.log('✅ Columns found:', Object.keys(data[0]).join(', '));
    } else {
        console.log('⚠️ No data in inventory_items table to check schema');
    }
}

checkInventorySchema();
