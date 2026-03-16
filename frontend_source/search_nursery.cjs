require('dotenv').config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function searchNursery() {
  console.log('🔍 Searching businesses for "משתלה" or "nursery"...');

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name, settings')
    .or('name.ilike.%משתלה%,name.ilike.%nursery%');

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  businesses.forEach(b => {
    console.log(`- ID: ${b.id}, Name: ${b.name}, Subdomain: ${b.settings?.subdomain}`);
  });
}

searchNursery();
