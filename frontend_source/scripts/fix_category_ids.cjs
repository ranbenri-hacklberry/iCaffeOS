const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
const BIZ = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';

// Map of text category names to their UUID from item_category table
const CATEGORY_ID_MAP = {
    'פרחים עונתיים': '8fe96162-6dcd-4d82-95f9-a63d3e737c0a', // פרחי חוץ
    'גרניום': '8fe96162-6dcd-4d82-95f9-a63d3e737c0a', // פרחי חוץ (geraniums are outdoor flowers)
    'צמחי בית': '6e0e2ab8-d3e2-46d9-86f0-375311161f8e', // צמחי בית
    'צמחי תבלין': 'de0da9f9-6bcb-434a-9502-a177d304e8ee', // צמחי תבלין
    'זרעים': 'a5afdaec-c3a6-444f-8174-fff0721d6154', // כלי עבודה (misc category for seeds)
};

async function run() {
    console.log('🔧 Fixing category_id for all nursery items...\n');

    var r = await supabase.from('menu_items').select('id, name, category, category_id')
        .eq('business_id', BIZ).eq('is_deleted', false);

    if (r.error) { console.error(r.error); return; }

    var fixed = 0;
    var skipped = 0;

    for (var item of r.data) {
        var targetCatId = CATEGORY_ID_MAP[item.category];

        if (!targetCatId) {
            console.log('  ⚠️ No mapping for category: "' + item.category + '" (item: ' + item.name + ')');
            skipped++;
            continue;
        }

        if (item.category_id === targetCatId) {
            // Already correct
            continue;
        }

        console.log('  ✏️ Fixing: ' + item.name + ' -> ' + item.category + ' (' + targetCatId + ')');
        var u = await supabase.from('menu_items').update({ category_id: targetCatId }).eq('id', item.id);
        if (u.error) {
            console.error('   ❌ Error:', u.error.message);
        } else {
            fixed++;
        }
    }

    console.log('\n✅ Fixed ' + fixed + ' items, skipped ' + skipped);
}
run();
