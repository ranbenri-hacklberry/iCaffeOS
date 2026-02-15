import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findNonPilotRecipes() {
    const { data: recipes, error } = await supabase
        .from('recipes')
        .select('id, menu_item_id, business_id')
        .neq('business_id', '11111111-1111-1111-1111-111111111111');

    if (error) {
        console.error(error.message);
        return;
    }

    console.log('Recipes NOT in Pilot Cafe:', recipes);
}

findNonPilotRecipes();
