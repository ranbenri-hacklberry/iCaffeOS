const { createClient } = require('@supabase/supabase-js');

// Config from env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Starting inventory update for Kohav Hashahar (Supplier ID 2)...');
  
  // Minimal update for Toilet Paper first to test
  const testItem = {name: 'נייר טואלט', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'נקיון / חד פעמי'};

  console.log('Trying to update:', testItem.name);
  const { data, error } = await supabase
      .from('inventory_items')
      .update({
          unit: testItem.unit,
          weight_per_unit: testItem.weight_per_unit,
          count_step: testItem.count_step,
          category: testItem.category
      })
      .eq('name', 'נייר טואלט') // Hardcoded string to be sure
      .eq('business_id', '11111111-1111-1111-1111-111111111111')
      .select();
  
  if (error) {
      console.error('Update failed:', error);
  } else {
      console.log('Update result:', data);
  }
}
run();
