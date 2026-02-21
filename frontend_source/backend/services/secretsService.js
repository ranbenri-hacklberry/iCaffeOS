/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Secrets Service — Centralized Data Access Layer for business_secrets
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * All backend services should fetch API keys through this module instead of
 * querying the `businesses` table directly.
 * 
 * Usage:
 *   import { getSecrets, getSecret } from './secretsService.js';
 *   
 *   const secrets = await getSecrets(businessId);
 *   const geminiKey = secrets.gemini_api_key;
 *   
 *   // Or fetch a single key:
 *   const key = await getSecret(businessId, 'gemini_api_key');
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key (bypasses RLS)
const supabaseUrl = process.env.LOCAL_SUPABASE_URL || process.env.VITE_LOCAL_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.LOCAL_SUPABASE_SERVICE_KEY || process.env.VITE_LOCAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// In-memory cache with TTL (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;
const secretsCache = new Map();

/**
 * Get all secrets for a business.
 * Uses in-memory cache with 5-minute TTL.
 * 
 * @param {string} businessId - UUID of the business
 * @param {boolean} skipCache - Force a fresh fetch from DB
 * @returns {Promise<Object>} All secret columns for this business
 */
export async function getSecrets(businessId, skipCache = false) {
    if (!businessId) return {};

    // Check cache
    if (!skipCache && secretsCache.has(businessId)) {
        const cached = secretsCache.get(businessId);
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.data;
        }
        // Cache expired
        secretsCache.delete(businessId);
    }

    if (!supabase) {
        console.warn('[SecretsService] Supabase not configured, falling back to env vars');
        return getEnvFallback();
    }

    try {
        // Use the SECURITY DEFINER RPC for guaranteed access
        const { data, error } = await supabase.rpc('get_business_secrets', {
            p_business_id: businessId
        });

        if (error) {
            // Fallback: try direct table access (service_role bypasses RLS)
            console.warn('[SecretsService] RPC failed, trying direct access:', error.message);
            const { data: directData, error: directError } = await supabase
                .from('business_secrets')
                .select('*')
                .eq('business_id', businessId)
                .single();

            if (directError) throw directError;

            const secrets = directData || {};
            secretsCache.set(businessId, { data: secrets, timestamp: Date.now() });
            return secrets;
        }

        // RPC returns an array, take first result
        const secrets = (Array.isArray(data) ? data[0] : data) || {};
        secretsCache.set(businessId, { data: secrets, timestamp: Date.now() });
        return secrets;

    } catch (err) {
        console.error('[SecretsService] Error fetching secrets:', err);
        return getEnvFallback();
    }
}

/**
 * Get a single secret value for a business.
 * 
 * @param {string} businessId - UUID of the business
 * @param {string} field - Column name (e.g., 'gemini_api_key')
 * @returns {Promise<string|null>}
 */
export async function getSecret(businessId, field) {
    const secrets = await getSecrets(businessId);
    return secrets[field] || null;
}

/**
 * Get API keys for a specific provider.
 * Drop-in replacement for getProviderKey() in mayaService.
 * 
 * @param {string} businessId 
 * @param {string} provider - 'gemini'|'google'|'claude'|'anthropic'|'grok'|'xai'
 * @returns {Promise<string|null>}
 */
export async function getProviderKey(businessId, provider) {
    const providerMap = {
        'google': 'gemini_api_key',
        'gemini': 'gemini_api_key',
        'anthropic': 'claude_api_key',
        'claude': 'claude_api_key',
        'xai': 'grok_api_key',
        'grok': 'grok_api_key'
    };

    // Try environment variables first (system-level override)
    const envMap = {
        'google': [process.env.GEMINI_API_KEY, process.env.VITE_GEMINI_API_KEY],
        'gemini': [process.env.GEMINI_API_KEY, process.env.VITE_GEMINI_API_KEY],
        'anthropic': [process.env.CLAUDE_API_KEY, process.env.VITE_CLAUDE_API_KEY],
        'claude': [process.env.CLAUDE_API_KEY, process.env.VITE_CLAUDE_API_KEY],
        'xai': [process.env.GROK_API_KEY, process.env.VITE_GROK_API_KEY],
        'grok': [process.env.GROK_API_KEY, process.env.VITE_GROK_API_KEY]
    };

    // Env vars as highest-priority fallback
    const envKeys = envMap[provider] || [];
    const envKey = envKeys.find(k => k);

    // Then check business_secrets
    const field = providerMap[provider] || 'gemini_api_key';
    const dbKey = await getSecret(businessId, field);

    return dbKey || envKey || null;
}

/**
 * Get multiple API keys at once (e.g., for adService).
 * 
 * @param {string} businessId 
 * @returns {Promise<{geminiKey: string|null, grokKey: string|null}>}
 */
export async function getBusinessApiKeys(businessId) {
    if (!businessId) return { geminiKey: null, grokKey: null };

    const secrets = await getSecrets(businessId);
    return {
        geminiKey: secrets.gemini_api_key || null,
        grokKey: secrets.grok_api_key || null
    };
}

/**
 * Get YouTube API key for a business.
 * 
 * @param {string} businessId 
 * @returns {Promise<string|null>}
 */
export async function getYouTubeApiKey(businessId) {
    const key = await getSecret(businessId, 'youtube_api_key');
    return key || process.env.YOUTUBE_API_KEY || null;
}

/**
 * Get Kling API keys for video generation.
 * 
 * @param {string} businessId 
 * @returns {Promise<{accessKey: string|null, secretKey: string|null}>}
 */
export async function getKlingKeys(businessId) {
    const secrets = await getSecrets(businessId);
    return {
        accessKey: secrets.kling_access_key || null,
        secretKey: secrets.kling_secret_key || null
    };
}

/**
 * Get SMS API key for a business.
 * 
 * @param {string} businessId 
 * @returns {Promise<string|null>}
 */
export async function getSmsApiKey(businessId) {
    return getSecret(businessId, 'global_sms_api_key');
}

/**
 * Invalidate cached secrets for a business.
 * Call this after a key is updated.
 * 
 * @param {string} businessId 
 */
export function invalidateCache(businessId) {
    if (businessId) {
        secretsCache.delete(businessId);
    } else {
        secretsCache.clear();
    }
}

/**
 * Fallback: Return env vars when Supabase is unavailable.
 */
function getEnvFallback() {
    return {
        gemini_api_key: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || null,
        grok_api_key: process.env.GROK_API_KEY || process.env.VITE_GROK_API_KEY || null,
        claude_api_key: process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY || null,
        youtube_api_key: process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || null,
        kling_access_key: null,
        kling_secret_key: null,
        global_sms_api_key: null,
        whatsapp_api_key: null
    };
}

export default {
    getSecrets,
    getSecret,
    getProviderKey,
    getBusinessApiKeys,
    getYouTubeApiKey,
    getKlingKeys,
    getSmsApiKey,
    invalidateCache
};
