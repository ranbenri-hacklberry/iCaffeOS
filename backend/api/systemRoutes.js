
import express from 'express';
import { exec } from 'child_process';

const router = express.Router();

/**
 * GET /api/system/containers
 * Get status of Docker containers (Supabase, etc.)
 */
router.get('/containers', (req, res) => {
    // Only works on Linux/Mac with Docker installed
    exec('docker ps --format "{{.Names}}\t{{.Status}}"', (error, stdout, stderr) => {
        if (error) {
            console.error('Docker check failed:', error);
            // Fallback for non-docker environments (like Vercel or local dev without docker)
            return res.json({
                success: true,
                containers: [],
                message: 'Docker not available or error occurred'
            });
        }

        const lines = stdout.trim().split('\n');
        const containers = lines
            .filter(line => line.trim())
            .map(line => {
                const [name, status] = line.split('\t');
                return { name, status };
            });

        res.json({
            success: true,
            containers
        });
    });
});


/**
 * GET /api/system/validate-integrations
 * Intelligent Pre-Flight Check for External APIs
 */
router.get('/validate-integrations', async (req, res) => {
    // 1. Determine Business Context
    // In a real multi-tenant app, this comes from auth/subdomain.
    // For local/kiosk, we default to the primary business.
    const DEFAULT_BUSINESS_ID = process.env.DEFAULT_BUSINESS_ID || '22222222-2222-2222-2222-222222222222';
    const businessId = req.query.businessId || DEFAULT_BUSINESS_ID;

    // 2. Fetch Configuration (non-secret) & Keys (from business_secrets)
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { getSecrets } = await import('../services/secretsService.js');

    const { data: business, error } = await supabase
        .from('businesses')
        .select('id, name, settings')
        .eq('id', businessId)
        .single();

    if (error || !business) {
        return res.json({
            success: false,
            message: 'Business configuration not found',
            checks: {}
        });
    }

    // 🔒 REFACTORED: Fetch API keys from business_secrets
    const secrets = await getSecrets(businessId);

    // 3. Conditional Checks based on Settings
    const settings = business.settings || {};
    const enableAI = settings.enable_ai_assistant !== false && !!secrets.gemini_api_key;
    const enableSpotify = settings.enable_spotify === true;
    const enableOpenAI = settings.enable_openai === true;

    const checks = {};

    // Parallel Execution Array
    const promises = [];

    // --- GEMINI CHECK ---
    if (enableAI) {
        promises.push((async () => {
            try {
                // Lightweight check: List models or simple generation
                const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${secrets.gemini_api_key}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                checks.gemini = { status: 'ok' };
            } catch (err) {
                checks.gemini = { status: 'error', message: err.message, dashboard: 'https://aistudio.google.com/' };
            }
        })());
    } else {
        checks.gemini = { status: 'skipped' };
    }

    // --- SPOTIFY CHECK ---
    if (enableSpotify) {
        promises.push((async () => {
            // Mock check or real check if we had token. For now, we assume token is in settings or DB
            // This requires more complex auth flow usually, so we'll do a placeholder check for CLIENT_ID
            const clientId = process.env.SPOTIFY_CLIENT_ID;
            if (clientId) checks.spotify = { status: 'ok' };
            else checks.spotify = { status: 'error', message: 'Missing Client ID', dashboard: 'https://developer.spotify.com/dashboard' };
        })());
    } else {
        checks.spotify = { status: 'skipped' };
    }

    // --- OPENAI CHECK ---
    if (enableOpenAI) {
        // Placeholder for OpenAI check
        checks.openai = { status: 'skipped', message: 'Not configured' };
    }

    // Execute All
    await Promise.allSettled(promises);

    res.json({
        success: true,
        businessName: business.name,
        checks
    });
});

export default router;
