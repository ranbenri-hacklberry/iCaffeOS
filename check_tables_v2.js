
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('🕵️‍♀️ Probing Tables...');

    const tables = ['categories', 'menu_categories', 'catalog_categories', 'product_categories', 'departments'];

    for (const t of tables) {
        const { error } = await supabase.from(t).select('id').limit(1);
        if (error) {
            console.log(`❌ Table '${t}': ${error.message}`);
        } else {
            console.log(`✅ Table '${t}' EXISTS!`);
        }
    }
}

check();
