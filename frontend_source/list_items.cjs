require('dotenv').config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listItems() {
  const businessId = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';
  console.log(`🔍 Listing items for business ${businessId}...`);

  const { data: items, error } = await supabase
    .from('menu_items')
    .select('id, name, category')
    .eq('business_id', businessId)
    .limit(10);

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  items.forEach(i => {
    console.log(`- ${i.name} (${i.category})`);
  });
}

listItems();
