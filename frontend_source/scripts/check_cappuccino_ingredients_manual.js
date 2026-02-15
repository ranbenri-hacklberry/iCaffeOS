import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCappuccinoIngredientsManual() {
    console.log('🔍 Checking ingredients for "קפוצ׳ינו" (Recipe 80) in iCaffe...');

    const { data: ri, error } = await supabase.from('recipe_ingredients').select('*').eq('recipe_id', 80);

    if (error || !ri.length) {
        console.error('Error fetching recipe_ingredients:', error);
        return;
    }

    for (const ing of ri) {
        const { data: inv } = await supabase.from('inventory_items').select('name, current_stock, unit').eq('id', ing.inventory_item_id).single();
        if (inv) {
            console.log(` - ${inv.name} (ID ${ing.inventory_item_id}): usage ${ing.quantity_used} ${inv.unit}, Current Stock: ${inv.current_stock}`);
        } else {
            console.log(` - UNKNOWN ITEM (ID ${ing.inventory_item_id}): usage ${ing.quantity_used}`);
        }
    }
}

checkCappuccinoIngredientsManual();
