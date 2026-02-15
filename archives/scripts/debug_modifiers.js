
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'ecommerce-store/.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findProductWithModifiers() {
    console.log('Searching for products with modifiers...');

    // Check menuitemoptions (linked groups)
    const { data: linked, error: linkError } = await supabase
        .from('menuitemoptions')
        .select('item_id, group_id')
        .limit(5);

    if (linkError) console.error('Error fetching linked:', linkError);
    else console.log('Linked modifiers found for item_ids:', linked.map(l => l.item_id));

    // Check optiongroups with menu_item_id (private groups)
    const { data: privateG, error: privError } = await supabase
        .from('optiongroups')
        .select('menu_item_id, id')
        .not('menu_item_id', 'is', null)
        .limit(5);

    if (privError) console.error('Error fetching private:', privError);
    else console.log('Private modifiers found for item_ids:', privateG.map(p => p.menu_item_id));

    if (linked.length > 0) {
        const itemId = linked[0].item_id;
        console.log(`\nTesting API logic for Item ID: ${itemId}`);

        // Simulate what the API does
        const { data: groups } = await supabase
            .from('optiongroups')
            .select(`
                id, name,
                optionvalues (id, value_name, price_adjustment)
            `)
            .in('id', [linked[0].group_id]);

        console.log(JSON.stringify(groups, null, 2));
    }
}

findProductWithModifiers();
