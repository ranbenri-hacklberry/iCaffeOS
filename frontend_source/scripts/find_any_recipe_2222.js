import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findAnyRecipeInICaffe() {
    const { data: menuItems } = await supabase.from('menu_items').select('id, name').eq('business_id', BUSINESS_ID);
    const itemIds = menuItems.map(i => i.id);

    const { data: recipes } = await supabase.from('recipes').select('id, menu_item_id').in('menu_item_id', itemIds);

    console.log(`Checking ${itemIds.length} items in iCaffe...`);
    if (recipes && recipes.length > 0) {
        console.log('Found recipes in iCaffe:', recipes);
    } else {
        console.log('No recipes found for any iCaffe item.');
    }
}

findAnyRecipeInICaffe();
