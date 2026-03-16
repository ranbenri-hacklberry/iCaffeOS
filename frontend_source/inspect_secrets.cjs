require('dotenv').config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectSecrets() {
  const businessId = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';
  console.log(`🔍 Inspecting business_secrets for ID ${businessId}...`);

  const { data: secrets, error } = await supabase
    .from('business_secrets')
    .select('*')
    .eq('business_id', businessId);

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  if (secrets.length === 0) {
    console.log('❌ No secrets found.');
  } else {
    secrets.forEach(s => {
      console.log(`key: ${s.key_name}, value: ${s.key_value}`);
    });
  }
}

inspectSecrets();
