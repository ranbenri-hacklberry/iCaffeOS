require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data: orderIds } = await supabase.from('orders').select('id').order('created_at', { ascending: false }).limit(1);
  if (!orderIds || orderIds.length === 0) return console.log('No orders');
  
  const id = orderIds[0].id;
  console.log('Testing order ID:', id);

  const { data: order, error } = await supabase.rpc('get_order_for_editing', { p_order_id: id });
  if (error) console.error('Error:', error);
  else console.log('Items:', JSON.stringify(order.order_items, null, 2));
}
check();
