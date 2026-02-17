import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const ORDER_ID = 'c16a95ea-5934-4325-871f-502925f81aa1';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugDeductionLogic() {
    console.log(`🔍 Debugging logic for Order: ${ORDER_ID}`);

    // 1. Get Order Items
    const { data: items } = await supabase
        .from('order_items')
        .select('id, menu_item_id, quantity, item_status')
        .eq('order_id', ORDER_ID);

    console.log('Order Items:', items);

    if (!items || items.length === 0) return;

    for (const item of items) {
        if (item.item_status === 'cancelled') {
            console.log(`Skipping item ${item.id} because it is cancelled`);
            continue;
        }

        // 2. Find Recipe for this menu item
        const { data: recipes } = await supabase
            .from('recipes')
            .select('id, business_id')
            .eq('menu_item_id', item.menu_item_id);

        console.log(`Recipes for menu item ${item.menu_item_id}:`, recipes);

        if (!recipes) continue;

        for (const recipe of recipes) {
            // 3. Find Ingredients
            const { data: ingredients } = await supabase
                .from('recipe_ingredients')
                .select('inventory_item_id, quantity_used')
                .eq('recipe_id', recipe.id);

            console.log(`Ingredients for recipe ${recipe.id}:`, ingredients);

            if (!ingredients) continue;

            for (const ing of ingredients) {
                const totalDeduct = ing.quantity_used * item.quantity;
                console.log(`Would deduct ${totalDeduct} from inventory item ${ing.inventory_item_id}`);

                // 4. Check inventory item business
                const { data: invItem } = await supabase
                    .from('inventory_items')
                    .select('id, business_id, current_stock')
                    .eq('id', ing.inventory_item_id)
                    .single();

                console.log(`Inventory Item ${ing.inventory_item_id}:`, invItem);
            }
        }
    }
}

debugDeductionLogic();
