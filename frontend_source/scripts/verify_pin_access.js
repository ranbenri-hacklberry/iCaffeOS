import pg from 'pg';
const { Client } = pg;

const CONFIGS = [
    { connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' },
    { connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres' },
    { connectionString: 'postgresql://postgres:postgres@127.0.0.1:54321/postgres' },
    { connectionString: 'postgresql://postgres:postgres@127.0.0.1:54323/postgres' },
    { connectionString: 'postgresql://postgres:postgres@127.0.0.1:54324/postgres' },
];

async function tryConnect() {
    for (const config of CONFIGS) {
        console.log(`Trying to connect to ${config.connectionString}...`);
        const client = new Client(config);
        try {
            await client.connect();
            console.log('✅ Connected successfully!');
            return client;
        } catch (err) {
            console.log(`❌ Failed: ${err.message}`);
        }
    }
    return null;
}

async function main() {
    const client = await tryConnect();
    if (!client) {
        console.error('❌ Could not connect to any database instance.');
        process.exit(1);
    }

    try {
        console.log('\n🔍 Checking Super Admins:');
        const res = await client.query('SELECT id, name, email, pin_code, is_super_admin FROM employees WHERE is_super_admin = true');
        console.table(res.rows);

        console.log('\n🔍 Checking users with PIN "1234":');
        const res2 = await client.query('SELECT id, name, email, pin_code, is_super_admin FROM employees WHERE pin_code = \'1234\'');
        console.table(res2.rows);

        console.log('\n🛠️ Applying verify_employee_pin Fix...');
        // Drop function first to handle return type changes
        try {
            await client.query('DROP FUNCTION IF EXISTS verify_employee_pin(text, uuid)');
        } catch (e) {
            console.log('Function drop skipped/failed (might not exist):', e.message);
        }

        await client.query(`
            CREATE OR REPLACE FUNCTION verify_employee_pin(p_pin text, p_business_id uuid) RETURNS TABLE (
                id uuid,
                name text,
                access_level text,
                is_super_admin boolean,
                business_id uuid
            ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY
            SELECT e.id,
                e.name,
                e.access_level,
                e.is_super_admin,
                e.business_id
            FROM employees e
            WHERE e.pin_code = p_pin
                AND (
                    p_business_id IS NULL
                    OR e.business_id = p_business_id
                )
            ORDER BY e.is_super_admin DESC, e.name ASC;
            END;
            $$;
        `);
        console.log('✅ Fix Applied!');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
