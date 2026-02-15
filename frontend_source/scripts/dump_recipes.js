import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function dumpRecipes() {
    const { data: recipes } = await supabase.from('recipes').select('id, menu_item_id, business_id');
    console.log(JSON.stringify(recipes, null, 2));
}

dumpRecipes();
