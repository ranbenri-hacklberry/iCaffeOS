const { createClient } = require('@supabase/supabase-js');

const CLOUD_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const CLOUD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';
const TARGET_BUSINESS_ID = '11111111-1111-1111-1111-111111111111';

console.log(`☁️ Testing Cloud Connection: ${CLOUD_URL}`);

const supabase = createClient(CLOUD_URL, CLOUD_KEY);

async function checkCloudData() {
    // 1. Check Menu Items
    const { data: menuItems, error: menuErr } = await supabase
        .from('menu_items')
        .select('id, name, inventory_settings')
        .eq('business_id', TARGET_BUSINESS_ID);

    if (menuErr) {
        console.error('❌ Cloud Menu Error:', menuErr);
    } else {
        console.log(`🍔 Cloud Menu Items Found: ${menuItems.length}`);
        if (menuItems.length > 0) {
            console.log('Sample Cloud Item:', menuItems[0].name);
        }
    }
}

checkCloudData();
