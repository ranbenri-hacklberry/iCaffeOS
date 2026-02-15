const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load env directly to get the pepper
const env = dotenv.parse(fs.readFileSync('.env.local'));
const pepper = env.FACE_VECTOR_PEPPER.split(',').map(Number);

const supabaseUrl = process.env.LOCAL_SUPABASE_URL || process.env.SUPABASE_URL || env.LOCAL_SUPABASE_URL;
const supabaseKey = process.env.LOCAL_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || env.LOCAL_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function applyPepper(vector, pepperArray) {
    return vector.map((val, i) => val + pepperArray[i]);
}

async function migrateData() {
    console.log('Migrating vectors with pepper...');

    const { data: employees, error: fetchError } = await supabase
        .from('employees')
        .select('id, name, face_embedding')
        .not('face_embedding', 'is', null);

    if (fetchError) {
        console.error('Error fetching employees:', fetchError);
        return;
    }

    for (const emp of employees) {
        // face_embedding might be a string or array depending on how it's returned
        let vector = emp.face_embedding;
        if (typeof vector === 'string') {
            vector = JSON.parse(vector);
        }

        console.log(`Processing ${emp.name}...`);
        const peppered = applyPepper(vector, pepper);
        const vectorString = `[${peppered.join(',')}]`;

        const { error: updateError } = await supabase
            .from('employees')
            .update({ face_embedding: vectorString })
            .eq('id', emp.id);

        if (updateError) {
            console.error(`Error updating ${emp.name}:`, updateError);
        } else {
            console.log(`Successfully peppered ${emp.name}!`);
        }
    }
}

migrateData();
