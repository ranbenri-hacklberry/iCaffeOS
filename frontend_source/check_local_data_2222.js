
import { createClient } from '@supabase/supabase-js';

// Local Supabase Credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjozMTkyMzIzMjMyfQ.WORD_TO_YOUR_MOTHER_THIS_SHOULD_WORK_LOCALLY_IF_DEFAULT_KEY_IS_USED';
// Note: The key in .env.local looked like an anon key. I will try the one from .env.local first, but if it fails, I might need the standard local dev key.
// Actually, let's use the one from .env.local line 16, even if it looks weird.
const envKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, envKey);

async function diagnose() {
    console.log('--- DIAGNOSIS LOCAL START ---');
    const bizId = '22222222-2222-2222-2222-222222222222';

    // 1. Check Menu Items
    console.log('\n1. Checking LOCAL Menu Items for business', bizId);
    const { data: items, error: itemError } = await supabase
        .from('menu_items')
        .select('id, name, is_deleted')
        .eq('business_id', bizId);

    if (itemError) {
        console.error('Item Error:', itemError);
    } else {
        console.log('Items found:', items?.length);
        if (items?.length) console.log('Sample item:', items[0].name);
    }

    // 2. Check ANY items in local DB
    const { count } = await supabase.from('menu_items').select('*', { count: 'exact', head: true });
    console.log('Total items in LOCAL DB:', count);
}

diagnose();
