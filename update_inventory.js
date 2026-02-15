const { createClient } = require('@supabase/supabase-js');

// Config from env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Starting inventory update for Kohav Hashahar (Supplier ID 2)...');
  
  const updates = [
    {name: 'בטטה', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'מלפפון', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'גזר', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'עגבניה', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'לימון', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'פלפל אדום', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'פלפל צהוב', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'חסה ערבית', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'כרוב לבן', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'כרוב סגול', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'דלורית', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'בצל סגול', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'בצל לבן', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'שום', unit: 'מארז', weight_per_unit: 0, count_step: 1, category: 'ירקות'},
    {name: 'סלק בואקום', unit: 'יח׳', weight_per_unit: 500, count_step: 1, category: 'ירקות'},
    {name: 'תפוח עץ ירוק', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'פירות'},
    {name: 'אגס', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'פירות'},
    {name: 'תפוז', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'פירות'},
    {name: 'בננה', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'פירות'},
    {name: 'שוקולית', unit: 'יח׳', weight_per_unit: 1000, count_step: 1, category: 'יבשים'},
    {name: 'סוכר לבן', unit: 'ק״ג', weight_per_unit: 0, count_step: 1, category: 'יבשים'},
    {name: 'סוכר חום', unit: 'ק״ג', weight_per_unit: 0, count_step: 1, category: 'יבשים'},
    {name: 'דבש', unit: 'גרם', weight_per_unit: 0, count_step: 100, category: 'יבשים'},
    {name: 'מלח', unit: 'ק״ג', weight_per_unit: 0, count_step: 1, category: 'יבשים'},
    {name: 'מלח גס', unit: 'ק״ג', weight_per_unit: 0, count_step: 1, category: 'יבשים'},
    {name: 'ריבה', unit: 'גרם', weight_per_unit: 0, count_step: 100, category: 'יבשים'},
    {name: 'חמאה', unit: 'יח׳', weight_per_unit: 10, count_step: 1, category: 'מוצרי חלב'},
    {name: 'גלידה', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'קינוחים / קפואים'},
    {name: 'נייר טואלט', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'נקיון / חד פעמי'}
  ];

  let successCount = 0;
  let failCount = 0;

  for (const item of updates) {
      const { data, error } = await supabase
          .from('inventory_items')
          .update(item)
          .eq('name', item.name)
          .eq('supplier_id', 2)
          .eq('business_id', '11111111-1111-1111-1111-111111111111')
          .select();
      
      if (error) {
          console.error('Failed to update ' + item.name + ':', error.message);
          failCount++;
      } else if (data && data.length > 0) {
          console.log('Updated ' + item.name);
          successCount++;
      } else {
          console.log('Item not found (skipped): ' + item.name);
      }
  }

  console.log('Finished. Success: ' + successCount + ', Failed: ' + failCount);
}

run();
