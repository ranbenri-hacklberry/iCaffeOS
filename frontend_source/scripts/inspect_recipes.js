import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectRecipes() {
    const { data: ri } = await supabase.from('recipe_ingredients').select('recipe_id, inventory_item_id');
    const { data: ii } = await supabase.from('inventory_items').select('id, name');

    console.log('Total recipe ingredients rows:', ri.length);
    console.log('Total inventory items:', ii.length);

    const uniqueRecipeIds = [...new Set(ri.map(r => r.recipe_id))];
    console.log('Unique Recipes:', uniqueRecipeIds.length);

    // Check one recipe in detail
    const firstRecipeId = uniqueRecipeIds[0];
    const ings = ri.filter(r => r.recipe_id === firstRecipeId);
    console.log(`Ingredients for recipe ${firstRecipeId}:`, ings);

    const invIds = ings.map(i => i.inventory_item_id);
    const existingInv = ii.filter(i => invIds.includes(i.id));
    console.log('Existing Inventory for these IDs:', existingInv);
}

inspectRecipes();
