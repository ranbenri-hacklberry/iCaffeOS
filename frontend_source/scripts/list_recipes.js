import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listRecipes() {
    console.log(`🔍 Listing items with recipes for Business: ${BUSINESS_ID}`);

    const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
            id,
            menu_item_id,
            menu_items (
                name
            )
        `)
        .eq('business_id', BUSINESS_ID);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (!recipes.length) {
        console.log('No recipes found for this business.');

        // Let's check generally across all businesses to see if recipes table is populated
        const { data: allRecipes } = await supabase.from('recipes').select('business_id').limit(5);
        console.log('Sample recipes in DB:', allRecipes);
        return;
    }

    console.log(`Found ${recipes.length} recipes:`);
    recipes.forEach(r => {
        console.log(` - ID: ${r.id}, Item: ${r.menu_items?.name} (ID: ${r.menu_item_id})`);
    });
}

listRecipes();
