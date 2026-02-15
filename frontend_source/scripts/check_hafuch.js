import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkHafuchEverywhere() {
    console.log('🔍 Checking for "הפוך" in all businesses...');
    const { data: items } = await supabase.from('menu_items').select('id, name, business_id').ilike('name', '%הפוך%');
    console.log('Menu Items:', items);

    console.log('🔍 Checking recipes with NULL business_id...');
    const { data: nullBizRecipes } = await supabase.from('recipes').select('id, menu_item_id').is('business_id', null);
    console.log('Recipes with NULL business_id:', nullBizRecipes);
}

checkHafuchEverywhere();
