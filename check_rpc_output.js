
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRPC() {
    // I can't see the code directly via JS client, 
    // but I can test its output to see if it brings the WRONG data
    const phone = '0524295176';

    const { data, error } = await supabase.rpc('lookup_customer', {
        p_phone: phone,
        p_business_id: '11111111-1111-1111-1111-111111111111'
    });

    console.log('📡 lookup_customer Result:', data);
}

checkRPC();
