
import { createClient } from '@supabase/supabase-js';

// Cloud Connection
const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function simulateOrder() {
    console.log('🧪 SIMULATING ORDER FOR AMIT (CURRENT PROD FUNCTION)...');

    // 1. Data Prep
    const phone = '0524295176';
    const name = 'עמית בדיקה';

    // Payload identical to what the Frontend sends
    const payload = {
        p_customer_phone: phone,
        p_customer_name: name,
        p_items: [
            {
                "item_id": 1, // Assumption: Item ID 1 exists (Coffee?)
                "quantity": 1,
                "price": 12,
                "mods": [],
                "notes": "Simulation Test"
            }
        ],
        p_is_paid: true,
        p_payment_method: 'cash',
        p_final_total: 12
        // NOTE: Currently frontend does NOT send loyalty params to v3
    };

    console.log('📤 Calling submit_order_v3 RPC...');

    const { data, error } = await supabase.rpc('submit_order_v3', payload);

    if (error) {
        console.error('❌ SIMULATION FAILED:', error.message);
        return;
    }

    console.log('✅ Order Created Successfully:', data);
    const orderId = data.order_id;

    // 2. CHECK LOYALTY STATUS IMMEDIATELY
    console.log(`\n🔍 Checking Loyalty Status for ${phone}...`);

    // A. Check Card
    const { data: card } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('customer_phone', phone)
        .maybeSingle(); // Safe fetch

    console.log('Customer Card:', card ? `Exists (Balance: ${card.points_balance})` : '❌ DOES NOT EXIST');

    // B. Check Transaction linked to this Order
    const { data: tx } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('order_id', orderId);

    console.log('Loyalty Transaction for this Order:', tx && tx.length > 0 ? '✅ Created' : '❌ MISSING');

    if (!tx || tx.length === 0) {
        console.error('\n🚨 CRITICAL FINDING: Order created via submit_order_v3 but NO loyalty points were logged!');
    }
}

simulateOrder();
