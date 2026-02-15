import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkOrphans() {
    const { data: ri } = await supabase.from('recipe_ingredients').select('inventory_item_id').limit(10);
    const { data: ii_ids } = await supabase.from('inventory_items').select('id');
    const ii_set = new Set(ii_ids.map(x => x.id));

    console.log('Sample RI inv_ids:', ri.map(x => x.inventory_item_id));
    console.log('Sample II ids:', ii_ids.slice(0, 10).map(x => x.id));

    const orphans = ri.filter(x => !ii_set.has(x.inventory_item_id));
    console.log('Orphans in first 10:', orphans);
}

checkOrphans();
