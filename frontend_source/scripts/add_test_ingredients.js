import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addIngredients() {
    console.log('➕ Adding Ingredients to Recipe 80 (Cappuccino) for Business 2222...');

    // Ingredients: Soy Milk (459), Oat Milk (460), Cow Milk (464)
    // Let's add Cow Milk for testing.
    const milkId = 464;

    // Check if ingredient already exists
    const { data: existing } = await supabase.from('recipe_ingredients').select('*').eq('recipe_id', 80);

    if (existing && existing.length > 0) {
        console.log('Ingredients already exist:', existing);
        // Maybe delete them to start fresh?
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', 80);
        console.log('Deleted old ingredients.');
    }

    // Add Cow Milk: 0.2 Liters (200ml)
    // Note: inventory_items table has units. Let's check 464 unit.
    const { data: milkItem } = await supabase.from('inventory_items').select('unit').eq('id', milkId).single();
    console.log('Milk Unit:', milkItem?.unit || 'Unknown');

    // Assuming 'liter' or 'l'
    const newIngredients = [
        {
            recipe_id: 80,
            inventory_item_id: milkId,
            quantity_used: 0.2, // 200ml
            unit_of_measure: 'liter'
        }
    ];

    const { error } = await supabase.from('recipe_ingredients').insert(newIngredients);

    if (error) {
        console.error('❌ Insert failed:', error.message);
    } else {
        console.log('✅ Added Cow Milk (0.2L) to Recipe 80.');
    }
}

addIngredients();
