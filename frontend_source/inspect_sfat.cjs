require('dotenv').config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectSfat() {
  const businessId = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';
  console.log(`🔍 Detailed inspection for ${businessId}...`);

  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(JSON.stringify(business, null, 2));
}

inspectSfat();
