ן // Quick script to check order 1550 using fetch (no dependencies needed)
const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MDc3ODMsImV4cCI6MjA0ODM4Mzc4M30.aHqaJmxxK6aughYqc-jfXARNQVx8BuPAU8BeCAqT_fY';

async function checkOrder() {
    // Find order by order_number
    const orderRes = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?order_number=eq.1550&select=id,order_number,order_status,is_paid,customer_name,total_amount,created_at`,
        {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    const orders = await orderRes.json();
    if (!orders || orders.length === 0) {
        console.log('Order 1550 not found');
        return;
    }

    const order = orders[0];
    console.log('\n=== ORDER 1550 ===');
    console.log('ID:', order.id);
    console.log('Status:', order.order_status);
    console.log('Is Paid:', order.is_paid);
    console.log('Customer:', order.customer_name);
    console.log('Total:', order.total_amount);
    console.log('Created:', order.created_at);

    // Get items
    const itemsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${order.id}&select=id,menu_item_id,quantity,price,item_status,course_stage,mods,menu_items(name)`,
        {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    const items = await itemsRes.json();

    console.log('\n=== ITEMS ===');
    items.forEach((item, i) => {
        console.log(`${i + 1}. ${item.menu_items?.name || 'Unknown'}`);
        console.log(`   Status: ${item.item_status}`);
        console.log(`   Course Stage: ${item.course_stage}`);
        console.log(`   Quantity: ${item.quantity}`);
        console.log(`   Price: ${item.price}`);
        console.log(`   Mods: ${item.mods}`);
        console.log('');
    });
}

checkOrder();
