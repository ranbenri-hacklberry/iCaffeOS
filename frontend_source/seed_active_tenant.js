import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { Client } = pg;
const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
async function run() {
    const client = new Client({ connectionString });
    await client.connect();

    // Get the most recent tenant from business_config
    const res = await client.query("SELECT id FROM public.business_config ORDER BY created_at DESC LIMIT 1");
    if (res.rows.length === 0) {
        console.log('No tenants found in business_config. Please complete onboarding in the browser first.');
        await client.end();
        return;
    }

    const userId = res.rows[0].id;
    console.log('Using active tenant ID: ' + userId);

    console.log('Seeding LAW_FIRM data...');
    await client.query("DELETE FROM public.cases WHERE tenant_id = $1", [userId]);
    await client.query("INSERT INTO public.cases (tenant_id, case_number, title, client_name, status) VALUES ($1, 'LAW-2024-001', 'Acme Corp vs. Smith', 'Alice Smith', 'open')", [userId]);
    await client.query("INSERT INTO public.cases (tenant_id, case_number, title, client_name, status) VALUES ($1, 'LAW-2024-002', 'Estate of Johnson', 'Robert Johnson', 'open')", [userId]);

    console.log('Seeding IT_LAB data...');
    await client.query("DELETE FROM public.devices WHERE tenant_id = $1", [userId]);
    await client.query("INSERT INTO public.devices (tenant_id, name, cpu, ram_gb, status) VALUES ($1, 'MD-WORK-01', 'Intel i7', 16, 'active')", [userId]);
    await client.query("INSERT INTO public.devices (tenant_id, name, cpu, ram_gb, status) VALUES ($1, 'MD-WORK-02', 'M2 Pro', 32, 'active')", [userId]);

    console.log('Seeding CAFE data...');
    // Instead of updating, lets clone some items
    await client.query("DELETE FROM public.menu_items WHERE business_id = $1", [userId]);
    await client.query("INSERT INTO public.menu_items (name, price, category, business_id) VALUES ('Cappuccino', 12, 'Coffee', $1), ('Latte', 14, 'Coffee', $1)", [userId]);

    await client.end();
    console.log('Sample data seeded successfully for tenant: ' + userId);
}
run().catch(console.error);
