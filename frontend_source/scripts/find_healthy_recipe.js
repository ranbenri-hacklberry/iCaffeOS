import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findHealthyRecipe() {
    console.log('🔍 Finding a recipe with valid ingredients...');

    // Get all recipe ingredients
    const { data: ri, error } = await supabase.from('recipe_ingredients').select('recipe_id, inventory_item_id');

    if (error) {
        console.error(error.message);
        return;
    }

    // Get all inventory item IDs
    const { data: ii } = await supabase.from('inventory_items').select('id');
    const validInvIds = new Set(ii.map(v => v.id));

    const recipeItemsCount = {};
    const recipeValidItemsCount = {};

    ri.forEach(row => {
        recipeItemsCount[row.recipe_id] = (recipeItemsCount[row.recipe_id] || 0) + 1;
        if (validInvIds.has(row.inventory_item_id)) {
            recipeValidItemsCount[row.recipe_id] = (recipeValidItemsCount[row.recipe_id] || 0) + 1;
        }
    });

    for (const rId in recipeItemsCount) {
        if (recipeItemsCount[rId] === recipeValidItemsCount[rId]) {
            // This recipe is "healthy" (all ingredients exist)
            const { data: recipe } = await supabase
                .from('recipes')
                .select('id, menu_item_id, business_id, menu_items(name)')
                .eq('id', rId)
                .single();

            if (recipe && recipe.menu_items) {
                console.log(`✅ Recipe ${rId} is healthy! Item: ${recipe.menu_items.name}, Business: ${recipe.business_id}`);
                return; // Found one!
            }
        }
    }

    console.log('No healthy recipes found.');
}

findHealthyRecipe();
