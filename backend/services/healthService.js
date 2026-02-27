import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';
const CORTEX_GATEWAY_URL = process.env.CORTEX_GATEWAY_URL || 'http://cortex-gateway:8000';

/**
 * HealthAggregator Service
 * Aggregates health status from various internal services.
 */
export async function getAggregatedHealth() {
    const results = {
        backend: 'online',
        database: 'offline',
        cortex_gateway: 'offline',
        ollama: 'offline'
    };

    const promises = [];

    // 1. Database Check (Supabase/Postgres)
    promises.push((async () => {
        try {
            const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

            if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);
                const { data, error } = await supabase.from('businesses').select('id').limit(1);
                if (!error) {
                    results.database = 'online';
                } else {
                    console.error('[HealthService] Database check failed:', error.message);
                }
            }
        } catch (err) {
            console.error('[HealthService] Database connection error:', err.message);
        }
    })());

    // 2. Cortex Gateway Check
    promises.push((async () => {
        try {
            const resp = await axios.get(`${CORTEX_GATEWAY_URL}/health`, { timeout: 3000 });
            if (resp.status === 200) {
                results.cortex_gateway = 'online';
            }
        } catch (err) {
            console.warn('[HealthService] Cortex Gateway unreachable:', err.message);
        }
    })());

    // 3. Ollama Check
    promises.push((async () => {
        try {
            const resp = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 3000 });
            if (resp.status === 200) {
                results.ollama = 'online';
            }
        } catch (err) {
            console.warn('[HealthService] Ollama unreachable:', err.message);
        }
    })());

    // 4. Gemini Check
    promises.push((async () => {
        try {
            const key = process.env.GEMINI_API_KEY;
            if (key) {
                const resp = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, { timeout: 3000 });
                if (resp.status === 200) {
                    results.gemini = 'online';
                }
            }
        } catch (err) {
            console.warn('[HealthService] Gemini check failed:', err.message);
        }
    })());

    await Promise.allSettled(promises);

    return {
        status: Object.values(results).every(v => v === 'online') ? 'healthy' : 'degraded',
        services: results,
        timestamp: new Date().toISOString()
    };
}
