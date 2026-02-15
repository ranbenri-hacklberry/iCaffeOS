import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setStock() {
    console.log('📦 Setting initial stock for Cow Milk (464) to 10...');

    const { error } = await supabase
        .from('inventory_items')
        .update({ current_stock: 10.0 })
        .eq('id', 464);

    if (error) {
        console.error('❌ Failed:', error.message);
    } else {
        console.log('✅ Stock set to 10.');
    }
}

setStock();
