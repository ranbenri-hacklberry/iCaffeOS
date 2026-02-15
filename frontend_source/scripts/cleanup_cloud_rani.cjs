const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupRani() {
    console.log('🔄 Starting Cloud Database Cleanup for "רן/רני"...');

    // 1. Identify the records
    const { data: employees, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .or('email.eq.ranbenri@gmail.com,phone.eq.0548317887');

    if (fetchError) {
        console.error('❌ Error fetching records:', fetchError);
        return;
    }

    const superAdmin = employees.find(e => e.email === 'ranbenri@gmail.com');
    const otherRecord = employees.find(e => e.phone === '0548317887' && e.email !== 'ranbenri@gmail.com');

    if (!superAdmin) {
        console.error('❌ Could not find Super Admin with email ranbenri@gmail.com');
        return;
    }

    // 2. Delete the extra record if it exists
    if (otherRecord) {
        console.log(`🗑️ Deleting extra record: ${otherRecord.name} (ID: ${otherRecord.id})`);
        const { error: deleteError } = await supabase
            .from('employees')
            .delete()
            .eq('id', otherRecord.id);

        if (deleteError) {
            console.error('❌ Error deleting extra record:', deleteError);
            return;
        }
        console.log('✅ Extra record deleted.');
    }

    // 3. Update the Super Admin record
    console.log(`🆙 Updating Super Admin record: ${superAdmin.email} (ID: ${superAdmin.id})`);
    const { error: updateError } = await supabase
        .from('employees')
        .update({
            name: 'רני',
            phone: '0548317887',
            pin_code: '2102',
            is_super_admin: true,
            access_level: 'admin' // Ensure high access level
        })
        .eq('id', superAdmin.id);

    if (updateError) {
        console.error('❌ Error updating Super Admin:', updateError);
        return;
    }

    console.log('✅ Super Admin record updated successfully with PIN 2102 and phone 0548317887.');

    // 4. Verify
    const { data: final, error: verifyError } = await supabase
        .from('employees')
        .select('*')
        .eq('email', 'ranbenri@gmail.com')
        .single();

    if (verifyError) {
        console.error('❌ Verification error:', verifyError);
    } else {
        console.log('\n✨ Final Super Admin Record:');
        console.table([final]);
    }
}

cleanupRani();
