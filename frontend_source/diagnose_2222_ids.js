
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://gxzsxvbercpkgxraiaex.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g'
);

async function diagnose() {
    console.log('--- DIAGNOSIS IDS STARTED ---');

    const { data: items, error } = await supabase
        .from('menu_items')
        .select('business_id, count(*)', { count: 'exact', head: false }) // count not supported like this in js client usually, need rpc or grouping

    // JS client doesn't support group by easily without rpc
    // Let's just fetch all IDs (compact)

    const { data, error: err } = await supabase
        .from('menu_items')
        .select('business_id');

    if (err) {
        console.error('Error:', err);
        return;
    }

    const counts = {};
    data.forEach(d => {
        counts[d.business_id] = (counts[d.business_id] || 0) + 1;
    });

    console.log('Business ID Counts in menu_items:', counts);


    // Check if 2222 exists in any form (Partial Match)
    const { data: partial, error: partialError } = await supabase
        .from('menu_items')
        .select('business_id, id, name')
        .ilike('business_id', '%222%')
        .limit(5);

    if (partialError) console.error('Partial Error:', partialError);
    else {
        console.log('Partial match "222":', partial?.length > 0 ? partial : 'NONE');
    }

    // Check Categories for 222...
    const { count: catCount, error: catError } = await supabase
        .from('item_category')
        .select('*', { count: 'exact', head: true })
        .ilike('business_id', '%222%');

    if (catError) console.error('Category Error:', catError);
    else console.log('Categories matching "222":', catCount);

}

diagnose();
