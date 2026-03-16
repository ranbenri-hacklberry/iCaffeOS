require('dotenv').config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectInvItems() {
  const businessId = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';
  console.log('🔍 Inspecting inventory_items...');

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('business_id', businessId)
    .limit(1);

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  if (data.length > 0) {
    console.log('Sample row:', data[0]);
  } else {
    console.log('❌ Table is empty.');
  }
}

inspectInvItems();
