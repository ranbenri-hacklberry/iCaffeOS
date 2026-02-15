// Supabase Edge Function: process-sms-queue
// Deploy this to Supabase Edge Functions
// 
// This function reads from sms_queue and sends SMS via your Cloud Function

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CLOUD_FUNCTION_URL = 'https://us-central1-repos-477613.cloudfunctions.net/sendSms';

Deno.serve(async (req) => {
    try {
        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get pending SMS from queue
        const { data: pendingSms, error: fetchError } = await supabase
            .from('sms_queue')
            .select('*')
            .eq('status', 'pending')
            .limit(10);

        if (fetchError) {
            throw new Error(`Failed to fetch queue: ${fetchError.message}`);
        }

        if (!pendingSms || pendingSms.length === 0) {
            return new Response(JSON.stringify({ message: 'No pending SMS' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const results = [];

        for (const sms of pendingSms) {
            try {
                // Send SMS via Cloud Function
                const response = await fetch(CLOUD_FUNCTION_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: sms.phone,
                        message: sms.message,
                    }),
                });

                const result = await response.json();

                if (response.ok && !result.error) {
                    // Mark as sent
                    await supabase
                        .from('sms_queue')
                        .update({ status: 'sent', sent_at: new Date().toISOString() })
                        .eq('id', sms.id);

                    results.push({ id: sms.id, status: 'sent' });
                } else {
                    // Mark as failed
                    await supabase
                        .from('sms_queue')
                        .update({ status: 'failed', error: result.error || 'Unknown error' })
                        .eq('id', sms.id);

                    results.push({ id: sms.id, status: 'failed', error: result.error });
                }
            } catch (sendError) {
                // Mark as failed
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
