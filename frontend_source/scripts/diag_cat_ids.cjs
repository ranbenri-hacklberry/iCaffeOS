const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
const BIZ = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';

async function run() {
    var r = await supabase.from('menu_items').select('name, category, category_id')
        .eq('business_id', BIZ).eq('is_deleted', false);
    if (r.error) { console.error(r.error); return; }
    var cats = {};
    r.data.forEach(function (i) {
        if (!cats[i.category]) cats[i.category] = { count: 0, has_cat_id: 0, no_cat_id: 0 };
        cats[i.category].count++;
        if (i.category_id) cats[i.category].has_cat_id++;
        else cats[i.category].no_cat_id++;
    });
    console.log('Category breakdown:');
    Object.keys(cats).forEach(function (k) {
        console.log('  ' + k + ': ' + cats[k].count + ' items (' + cats[k].has_cat_id + ' have category_id, ' + cats[k].no_cat_id + ' missing)');
    });
    console.log('\nSample items with category_id:');
    r.data.filter(function (i) { return i.category_id; }).slice(0, 3).forEach(function (i) {
        console.log('  ' + i.name + ' -> cat: ' + i.category + ', cat_id: ' + i.category_id);
    });
    console.log('\nSample items WITHOUT category_id:');
    r.data.filter(function (i) { return !i.category_id; }).slice(0, 5).forEach(function (i) {
        console.log('  ' + i.name + ' -> cat: ' + i.category);
    });
}
run();
