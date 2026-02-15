
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gxzsxvbercpkgxraiaex.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g');

async function debugSearch() {
    // 1. Search for ANY resemblance of Amit's phone
    const { data: users } = await supabase
        .from('customers')
        .select('id, name, phone, phone_number, loyalty_coffee_count')
        .or('phone.ilike.%4295176%,phone_number.ilike.%4295176%');

    console.log('👥 Customers Found:', users);

    // 2. Search for ANY loyalty card with similar phone
    const { data: cards } = await supabase
        .from('loyalty_cards')
        .select('*')
        .ilike('customer_phone', '%4295176%');

    console.log('💳 Cards Found:', cards);
}

debugSearch();
