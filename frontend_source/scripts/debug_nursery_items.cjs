
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
    const { data: businesses } = await supabase.from('businesses').select('*').ilike('name', '%משתלה%');
    console.log('Businesses found:', businesses.map(b => `${b.name} (${b.id})`));

    for (const biz of businesses) {
        console.log(`\n--- Items for ${biz.name} ---`);
        const { data: items } = await supabase.from('menu_items').select('id, name').eq('business_id', biz.id);
        if (items) {
            items.forEach(item => {
                console.log(`- "${item.name}"`);
            });
        }
    }
}

run();
