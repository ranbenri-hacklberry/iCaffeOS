import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAllRecipes() {
    console.log('🔍 Checking ALL recipes in the system...');

    const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
            id,
            menu_item_id,
            business_id,
            menu_items (
                name
            )
        `);

    if (error) {
        console.error(error.message);
        return;
    }

    recipes.forEach(r => {
        console.log(`- Recipe ${r.id} for item "${r.menu_items?.name}" (${r.menu_item_id}) in business ${r.business_id}`);
    });
}

checkAllRecipes();
