require('dotenv').config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function searchLoose() {
  console.log('🔍 Searching businesses for "מדבר" or "Midbar"...');

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name')
    .or('name.ilike.%מדבר%,name.ilike.%midbar%');

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  if (businesses.length === 0) {
    console.log('❌ No business found.');
  } else {
    businesses.forEach(b => {
      console.log(`- ID: ${b.id}, Name: ${b.name}`);
    });
  }
}

searchLoose();
