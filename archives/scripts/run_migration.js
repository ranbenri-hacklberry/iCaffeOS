import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';
const BUSINESS_ID = process.env.BUSINESS_ID || 'YOUR_BUSINESS_UUID_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Parse CSV file and return array of objects
 */
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    // First line is header
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('📋 CSV Headers:', headers);

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
    }

    return data;
}

/**
 * Migrate a single customer
 */
async function migrateCustomer(customer, index, total) {
    const phone = customer['טלפון'];
    const name = customer['שם פרטי'];
    const addedCoffees = parseInt(customer['רכישות קפה']) || 0;
    const addedFree = parseInt(customer['זכאות לקפה חינם']) || 0;

    console.log(`\n[${index + 1}/${total}] Migrating: ${name} (${phone})`);
    console.log(`  - Coffees: ${addedCoffees}, Free: ${addedFree}`);

    try {
        const { data, error } = await supabase.rpc('migrate_club_members_v2', {
            p_phone: phone,
            p_name: name,
            p_added_coffees: addedCoffees,
            p_added_free: addedFree,
            p_business_id: BUSINESS_ID
        });

        if (error) {
            console.error(`  ❌ Error:`, error.message);
            return { success: false, error: error.message, customer };
        }

        console.log(`  ✅ Success! Customer ID: ${data}`);
        return { success: true, customerId: data, customer };
    } catch (err) {
        console.error(`  ❌ Exception:`, err.message);
        return { success: false, error: err.message, customer };
    }
}

/**
 * Main migration function
 */
async function runMigration() {
    console.log('🚀 Starting Customer Migration...\n');
    console.log('Configuration:');
    console.log(`  - Supabase URL: ${SUPABASE_URL}`);
    console.log(`  - Business ID: ${BUSINESS_ID}`);
    console.log('');

    // Read CSV file
    const csvPath = path.join(__dirname, 'import_customers.csv');

    if (!fs.existsSync(csvPath)) {
        console.error('❌ Error: import_customers.csv not found in root directory!');
        process.exit(1);
    }

    console.log(`📂 Reading CSV from: ${csvPath}\n`);

    const customers = parseCSV(csvPath);
    console.log(`📊 Found ${customers.length} customers to migrate\n`);

    // Migrate each customer
    const results = [];
    for (let i = 0; i < customers.length; i++) {
        const result = await migrateCustomer(customers[i], i, customers.length);
        results.push(result);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${results.length}`);

    if (failed > 0) {
        console.log('\n❌ Failed migrations:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.customer['שם פרטי']} (${r.customer['טלפון']}): ${r.error}`);
        });
    }

    console.log('\n✨ Migration complete!');
}

// Run migration
runMigration().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
