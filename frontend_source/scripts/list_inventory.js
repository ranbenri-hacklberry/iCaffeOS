import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listInventory() {
    const { data: items } = await supabase.from('inventory_items').select('id, name, current_stock').eq('business_id', BUSINESS_ID);
    console.log(items);
}

listInventory();
