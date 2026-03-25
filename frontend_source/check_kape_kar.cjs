const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://gxzsxvbercpkgxraiaex.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU2MzI3MCwiZXhwIjoyMDc3MTM5MjcwfQ.Z044cIO-6HflCAf5MD9rAIUjEzjnSH-wPSFpA9IfVXo');

// The 2 milk groups found: "שתייה / חלב" and "סוג חלב"
// Let's see their values
const GROUP_IDS = [
  '1d1ccf41-0018-459b-8b19-ad94e838fddd',  // שתייה / חלב
  '8fb5d3de-1913-49c8-9684-3ebb9a1297a8'   // סוג חלב
];

(async () => {
  for (const gid of GROUP_IDS) {
    const {data: vals} = await s.from('optionvalues').select('*').eq('group_id', gid);
    console.log(`\nValues for group ${gid}:`, JSON.stringify(vals, null, 2));
  }
  
  // Also find which items are linked to each
  for (const gid of GROUP_IDS) {
    const {data: links} = await s.from('menuitemoptions').select('item_id').eq('group_id', gid);
    const itemIds = links?.map(l => l.item_id) || [];
    console.log(`\nItems linked to group ${gid}: ${itemIds.join(', ')}`);
    if (itemIds.length > 0) {
      const {data: items} = await s.from('menu_items').select('id, name').in('id', itemIds.slice(0, 10));
      console.log('Items:', items?.map(i => `${i.id}: ${i.name}`).join(', '));
    }
  }
})().catch(e => console.error(e));
