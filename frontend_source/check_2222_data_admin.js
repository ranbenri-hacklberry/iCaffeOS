
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://gxzsxvbercpkgxraiaex.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU2MzI3MCwiZXhwIjoyMDc3MTM5MjcwfQ.Z044cIO-6HflCAf5MD9rAIUjEzjnSH-wPSFpA9IfVXo'
);

async function diagnose() {
    console.log('--- DIAGNOSIS ADMIN START ---');
    const bizId = '22222222-2222-2222-2222-222222222222';

    // 1. Check Menu Items with Filters
    console.log('\n1. Checking Menu Items (standard filter) with ADMIN privileges');
    const { data: items, error: itemError } = await supabase
        .from('menu_items')
        .select('id, name, is_deleted')
        .eq('business_id', bizId)
        .not('is_deleted', 'eq', true);

    if (itemError) console.error('Item Error:', itemError);
    else console.log('Active Items found:', items?.length);
    if (items?.length) console.log('Sample item:', items[0].name);

    if (items?.length === 0) {
        // Check ALL for biz
        const { count } = await supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('business_id', bizId);
        console.log(`Total items for biz ${bizId} (including deleted): ${count}`);
    }
}

diagnose();
