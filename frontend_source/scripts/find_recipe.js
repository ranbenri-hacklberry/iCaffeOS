import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findHafuchEverywhere() {
    console.log('🔍 Searching for "הפוך" and its recipes everywhere...');

    const { data: items, error } = await supabase
        .from('menu_items')
        .select('id, name, business_id')
        .ilike('name', '%הפוך%');

    if (error) {
        console.error(error.message);
        return;
    }

    for (const item of items) {
        const { data: recipes } = await supabase
            .from('recipes')
            .select('id')
            .eq('menu_item_id', item.id);

        if (recipes && recipes.length > 0) {
            console.log(`✅ FOUND RECIPE for ${item.name} in business ${item.business_id}`);
            console.log(`Item ID: ${item.id}, recipe ID: ${recipes[0].id}`);
        } else {
            // console.log(`No recipe for ${item.name} in business ${item.business_id}`);
        }
    }

    // Check if there are ANY recipes at all for business 2222...
    const { data: biz2222Recipes } = await supabase.from('recipes').select('id, menu_item_id').eq('business_id', '22222222-2222-2222-2222-222222222222');
    console.log('Total recipes for biz 2222:', biz2222Recipes?.length || 0);
}

findHafuchEverywhere();
