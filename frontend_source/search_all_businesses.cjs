require('dotenv').config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listAll() {
  console.log('📋 רשימת כל העסקים בבסיס הנתונים:');
  const { data: b, error } = await supabase.from('businesses').select('id, name, settings');
  if (error) { console.error(error); return; }
  b.forEach(row => {
    console.log(`- [${row.id}] ${row.name}`);
    if (row.settings && row.settings.subdomain) {
      console.log(`  🔗 Subdomain: ${row.settings.subdomain}`);
    }
  });
}

listAll();
