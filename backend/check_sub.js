import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

(async () => {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const bizId = '22222222-2222-2222-2222-222222222222';
    const { data, error } = await supabase.from('businesses').select('id, name, subscription_active').eq('id', bizId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Business:', data[0]);

    if (data && data[0] && !data[0].subscription_active) {
        const { error: upErr } = await supabase.from('businesses').update({ subscription_active: true }).eq('id', bizId);
        if (upErr) console.error('Update Error:', upErr);
        else console.log('Subscription activated');
    } else {
        console.log('Subscription already active or business not found');
    }
})();
