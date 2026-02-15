import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixRecipeBusinessId() {
    console.log('🔧 Fixing recipe 80 business_id...');

    const { data: recipe80 } = await supabase.from('recipes').select('*').eq('id', 80).single();
    if (!recipe80) {
        console.error('Recipe 80 not found');
        return;
    }
    console.log('Current:', recipe80);

    const { error } = await supabase
        .from('recipes')
        .update({ business_id: '22222222-2222-2222-2222-222222222222' })
        .eq('id', 80);

    if (error) {
        console.error('❌ Update failed:', error.message);
    } else {
        console.log('✅ Update success! Recipe 80 now belongs to Business 2222.');
    }
}

fixRecipeBusinessId();
