import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findPerfectRecipe() {
    const { data: ri } = await supabase.from('recipe_ingredients').select('recipe_id, inventory_item_id');
    const { data: ii } = await supabase.from('inventory_items').select('id, name');

    const uniqueRecipeIds = [...new Set(ri.map(r => r.recipe_id))];
    const iiMap = new Set(ii.map(i => i.id));

    for (const rId of uniqueRecipeIds) {
        const ings = ri.filter(r => r.recipe_id === rId);
        const allExist = ings.every(i => iiMap.has(i.inventory_item_id));

        if (allExist) {
            const { data: recipe } = await supabase.from('recipes').select('id, menu_item_id, business_id').eq('id', rId).single();
            const { data: menu_item } = await supabase.from('menu_items').select('name').eq('id', recipe.menu_item_id).single();
            console.log(`Bingo! Recipe ${rId} for item "${menu_item?.name}" (ID ${recipe.menu_item_id}) in business ${recipe.business_id} is PERFECT.`);
            return;
        }
    }
    console.log('No perfect recipe found.');
}

findPerfectRecipe();
