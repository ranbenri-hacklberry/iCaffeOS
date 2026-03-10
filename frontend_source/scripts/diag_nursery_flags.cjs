const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
const BIZ = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';

async function run() {
    const { data, error } = await supabase
        .from('menu_items')
        .select('name, is_deleted, is_visible_online, is_visible_pos, is_in_stock, category')
        .eq('business_id', BIZ);

    if (error) { console.error(error); return; }

    console.log('Total items:', data.length);
    console.log('Deleted:', data.filter(d => d.is_deleted).length);
    console.log('Not deleted:', data.filter(d => !d.is_deleted).length);
    console.log('Visible online (not deleted):', data.filter(d => d.is_visible_online && !d.is_deleted).length);
    console.log('In stock (not deleted):', data.filter(d => d.is_in_stock && !d.is_deleted).length);
    console.log();

    const notDeleted = data.filter(d => !d.is_deleted);
    notDeleted.forEach(d => {
        const flags = [];
        if (!d.is_visible_online) flags.push('HIDDEN-ONLINE');
        if (!d.is_visible_pos) flags.push('HIDDEN-POS');
        if (!d.is_in_stock) flags.push('OUT-OF-STOCK');
        console.log('  ' + d.name + ' | cat: ' + d.category + ' | ' + (flags.length ? flags.join(', ') : 'OK'));
    });

    console.log('\n--- Deleted items ---');
    const deleted = data.filter(d => d.is_deleted);
    deleted.forEach(d => {
        console.log('  ' + d.name + ' | cat: ' + d.category);
    });
}
run();
