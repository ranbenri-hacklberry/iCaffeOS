
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
dotenv.config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('🔍 Running Supabase Diagnosis...');

    // 1. Check ALL orders (limit 5)
    console.log('\n--- Recent Orders (All Businesses) ---');
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, business_id, total_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('❌ Error fetching orders:', error.message);
    } else {
        if (orders.length === 0) {
            console.log('⚠️ No orders found in DB at all.');
        } else {
            orders.forEach(o => {
                console.log(`📦 Order #${o.id}: Business ID = ${o.business_id}, Amount = ${o.total_amount}, Date = ${o.created_at}`);
            });
        }
    }

    // 2. Check Business Table
    console.log('\n--- Businesses ---');
    const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name')
        .limit(5);

    if (businesses) {
        businesses.forEach(b => console.log(`🏢 Business #${b.id}: ${b.name}`));
    }
}

diagnose();
