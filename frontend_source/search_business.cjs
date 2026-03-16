require('dotenv').config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || ''; // Use service key to bypass RLS

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function searchBusiness() {
  console.log('🔍 Searching for "Sfat Midbar"...');

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('*')
    .or('name.ilike.%Sfat Midbar%,name.ilike.%שפת מדבר%');

  if (error) {
    console.error('Search error:', error);
    return;
  }

  if (businesses.length === 0) {
    console.log('❌ No business found with that name.');
  } else {
    console.log(`✅ Found ${businesses.length} businesses:`);
    businesses.forEach(b => {
      console.log(`- ID: ${b.id}, Name: ${b.name}, Slug: ${b.slug}`);
    });
  }
}

searchBusiness();
