require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_function_signature', { func_name: 'get_order_for_editing' });
  if (error) console.error('Error:', error);
  else console.log(data);
}
check();
