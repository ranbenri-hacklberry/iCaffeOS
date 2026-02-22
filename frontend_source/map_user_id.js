import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { Client } = pg;
const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
async function run() {
    const client = new Client({ connectionString });
    await client.connect();
    const userId = 'ba1094ca-792c-48b3-9e15-b33aba7f298e';
    const oldId = '11111111-1111-1111-1111-111111111111';

    console.log('registering tenant...');
    await client.query("INSERT INTO public.business_config (id, business_name, business_type) VALUES ($1, 'Pilot Law Firm', 'LAW_FIRM') ON CONFLICT DO NOTHING", [userId]);

    console.log('migrating cases...');
    await client.query("UPDATE public.cases SET tenant_id = $1 WHERE tenant_id = $2", [userId, oldId]);

    console.log('migrating devices...');
    await client.query("UPDATE public.devices SET tenant_id = $1 WHERE tenant_id = $2", [userId, oldId]);

    console.log('migrating menu_items...');
    await client.query("UPDATE public.menu_items SET business_id = $1 WHERE business_id = $2", [userId, oldId]);

    await client.end();
    console.log('Successfully mapped user ID: ' + userId);
}
run().catch(console.error);
