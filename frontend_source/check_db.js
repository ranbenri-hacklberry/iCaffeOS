import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'http://127.0.0.1:54321',
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
);

const bizId = '22222222-2222-2222-2222-222222222222';

async function check() {
  console.log('--- STARTING LOCAL DB CHECK ---');
  
  const { data: cats } = await supabase.from('item_category').select('id, name, name_he, is_hidden').eq('business_id', bizId);
  console.log('📁 CATEGORIES IN LOCAL DB:');
  console.table(cats);

  const { data: items } = await supabase.from('menu_items').select('id, name, category, is_deleted').eq('business_id', bizId);
  console.log('\n🍔 ALL ITEMS IN LOCAL DB:');
  console.table(items);

  console.log('--- END DB CHECK ---');
}

check();
