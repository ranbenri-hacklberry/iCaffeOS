const { createClient } = require('@supabase/supabase-js');

// Config from env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Starting inventory update by ID...');
  
  // ID 418 is Toilet Paper for this business
  const { data, error } = await supabase
      .from('inventory_items')
      .update({
          unit: 'יח׳',
          weight_per_unit: 0,
          count_step: 1,
          category: 'נקיון / חד פעמי'
      })
      .eq('id', 418) 
      .select();
  
  if (error) {
      console.error('Update failed:', error);
  } else {
      console.log('Update result:', data);
  }
}
run();
