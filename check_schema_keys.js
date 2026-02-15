
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gxzsxvbercpkgxraiaex.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g');

async function checkSchema() {
    const { data, error } = await supabase.from('customers').select('*').limit(1);

    if (data && data.length > 0) {
        console.log('🔑 Keys in CUSTOMERS table:', Object.keys(data[0]));
    } else {
        console.log('❌ Error or Empty:', error);
    }
}

checkSchema();
