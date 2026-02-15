/**
 * Spotify Auth Routes
 *
 * Backend proxy for Spotify OAuth2 token operations.
 * The refresh_token never needs to leave the server in production,
 * but for the current PKCE flow the frontend sends it.
 *
 * Endpoints:
 *   POST /api/spotify/refresh  → Exchange a refresh_token for a new access_token
 *   POST /api/spotify/callback → Exchange an auth code for initial tokens (optional)
 */

import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET; // only needed for confidential flow
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// ──────────────────────────────────────────────────────────────
// POST /api/spotify/refresh
//
// Body: { refresh_token: string }
// Returns: { access_token, token_type, expires_in, scope, refresh_token? }
//
// The SpotifyTokenService on the frontend calls this endpoint
// to get a fresh access_token without exposing the client_secret
// in the browser.
// ──────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ error: 'Missing refresh_token' });
    }

    if (!SPOTIFY_CLIENT_ID) {
        return res.status(500).json({ error: 'SPOTIFY_CLIENT_ID not configured on server' });
    }

    try {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token,
            client_id: SPOTIFY_CLIENT_ID,
        });

        // If we have a client_secret (confidential app), include basic auth
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        if (SPOTIFY_CLIENT_SECRET) {
            const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
        }

        const response = await fetch(SPOTIFY_TOKEN_URL, {
            method: 'POST',
            headers,
            body: params,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Spotify refresh failed:', data);
            return res.status(response.status).json({
                error: data.error || 'refresh_failed',
                error_description: data.error_description || 'Token refresh failed',
            });
        }

        // Return the fresh tokens to the frontend
        // The frontend will dual-write to Supabase + Dexie
        console.log('🔑 Spotify token refreshed via backend proxy');

        res.json({
            access_token: data.access_token,
            token_type: data.token_type,
            expires_in: data.expires_in,
            scope: data.scope,
            // Spotify may rotate the refresh_token
            refresh_token: data.refresh_token || refresh_token,
        });

    } catch (err) {
        console.error('❌ Spotify refresh error:', err);
        res.status(500).json({ error: 'server_error', message: err.message });
    }
});

// ──────────────────────────────────────────────────────────────
// POST /api/spotify/callback
//
// Body: { code: string, code_verifier: string, redirect_uri: string }
// Returns: { access_token, token_type, expires_in, refresh_token, scope }
//
// Optional: exchange an auth code for initial tokens server-side.
// Useful if you want the backend to hold the client_secret.
// ──────────────────────────────────────────────────────────────
router.post('/callback', async (req, res) => {
    const { code, code_verifier, redirect_uri } = req.body;

    if (!code || !redirect_uri) {
        return res.status(400).json({ error: 'Missing code or redirect_uri' });
    }

    try {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri,
            client_id: SPOTIFY_CLIENT_ID,
        });

        // PKCE flow uses code_verifier instead of client_secret
        if (code_verifier) {
            params.append('code_verifier', code_verifier);
        }

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        if (SPOTIFY_CLIENT_SECRET && !code_verifier) {
            const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
        }

        const response = await fetch(SPOTIFY_TOKEN_URL, {
            method: 'POST',
            headers,
            body: params,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Spotify callback token exchange failed:', data);
            return res.status(response.status).json({
                error: data.error || 'exchange_failed',
                error_description: data.error_description || 'Code exchange failed',
            });
        }

        console.log('🔑 Spotify initial tokens acquired via backend proxy');

        res.json({
            access_token: data.access_token,
            token_type: data.token_type,
            expires_in: data.expires_in,
            refresh_token: data.refresh_token,
            scope: data.scope,
        });

    } catch (err) {
        console.error('❌ Spotify callback error:', err);
        res.status(500).json({ error: 'server_error', message: err.message });
    }
});

export default router;
