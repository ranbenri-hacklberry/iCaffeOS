const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, supplier_id, business_id')
    .eq('business_id', '11111111-1111-1111-1111-111111111111')
    .ilike('name', '%נייר טואלט%');
  
  console.log(JSON.stringify(data, null, 2));
}
run();
