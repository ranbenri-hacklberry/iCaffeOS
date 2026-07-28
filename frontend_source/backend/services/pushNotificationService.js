import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import { getSecrets } from './secretsService.js';

let supabase = null;

function getSupabase() {
    if (supabase) return supabase;
    const supabaseUrl = process.env.LOCAL_SUPABASE_URL || process.env.VITE_LOCAL_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.LOCAL_SUPABASE_SERVICE_KEY || process.env.VITE_LOCAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
        supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
    return supabase;
}

let firebaseApp = null;

/**
 * Dynamically initialize Firebase Admin using business secrets
 */
export async function initFirebase(businessId) {
    if (firebaseApp) return firebaseApp;

    try {
        let serviceAccount = null;

        // 1. Try environment variables
        if (process.env.FCM_SERVICE_ACCOUNT_JSON) {
            serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);
        } else {
            // 2. Fetch from business secrets
            const secrets = await getSecrets(businessId);
            if (secrets && secrets.fcm_service_account) {
                serviceAccount = JSON.parse(secrets.fcm_service_account);
            }
        }

        if (!serviceAccount) {
            console.warn('⚠️ [PushService] Firebase credentials not configured. Running in mock/development mode.');
            return null;
        }

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('🔥 [PushService] Firebase Admin SDK successfully initialized.');
        return firebaseApp;
    } catch (err) {
        console.error('❌ [PushService] Firebase initialization failed:', err.message);
        return null;
    }
}

/**
 * Targeted Commercial Push Trigger
 * Matches store against subscriptions where marketing is allowed, joins profiles, and sends pushes via FCM.
 */
export async function sendRegionalPromotion(storeId, payload) {
    if (!storeId || !payload) {
        throw new Error('Missing storeId or promotion payload');
    }

    const dbClient = getSupabase();
    if (!dbClient) {
        throw new Error('Database client offline');
    }

    try {
        console.log(`📣 [PushService] Fetching target audience for store ${storeId}...`);

        // Execute secure RPC query matching store against subscriptions
        const { data: tokensData, error: tokensErr } = await dbClient.rpc('get_opted_in_fcm_tokens', {
            p_store_id: storeId
        });

        if (tokensErr) {
            throw new Error(`Failed to query push targets: ${tokensErr.message}`);
        }

        const fcmTokens = (tokensData || [])
            .map((row) => row.fcm_token)
            .filter((t) => typeof t === 'string' && t.trim().length > 0);

        if (fcmTokens.length === 0) {
            console.log(`ℹ️ [PushService] No opted-in users found for store ${storeId}. Skipping broadcast.`);
            return { success: true, sentCount: 0 };
        }

        console.log(`🎯 [PushService] Found ${fcmTokens.length} opted-in subscribers for store ${storeId}.`);

        // Initialize Firebase Messaging
        const app = await initFirebase(storeId);

        if (app) {
            // Send push via Firebase Cloud Messaging multicast
            const message = {
                tokens: fcmTokens,
                notification: {
                    title: payload.title,
                    body: payload.body
                },
                data: payload.data || {}
            };

            const response = await admin.messaging().sendEachForMulticast(message);

            console.log(`✅ [PushService] Broadcast complete. Success: ${response.successCount}, Failure: ${response.failureCount}`);
            return {
                success: true,
                sentCount: response.successCount,
                failedCount: response.failureCount,
                results: response.responses
            };
        } else {
            // Dev/Log Bypass Mode
            console.log(`📝 [PushService][DEV MODE] Broadcast triggered for store ${storeId} to ${fcmTokens.length} device(s).`);
            console.log('Payload:', JSON.stringify(payload, null, 2));
            console.log('Tokens:', fcmTokens);

            return {
                success: true,
                devMode: true,
                sentCount: fcmTokens.length
            };
        }
    } catch (err) {
        console.error('❌ [PushService] Regional promotion broadcast failed:', err);
        throw err;
    }
}
