require('dotenv').config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectTable() {
  console.log('🔍 Inspecting businesses table structure...');

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    console.log('Sample row:', data[0]);
  } else {
    console.log('❌ Table is empty.');
  }
}

inspectTable();
