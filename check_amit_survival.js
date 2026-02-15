
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAmitExistence() {
    const term = '4295176';
    console.log(`🕵️ Looking for Amit by term: ${term}`);

    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.ilike.%${term}%,phone_number.ilike.%${term}%`);

    if (error) console.error('Error:', error);

    if (data && data.length > 0) {
        console.log('✅ Found Amit:', data);
    } else {
        console.log('❌ Amit NOT FOUND in customers table!');
    }
}

checkAmitExistence();
