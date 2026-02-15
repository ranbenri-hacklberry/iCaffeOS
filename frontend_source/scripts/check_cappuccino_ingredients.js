import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCappuccinoIngredients() {
    console.log('🔍 Checking ingredients for "קפוצ׳ינו" (Recipe 80) in iCaffe...');

    const { data: ingredients, error } = await supabase
        .from('recipe_ingredients')
        .select(`
            inventory_item_id,
            quantity_used,
            inventory_items (
                name,
                current_stock,
                unit
            )
        `)
        .eq('recipe_id', 80);

    if (error || !ingredients.length) {
        console.error('❌ Ingredients fail:', error?.message || 'Empty');
        return;
    }

    ingredients.forEach(ig => {
        console.log(` - ${ig.inventory_items?.name}: ${ig.quantity_used} ${ig.inventory_items?.unit} (Stock: ${ig.inventory_items?.current_stock})`);
    });
}

checkCappuccinoIngredients();
