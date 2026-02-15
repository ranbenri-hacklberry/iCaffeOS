import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRecipeIngredients() {
    const { data: ing } = await supabase.from('recipe_ingredients').select('*').eq('recipe_id', 76);
    console.log(ing);
}

checkRecipeIngredients();
