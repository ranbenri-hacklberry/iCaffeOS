import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { Client } = pg;
const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
async function run() {
    const client = new Client({ connectionString });
    await client.connect();
    const tenantId = '11111111-1111-1111-1111-111111111111';

    console.log('Clearing old data...');
    await client.query("DELETE FROM public.cases WHERE tenant_id = $1", [tenantId]);
    await client.query("DELETE FROM public.devices WHERE tenant_id = $1", [tenantId]);

    console.log('Seeding LAW_FIRM...');
    await client.query("INSERT INTO public.cases (tenant_id, case_number, title, client_name, status) VALUES ($1, 'LAW-2024-001', 'Acme Corp vs. Smith', 'Alice Smith', 'open')", [tenantId]);
    await client.query("INSERT INTO public.cases (tenant_id, case_number, title, client_name, status) VALUES ($1, 'LAW-2024-002', 'Estate of Johnson', 'Robert Johnson', 'open')", [tenantId]);

    console.log('Seeding IT_LAB...');
    await client.query("INSERT INTO public.devices (tenant_id, name, cpu, ram_gb, status) VALUES ($1, 'MD-WORK-01', 'Intel i7', 16, 'active')", [tenantId]);
    await client.query("INSERT INTO public.devices (tenant_id, name, cpu, ram_gb, status) VALUES ($1, 'MD-WORK-02', 'M2 Pro', 32, 'active')", [tenantId]);

    await client.end();
    console.log('Sample data seeded successfully!');
}
run().catch(console.error);
