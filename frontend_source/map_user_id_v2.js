import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { Client } = pg;
const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
async function run() {
    const client = new Client({ connectionString });
    await client.connect();
    const userId = 'df582350-e2df-4e47-9479-76aef22c8b82'; // New ID from logs
    const templateId = '11111111-1111-1111-1111-111111111111';

    console.log('registering tenant...');
    await client.query("INSERT INTO public.business_config (id, business_name, business_type) VALUES ($1, 'Pilot Law Firm', 'LAW_FIRM') ON CONFLICT (id) DO UPDATE SET business_type = 'LAW_FIRM'", [userId]);

    console.log('cloning sample data...');
    // Clone cases for the new user if they don't exist
    await client.query(`
    INSERT INTO public.cases (tenant_id, case_number, title, client_name, status)
    SELECT $1, case_number, title, client_name, status
    FROM public.cases
    WHERE tenant_id = 'ba1094ca-792c-48b3-9e15-b33aba7f298e' OR tenant_id = $2
    ON CONFLICT DO NOTHING
  `, [userId, templateId]);

    console.log('cloning sample devices...');
    await client.query(`
    INSERT INTO public.devices (tenant_id, name, cpu, ram_gb, status)
    SELECT $1, name, cpu, ram_gb, status
    FROM public.devices
    WHERE tenant_id = 'ba1094ca-792c-48b3-9e15-b33aba7f298e' OR tenant_id = $2
    ON CONFLICT DO NOTHING
  `, [userId, templateId]);

    await client.end();
    console.log('Successfully mapped user ID: ' + userId);
}
run().catch(console.error);
