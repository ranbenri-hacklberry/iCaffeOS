import fetch from 'node-fetch';
import 'dotenv/config';

async function test() {
  const url = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:8000';
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.DOCKER_KEY;
  
  const body = {
    p_business_id: '11111111-1111-1111-1111-111111111111',
    p_from_date: '2026-02-25T00:00:00.000Z',
    p_to_date: '2026-02-26T23:59:59.000Z'
  };

  const res = await fetch(`${url}/rest/v1/rpc/get_orders_history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  console.log("Length:", json?.length);
  if (json && json.length > 0) {
    console.log(json[0].order_number, json[0].customer_name);
    console.log(Object.keys(json[0]));
  } else {
    console.log(json);
  }
}
test();
