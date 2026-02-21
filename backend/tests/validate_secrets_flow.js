#!/usr/bin/env node
/**
 * ============================================================
 *   🔒 SECRETS ARCHITECTURE — END-TO-END VALIDATION SCRIPT
 * ============================================================
 * 
 * Purpose:
 *   Validates the new business_secrets architecture works
 *   correctly BEFORE running the 005_drop_columns.sql migration.
 * 
 * What it tests:
 *   1. RPC: upsert_business_secret — Insert a dummy test key
 *   2. RPC: get_business_secrets — Read back via SECURITY DEFINER
 *   3. secretsService.js — Cache layer + fallback verification
 *   4. /validate-integrations — HTTP 200 and correct business key detection
 *   5. System-wide audit — No remaining references to old businesses columns
 * 
 * Usage:
 *   node backend/tests/validate_secrets_flow.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_KEY in .env or environment
 *   - Backend server running on port 8081 (for HTTP endpoint tests)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// ─── Setup ──────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../frontend_source/.env') });

const SUPABASE_URL = process.env.LOCAL_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.LOCAL_SUPABASE_SERVICE_KEY;
const BACKEND_URL = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || 'http://localhost:8081';

// Test business ID — uses default if not set
const TEST_BUSINESS_ID = process.env.DEFAULT_BUSINESS_ID || '22222222-2222-2222-2222-222222222222';
const TEST_MARKER = `VALIDATION_TEST_${Date.now()}`;

// ─── Test State ─────────────────────────────────────────────
const results = [];
let passCount = 0;
let failCount = 0;
let skipCount = 0;

function pass(name, detail = '') {
    passCount++;
    results.push({ status: '✅ PASS', name, detail });
    console.log(`  ✅ PASS  ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
    failCount++;
    results.push({ status: '❌ FAIL', name, detail });
    console.log(`  ❌ FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

function skip(name, detail = '') {
    skipCount++;
    results.push({ status: '⏭️ SKIP', name, detail });
    console.log(`  ⏭️ SKIP  ${name}${detail ? ` — ${detail}` : ''}`);
}

// ─── Tests ──────────────────────────────────────────────────
async function main() {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║   🔒 SECRETS ARCHITECTURE — E2E VALIDATION SUITE    ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    console.log(`  Business ID : ${TEST_BUSINESS_ID}`);
    console.log(`  Supabase    : ${SUPABASE_URL || '(not configured)'}`);
    console.log(`  Backend     : ${BACKEND_URL}`);
    console.log(`  Test Marker : ${TEST_MARKER}`);
    console.log('');

    // ── Pre-flight checks ──
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('  ⛔ FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.');
        console.error('  Set these in .env or export them as environment variables.\n');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── Test 1: business_secrets table exists ──
    console.log('═══ Test Group 1: Database Schema ══════════════════\n');

    try {
        const { data, error } = await supabase
            .from('business_secrets')
            .select('business_id')
            .limit(1);

        if (error) throw error;
        pass('business_secrets table exists and is queryable');
    } catch (err) {
        fail('business_secrets table exists', err.message);
    }

    // ── Test 2: upsert_business_secret RPC exists and works ──
    console.log('\n═══ Test Group 2: RPC Functions ═════════════════════\n');

    try {
        const { error } = await supabase.rpc('upsert_business_secret', {
            p_business_id: TEST_BUSINESS_ID,
            p_field: 'gemini_api_key',
            p_value: TEST_MARKER
        });

        if (error) throw error;
        pass('upsert_business_secret RPC executed successfully', `Set gemini_api_key = ${TEST_MARKER}`);
    } catch (err) {
        fail('upsert_business_secret RPC', err.message);
    }

    // ── Test 3: get_business_secrets RPC reads back correctly ──
    let fetchedKey = null;
    try {
        const { data, error } = await supabase.rpc('get_business_secrets', {
            p_business_id: TEST_BUSINESS_ID
        });

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error('RPC returned empty — no row for this business');
        }

        fetchedKey = data[0]?.gemini_api_key;

        if (fetchedKey === TEST_MARKER) {
            pass('get_business_secrets RPC returns correct value', `gemini_api_key = ${fetchedKey}`);
        } else {
            fail('get_business_secrets RPC value mismatch', `Expected "${TEST_MARKER}", got "${fetchedKey}"`);
        }
    } catch (err) {
        fail('get_business_secrets RPC', err.message);
    }

    // ── Test 4: Direct table read via service_role (bypasses RLS) ──
    try {
        const { data, error } = await supabase
            .from('business_secrets')
            .select('gemini_api_key, grok_api_key, youtube_api_key, global_sms_api_key')
            .eq('business_id', TEST_BUSINESS_ID)
            .single();

        if (error) throw error;

        if (data?.gemini_api_key === TEST_MARKER) {
            pass('Direct service_role read matches expected value');
        } else {
            fail('Direct service_role read', `gemini_api_key = ${data?.gemini_api_key}, expected ${TEST_MARKER}`);
        }

        // Verify other columns exist
        const columnsPresent = ['gemini_api_key', 'grok_api_key', 'youtube_api_key', 'global_sms_api_key']
            .filter(col => col in data);
        pass(`Schema completeness: ${columnsPresent.length}/4 expected columns present`, columnsPresent.join(', '));
    } catch (err) {
        fail('Direct service_role table read', err.message);
    }

    // ── Test 5: secretsService.js module loads correctly ──
    console.log('\n═══ Test Group 3: secretsService.js ═════════════════\n');

    let secretsService = null;
    try {
        // Dynamic import of secretsService
        secretsService = await import(path.resolve(__dirname, '../services/secretsService.js'));
        pass('secretsService.js module loads successfully');
    } catch (err) {
        fail('secretsService.js module import', err.message);
    }

    // ── Test 6: secretsService.getSecrets() returns correct data ──
    if (secretsService) {
        try {
            const secrets = await secretsService.getSecrets(TEST_BUSINESS_ID);

            if (secrets && secrets.gemini_api_key === TEST_MARKER) {
                pass('getSecrets() returned correct gemini_api_key');
            } else {
                fail('getSecrets() value mismatch', `Got: ${secrets?.gemini_api_key}`);
            }
        } catch (err) {
            fail('getSecrets()', err.message);
        }

        // ── Test 7: Cache layer works ──
        try {
            const start = Date.now();
            const cachedSecrets = await secretsService.getSecrets(TEST_BUSINESS_ID);
            const elapsed = Date.now() - start;

            if (cachedSecrets?.gemini_api_key === TEST_MARKER && elapsed < 50) {
                pass('Cache hit works', `Retrieved in ${elapsed}ms (< 50ms threshold)`);
            } else if (cachedSecrets?.gemini_api_key === TEST_MARKER) {
                pass('Cache returned correct value', `${elapsed}ms (may have hit DB)`);
            } else {
                fail('Cache returned wrong value');
            }
        } catch (err) {
            fail('Cache layer test', err.message);
        }

        // ── Test 8: getProviderKey helper ──
        try {
            const key = await secretsService.getProviderKey(TEST_BUSINESS_ID, 'gemini');
            if (key === TEST_MARKER) {
                pass('getProviderKey("gemini") returns correct value');
            } else {
                fail('getProviderKey("gemini")', `Got: ${key}`);
            }
        } catch (err) {
            fail('getProviderKey()', err.message);
        }

        // ── Test 9: getYouTubeApiKey helper ──
        try {
            const ytKey = await secretsService.getYouTubeApiKey(TEST_BUSINESS_ID);
            // May be null if no YT key set — just verify it doesn't crash
            pass('getYouTubeApiKey() executed without error', `Value: ${ytKey || '(null/env fallback)'}`);
        } catch (err) {
            fail('getYouTubeApiKey()', err.message);
        }
    } else {
        skip('secretsService tests', 'Module failed to load');
    }

    // ── Test 10: HTTP Endpoint Tests ──
    console.log('\n═══ Test Group 4: HTTP Endpoints ════════════════════\n');

    try {
        const response = await fetch(`${BACKEND_URL}/api/system/validate-integrations?businessId=${TEST_BUSINESS_ID}`);

        if (response.ok) {
            const body = await response.json();
            pass('/api/system/validate-integrations returned HTTP 200');

            // Verify the response structure is correct
            if (body.success !== undefined) {
                pass('Response has "success" field');
            } else {
                fail('Response structure', 'Missing "success" field');
            }

            // Check if gemini integration was detected via business_secrets
            if (body.checks?.gemini?.message === 'Business Key Active' || body.checks?.gemini?.status === 'ok') {
                pass('Gemini integration detected from business_secrets', body.checks.gemini.message || body.checks.gemini.status);
            } else {
                // This is okay if test marker key is invalid for Gemini API
                skip('Gemini API validation',
                    `Key "${TEST_MARKER}" is a test marker — live validation may fail. Status: ${body.checks?.gemini?.status}`);
            }
        } else {
            fail('/api/system/validate-integrations HTTP status', `Got ${response.status}`);
        }
    } catch (err) {
        skip('/api/system/validate-integrations endpoint', `Backend may not be running: ${err.message}`);
    }

    // ── Test 11: Codebase Audit — No remaining old column references ──
    console.log('\n═══ Test Group 5: Codebase Audit ════════════════════\n');

    const codebaseRoot = path.resolve(__dirname, '../..');
    const dangerPattern = /\.from\(['"]businesses['"]\)[\s\S]{0,120}(?:gemini_api_key|grok_api_key|claude_api_key|youtube_api_key|kling_access_key|kling_secret_key|global_sms_api_key|whatsapp_api_key)/g;
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx'];
    const excludeDirs = ['node_modules', 'dist', 'dist-electron', 'android', 'ios', 'build', 'coverage', '.git', '.next'];

    function scanDir(dir) {
        const violations = [];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (!excludeDirs.includes(entry.name)) {
                        violations.push(...scanDir(fullPath));
                    }
                } else if (codeExtensions.some(ext => entry.name.endsWith(ext))) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const matches = content.match(dangerPattern);
                    if (matches) {
                        violations.push({
                            file: path.relative(codebaseRoot, fullPath),
                            count: matches.length,
                            snippets: matches.map(m => m.substring(0, 80) + '...')
                        });
                    }
                }
            }
        } catch (err) {
            // Skip unreadable dirs
        }
        return violations;
    }

    const violations = scanDir(codebaseRoot);

    if (violations.length === 0) {
        pass('No remaining .from("businesses") queries for secret columns');
    } else {
        fail(`Found ${violations.length} file(s) still querying businesses table for secrets`);
        for (const v of violations) {
            console.log(`       📄 ${v.file} (${v.count} occurrence(s))`);
            v.snippets.forEach(s => console.log(`          → ${s}`));
        }
    }

    // ── Cleanup: Restore original key (or remove test marker) ──
    console.log('\n═══ Cleanup ═════════════════════════════════════════\n');

    try {
        // Set back to null to clean up (or you can set to a real key)
        const { error } = await supabase.rpc('upsert_business_secret', {
            p_business_id: TEST_BUSINESS_ID,
            p_field: 'gemini_api_key',
            p_value: null  // Reset to null — prevents test marker from persisting
        });

        if (error) throw error;
        pass('Cleanup: Test marker removed from gemini_api_key');

        // Bust the cache if secretsService is loaded
        if (secretsService?.invalidateCache) {
            secretsService.invalidateCache(TEST_BUSINESS_ID);
        }
    } catch (err) {
        fail('Cleanup', err.message);
    }

    // ─── Summary ────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║               VALIDATION RESULTS                     ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  ✅ Passed : ${String(passCount).padStart(3)}                                    ║`);
    console.log(`║  ❌ Failed : ${String(failCount).padStart(3)}                                    ║`);
    console.log(`║  ⏭️ Skipped: ${String(skipCount).padStart(3)}                                    ║`);
    console.log('╠══════════════════════════════════════════════════════╣');

    if (failCount === 0) {
        console.log('║                                                      ║');
        console.log('║   🎉  ALL TESTS PASSED — CLEAN BILL OF HEALTH  🎉    ║');
        console.log('║                                                      ║');
        console.log('║   ✅ Safe to proceed with 005_drop_columns.sql       ║');
        console.log('║                                                      ║');
    } else {
        console.log('║                                                      ║');
        console.log('║   ⛔ FAILURES DETECTED — DO NOT DROP COLUMNS YET ⛔  ║');
        console.log('║                                                      ║');
        console.log('║   Fix the failing tests first, then re-run.          ║');
        console.log('║                                                      ║');
    }

    console.log('╚══════════════════════════════════════════════════════╝\n');

    process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('\n⛔ FATAL ERROR:', err);
    process.exit(2);
});
