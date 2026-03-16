const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = '/Users/user/.gemini/antigravity/scratch/onlinestore/.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUSINESS_ID = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';

async function checkCategoryDistribution() {
    const { data: items } = await supabase
        .from('menu_items')
        .select('id, name, category, category_id')
        .eq('business_id', BUSINESS_ID)
        .is('is_deleted', false);

    const { data: categories } = await supabase
        .from('item_category')
        .select('id, name_he, position')
        .eq('business_id', BUSINESS_ID)
        .order('position', { ascending: true });

    console.log(`📊 Category Distribution for ${BUSINESS_ID}:`);
    categories.forEach(c => {
        const count = items.filter(i => i.category_id === c.id).length;
        console.log(`   - [Pos: ${c.position}] ${c.name_he}: ${count} items`);
    });
}

checkCategoryDistribution();
