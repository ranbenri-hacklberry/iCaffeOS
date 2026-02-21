/**
 * smsRoutes.js - SMS service proxy
 *
 * Endpoints:
 * - GET /api/sms/balance  - Check remaining SMS credit from IT Newsletter
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// IT Newsletter balance API (Israeli SMS provider)
// Credentials can be set via env vars OR stored in businesses.settings JSON
const SMS_USERNAME = process.env.SMS_API_USERNAME || process.env.IT_NEWSLETTER_USERNAME;
const SMS_PASSWORD = process.env.SMS_API_PASSWORD || process.env.IT_NEWSLETTER_PASSWORD;
const SMS_API_KEY = process.env.SMS_API_KEY || '5v$YW#4k2Dn@w96306$H#S7cMp@8t$6R';

const BALANCE_API_URL = 'https://itnewsletter.itnewsletter.co.il/api/GetBalance.aspx';
const REST_BALANCE_URL = 'https://sapi.itnewsletter.co.il/api/restApiSms/getBalance';

/**
 * Try to fetch balance from IT Newsletter using API Key (Rest API).
 */
async function fetchBalanceWithKey(apiKey) {
    const response = await fetch(REST_BALANCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ApiKey: apiKey }),
        signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) throw new Error(`REST API returned ${response.status}`);
    const data = await response.json();

    if (data.success === false) throw new Error(data.errDesc || 'REST API Error');
    return data.result; // The balance is usually in 'result' field
}

/**
 * Try to fetch balance from IT Newsletter using Username/Password (Old API).
 * Returns a number or throws.
 */
async function fetchITNewsletterBalance(username, password) {
    const url = `${BALANCE_API_URL}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&Format=JSON`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`IT Newsletter API returned ${response.status}`);

    const text = await response.text();
    let balance = null;
    try {
        const json = JSON.parse(text);
        balance = json?.Balance ?? json?.balance ?? json?.credits ?? null;
    } catch {
        const parsed = parseFloat(text.trim());
        if (!isNaN(parsed)) balance = parsed;
    }

    if (balance === null) throw new Error('Unexpected balance response format');
    return balance;
}

/**
 * Try to retrieve SMS credentials from the businesses table (settings JSON).
 */
async function getCredentialsFromDB() {
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        const { data } = await supabase
            .from('businesses')
            .select('settings')
            .not('settings', 'is', null)
            .limit(10);

        for (const biz of data || []) {
            const s = biz.settings || {};
            const u = s.sms_username || s.sms_api_username || s.it_newsletter_username;
            const p = s.sms_password || s.sms_api_password || s.it_newsletter_password;
            if (u && p) return { username: u, password: p };
        }
    } catch (e) {
        console.warn('[SMS] Could not read credentials from DB:', e.message);
    }
    return null;
}

/**
 * GET /api/sms/balance
 * Returns { success: true, balance: NUMBER } or { success: false, reason: '...' }
 */
router.get('/balance', async (req, res) => {
    try {
        // 1. Try API Key first (REST API) - Most likely what's "already in env"
        if (SMS_API_KEY) {
            try {
                const balance = await fetchBalanceWithKey(SMS_API_KEY);
                console.log(`💳 SMS Balance fetched via API Key: ${balance}`);
                return res.json({ success: true, balance });
            } catch (apiKeyErr) {
                console.warn('[SMS] API Key balance check failed, trying other methods:', apiKeyErr.message);
            }
        }

        // 2. Try env-var credentials (Old API)
        let username = SMS_USERNAME;
        let password = SMS_PASSWORD;

        // 3. Fallback to DB credentials
        if (!username || !password) {
            const dbCreds = await getCredentialsFromDB();
            if (dbCreds) {
                username = dbCreds.username;
                password = dbCreds.password;
            }
        }

        if (username && password) {
            const balance = await fetchITNewsletterBalance(username, password);
            console.log(`💳 SMS Balance fetched via User/Pass: ${balance}`);
            return res.json({ success: true, balance });
        }

        // No credentials — return graceful not-configured response
        return res.json({
            success: false,
            balance: null,
            reason: 'SMS credentials not configured.'
        });

    } catch (err) {
        console.error('[SMS/balance] Final error:', err.message);
        return res.status(500).json({ success: false, balance: null, error: err.message });
    }
});

export default router;
