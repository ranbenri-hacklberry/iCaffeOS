const { createClient } = require('@supabase/supabase-js');

// Config from env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Starting REAL inventory update for Kohav Hashahar (Supplier ID 2)...');
  
  // Weights estimated based on "institutional kitchen" standard or user hint "vegetables counted by unit but calculated by grams"
  // So unit = 'יח׳', weight_per_unit = approx grams per unit.
  
  const updates = [
    {name: 'בטטה', unit: 'יח׳', weight_per_unit: 300, count_step: 1, category: 'ירקות'},
    {name: 'מלפפון', unit: 'יח׳', weight_per_unit: 100, count_step: 1, category: 'ירקות'},
    {name: 'גזר', unit: 'יח׳', weight_per_unit: 100, count_step: 1, category: 'ירקות'},
    {name: 'עגבניה', unit: 'יח׳', weight_per_unit: 150, count_step: 1, category: 'ירקות'},
    {name: 'לימון', unit: 'יח׳', weight_per_unit: 120, count_step: 1, category: 'ירקות'},
    {name: 'פלפל אדום', unit: 'יח׳', weight_per_unit: 180, count_step: 1, category: 'ירקות'},
    {name: 'פלפל צהוב', unit: 'יח׳', weight_per_unit: 180, count_step: 1, category: 'ירקות'},
    {name: 'חסה ערבית', unit: 'יח׳', weight_per_unit: 400, count_step: 1, category: 'ירקות'},
    {name: 'כרוב לבן', unit: 'יח׳', weight_per_unit: 1500, count_step: 1, category: 'ירקות'},
    {name: 'כרוב סגול', unit: 'יח׳', weight_per_unit: 1500, count_step: 1, category: 'ירקות'},
    {name: 'דלורית', unit: 'יח׳', weight_per_unit: 600, count_step: 1, category: 'ירקות'},
    {name: 'בצל סגול', unit: 'יח׳', weight_per_unit: 150, count_step: 1, category: 'ירקות'},
    {name: 'בצל לבן', unit: 'יח׳', weight_per_unit: 150, count_step: 1, category: 'ירקות'},
    {name: 'שום', unit: 'מארז', weight_per_unit: 200, count_step: 1, category: 'ירקות'},
    {name: 'סלק בואקום', unit: 'יח׳', weight_per_unit: 500, count_step: 1, category: 'ירקות'},
    {name: 'תפוא', unit: 'יח׳', weight_per_unit: 150, count_step: 1, category: 'ירקות'}, // Assuming this is the name in DB currently
    {name: 'חציל', unit: 'יח׳', weight_per_unit: 350, count_step: 1, category: 'ירקות'},
    {name: 'קישוא', unit: 'יח׳', weight_per_unit: 150, count_step: 1, category: 'ירקות'},
    {name: 'פטריות', unit: 'מארז', weight_per_unit: 250, count_step: 1, category: 'ירקות'},
    {name: 'שרי (קופסאות)', unit: 'מארז', weight_per_unit: 500, count_step: 1, category: 'ירקות'},

    {name: 'שוקולית', unit: 'יח׳', weight_per_unit: 1000, count_step: 1, category: 'יבשים'},
    {name: 'סוכר לבן', unit: 'ק״ג', weight_per_unit: 1000, count_step: 1, category: 'יבשים'},
    {name: 'סוכר חום', unit: 'ק״ג', weight_per_unit: 1000, count_step: 1, category: 'יבשים'},
    {name: 'דבש', unit: 'גרם', weight_per_unit: 1, count_step: 100, category: 'יבשים'},
    {name: 'מלח', unit: 'ק״ג', weight_per_unit: 1000, count_step: 1, category: 'יבשים'},
    {name: 'מלח גס', unit: 'ק״ג', weight_per_unit: 1000, count_step: 1, category: 'יבשים'},
    {name: 'ריבה', unit: 'גרם', weight_per_unit: 1, count_step: 100, category: 'יבשים'},
    {name: 'טחינה', unit: 'יח׳', weight_per_unit: 500, count_step: 1, category: 'יבשים'},
    {name: 'שמן זית', unit: 'מ\"ל', weight_per_unit: 1, count_step: 100, category: 'יבשים'},

    {name: 'חמאה', unit: 'יח׳', weight_per_unit: 10, count_step: 1, category: 'מוצרי חלב'},
    {name: 'גבינת קממבר', unit: 'יח׳', weight_per_unit: 200, count_step: 1, category: 'מוצרי חלב'},
    {name: 'גבינת עיזים', unit: 'יח׳', weight_per_unit: 200, count_step: 1, category: 'מוצרי חלב'},
    {name: 'גבינת מעז', unit: 'יח׳', weight_per_unit: 200, count_step: 1, category: 'מוצרי חלב'},

    {name: 'גלידה', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'קינוחים / קפואים'},
    {name: 'נייר טואלט', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'נקיון / חד פעמי'},
    {name: 'שקיות זבל גדולות', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'נקיון / חד פעמי'},
    {name: 'שקיות חומות', unit: 'יח׳', weight_per_unit: 0, count_step: 1, category: 'נקיון / חד פעמי'}
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
           // Fallback without supplier ID just in case (data inconsistency?)
           const { data: data2 } = await supabase
            .from('inventory_items')
            .update(item)
            .eq('name', item.name)
            .eq('business_id', '11111111-1111-1111-1111-111111111111')
            .select();
            
            if (data2 && data2.length > 0) {
                 console.log('Updated ' + item.name + ' (ignoring supplier filter)');
                 successCount++;
            } else {
                 console.log('Item truly not found: ' + item.name);
            }
      }
  }
  
  // Delete 'חלב פרה'
  const { error: delError } = await supabase
    .from('inventory_items')
    .delete()
    .eq('name', 'חלב פרה')
    .eq('business_id', '11111111-1111-1111-1111-111111111111');
    
  if (delError) console.error('Error deleting Milk:', delError);
  else console.log('Deleted duplicate item: חלב פרה');

  console.log('Finished. Success: ' + successCount);
}

run();
