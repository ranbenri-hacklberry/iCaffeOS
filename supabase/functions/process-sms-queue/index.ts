// Supabase Edge Function: process-sms-queue
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CLOUD_FUNCTION_URL = 'https://us-central1-repos-477613.cloudfunctions.net/sendSms';

Deno.serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: pendingSms, error: fetchError } = await supabase
            .from('sms_queue')
            .select('*')
            .eq('status', 'pending')
            .limit(10);

        if (fetchError) throw new Error(`Failed to fetch queue: ${fetchError.message}`);
        if (!pendingSms || pendingSms.length === 0) {
            return new Response(JSON.stringify({ message: 'No pending SMS' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const results = [];
        for (const sms of pendingSms) {
            try {
                // validation
                const cleanPhone = sms.phone?.toString().trim();
                const isGuest = cleanPhone?.startsWith('GUEST');
                const isNumeric = /^\d+$/.test(cleanPhone);

                if (isGuest || !isNumeric) {
                     await supabase
                        .from('sms_queue')
                        .update({ status: 'failed', error: 'Invalid phone number (GUEST or non-numeric)' })
                        .eq('id', sms.id);
                    results.push({ id: sms.id, status: 'failed', error: 'Invalid phone number' });
                    continue;
                }

                const response = await fetch(CLOUD_FUNCTION_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: cleanPhone, message: sms.message }),
                });

                const result = await response.json();

                if (response.ok && !result.error && result.status !== 'error') {
                    await supabase
                        .from('sms_queue')
                        .update({ status: 'success', sent_at: new Date().toISOString(), provider_response: JSON.stringify(result) })
                        .eq('id', sms.id);
                    results.push({ id: sms.id, status: 'success' });
                } else {
                    await supabase
                        .from('sms_queue')
                        .update({ status: 'failed', error: result.error || result.message || 'Unknown provider error', provider_response: JSON.stringify(result) })
                        .eq('id', sms.id);
                    results.push({ id: sms.id, status: 'failed', error: result.error });
                }
            } catch (sendError) {
                await supabase
                    .from('sms_queue')
                    .update({ status: 'failed', error: sendError.message })
                    .eq('id', sms.id);
                results.push({ id: sms.id, status: 'failed', error: sendError.message });
            }
        }
        return new Response(JSON.stringify({ processed: results.length, results }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});

