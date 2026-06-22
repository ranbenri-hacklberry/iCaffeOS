
import pkg from 'pg';
const { Client } = pkg;
import axios from 'axios';
import { getSmsApiKey } from './secretsService.js';
import { createClient } from '@supabase/supabase-js';

// Configuration from Environment
const PG_CONN_STRING = process.env.LOCAL_DB_URL || 'postgresql://postgres:postgres@localhost:54321/postgres';
const supabaseUrl = process.env.LOCAL_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.LOCAL_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// IT Newsletter (Global SMS) Config - Derived from backend/api/smsRoutes.js
const IT_NEWSLETTER_SEND_URL = 'https://sapi.itnewsletter.co.il/api/restApiSms/sendSms';
const SYSTEM_SMS_API_KEY = process.env.SMS_API_KEY || '5v$YW#4k2Dn@w96306$H#S7cMp@8t$6R';

/**
 * 📡 IT Newsletter (Global SMS) Dispatcher
 */
async function sendSmsToProvider(phone, message, businessId) {
    try {
        // Use business-specific key if available, otherwise fallback to system key
        const businessApiKey = await getSmsApiKey(businessId);
        const apiKey = businessApiKey || SYSTEM_SMS_API_KEY;

        if (!apiKey) {
            throw new Error(`No SMS API key available for dispatching.`);
        }

        console.log(`🚀 [WORKER] Sending SMS to ${phone} via IT Newsletter...`);

        // IT Newsletter REST API Schema
        const payload = {
            ApiKey: apiKey,
            SmsType: 3, // Group SMS/Personal
            Message: message,
            Recipients: [
                { Phone: phone }
            ]
        };

        const response = await axios.post(IT_NEWSLETTER_SEND_URL, payload, { 
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });

        const data = response.data;
        
        // IT Newsletter Success Pattern: { success: true, result: { ... } }
        if (data && data.success === true) {
            console.log(`✅ [WORKER] SMS sent successfully. Result ID: ${data.result?.[0]?.MessageId || 'N/A'}`);
            return { success: true, data };
        } else {
            console.error(`❌ [WORKER] IT Newsletter Rejection:`, data);
            throw new Error(data?.errDesc || 'IT Newsletter API rejected the request');
        }
    } catch (err) {
        console.error(`❌ [WORKER] Provider Error:`, err.message);
        throw err;
    }
}

/**
 * 🛠️ Worker Core
 */
async function processSmsRow(id) {
    console.log(`🔍 [WORKER] Processing SMS ID: ${id}`);
    
    const { data: sms, error } = await supabase
        .from('sms_queue')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !sms) {
        console.error(`❌ [WORKER] Could not fetch SMS row:`, error?.message);
        return;
    }

    if (sms.status === 'sent') return;

    try {
        await sendSmsToProvider(sms.phone_number || sms.phone, sms.message, sms.business_id);
        
        await supabase.from('sms_queue').update({
            status: 'sent',
            processed_at: new Date().toISOString(),
            error_log: null
        }).eq('id', id);
        
        console.log(`✅ [WORKER] SMS ${id} marked as SENT`);
    } catch (err) {
        await supabase.from('sms_queue').update({
            status: 'failed',
            processed_at: new Date().toISOString(),
            error_log: err.message
        }).eq('id', id);
        
        console.warn(`⚠️ [WORKER] SMS ${id} failed: ${err.message}`);
    }
}

async function startWorker() {
    console.log('👷 [WORKER] IT Newsletter Worker starting on M1...');

    const { data: pending } = await supabase
        .from('sms_queue')
        .select('id')
        .eq('status', 'pending');

    if (pending && pending.length > 0) {
        console.log(`🔄 [WORKER] Recovering ${pending.length} pending SMS tasks...`);
        for (const row of pending) {
            await processSmsRow(row.id);
        }
    }

    const client = new Client({ connectionString: PG_CONN_STRING });
    
    client.on('notification', (msg) => {
        if (msg.channel === 'sms_event') {
            processSmsRow(msg.payload);
        }
    });

    try {
        await client.connect();
        await client.query('LISTEN sms_event');
        console.log('🎧 [WORKER] Listening for IT Newsletter SMS events...');
    } catch (err) {
        console.error('💀 [WORKER] Connection failed:', err);
        process.exit(1);
    }
}

startWorker();
