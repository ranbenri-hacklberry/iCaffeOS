import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkInventoryItems() {
    const { data: items } = await supabase.from('inventory_items').select('id, name, business_id, current_stock').in('id', [369, 350, 363]);
    console.log(items);
}

checkInventoryItems();
