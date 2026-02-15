const { createClient } = require('@supabase/supabase-js');
async function run() {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const itemId = 13;

    // Check private groups
    const { data: priv } = await supabase.from('optiongroups').select('*, optionvalues(*)').eq('menu_item_id', itemId);
    // Check shared groups
    const { data: links } = await supabase.from('menuitemoptions').select('group_id').eq('item_id', itemId);
    let shared = [];
    if (links && links.length > 0) {
        const { data: sg } = await supabase.from('optiongroups').select('*, optionvalues(*)').in('id', links.map(l => l.group_id));
        shared = sg || [];
    }

    console.log('Private Groups for Item 13:', JSON.stringify(priv, null, 2));
    console.log('Shared Groups for Item 13:', JSON.stringify(shared, null, 2));
}
run();
