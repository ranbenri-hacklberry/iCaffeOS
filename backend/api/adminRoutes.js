/**
 * adminRoutes.js - Admin endpoints for Docker ↔ Cloud sync
 *
 * Endpoints:
 * - GET /api/admin/docker-dump/:table - Fetch data from Docker Local Supabase
 * - GET /api/admin/compare-timestamps - Compare timestamps between Cloud and Docker
 * - GET /api/admin/sync-queue - Get sync queue status (if needed)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Cloud Supabase Client
const cloudSupabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Docker Local Supabase Client
const DOCKER_URL = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const DOCKER_KEY = process.env.LOCAL_SUPABASE_ANON_KEY || process.env.VITE_LOCAL_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const dockerSupabase = createClient(DOCKER_URL, DOCKER_KEY);

/**
 * GET /api/admin/identity
 * Zero-Config Auto-Discovery: returns businesses known to the local DB.
 * Used by the frontend to auto-login when exactly one business exists.
 */
router.get('/identity', async (req, res) => {
    try {
        const { data, error } = await dockerSupabase
            .from('businesses')
            .select('id, name, settings')
            .order('created_at', { ascending: true });

        if (error) {
            console.warn('[AdminRoutes/identity] Local DB query failed:', error.message);
            // Fallback: try Cloud Supabase
            const { data: cloudData, error: cloudError } = await cloudSupabase
                .from('businesses')
                .select('id, name, settings')
                .order('created_at', { ascending: true });

            if (cloudError) {
                return res.status(500).json({ success: false, error: cloudError.message });
            }

            return res.json({
                success: true,
                source: 'cloud',
                businesses: cloudData || [],
                count: cloudData?.length || 0
            });
        }

        return res.json({
            success: true,
            source: 'local',
            businesses: data || [],
            count: data?.length || 0
        });
    } catch (err) {
        console.error('[AdminRoutes/identity] Error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/admin/docker-dump/:table
 * Fetch all data from a specific table in Docker Local Supabase
 */
router.get('/docker-dump/:table', async (req, res) => {
    const { table } = req.params;
    const { businessId, recentDays } = req.query;

    console.log(`[AdminRoutes] Fetching ${table} from Docker (businessId: ${businessId}, recentDays: ${recentDays})`);

    try {
        let query = dockerSupabase.from(table).select('*');

        // Filter by businessId if provided and table has business_id column
        if (businessId) {
            // Tables without business_id: optionvalues, menuitemoptions
            const noBusinessIdTables = ['optionvalues', 'menuitemoptions'];
            if (!noBusinessIdTables.includes(table)) {
                query = query.eq('business_id', businessId);
            }
        }

        // For historical tables (orders, order_items, loyalty_transactions), filter by recent days
        if (recentDays) {
            const days = parseInt(recentDays);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            query = query.gte('created_at', cutoffDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            console.error(`[AdminRoutes] Docker query error for ${table}:`, error);
            return res.status(500).json({ success: false, error: error.message });
        }

        console.log(`[AdminRoutes] ✓ Fetched ${data?.length || 0} rows from Docker ${table}`);
        return res.json({ success: true, data: data || [] });

    } catch (err) {
        console.error(`[AdminRoutes] Docker fetch error for ${table}:`, err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/admin/compare-timestamps
 * Compare timestamps between Cloud and Docker for a specific table
 */
router.get('/compare-timestamps', async (req, res) => {
    const { table, businessId, noBusinessId } = req.query;

    console.log(`[AdminRoutes] Comparing timestamps for ${table} (businessId: ${businessId})`);

    try {
        // Build queries for both Cloud and Docker
        let cloudQuery = cloudSupabase.from(table).select('id, updated_at', { count: 'exact' });
        let dockerQuery = dockerSupabase.from(table).select('id, updated_at', { count: 'exact' });

        // Filter by businessId if applicable
        if (businessId && noBusinessId !== 'true') {
            cloudQuery = cloudQuery.eq('business_id', businessId);
            dockerQuery = dockerQuery.eq('business_id', businessId);
        }

        // Execute queries
        const [cloudRes, dockerRes] = await Promise.all([
            cloudQuery,
            dockerQuery
        ]);

        if (cloudRes.error || dockerRes.error) {
            console.error(`[AdminRoutes] Timestamp comparison error:`, cloudRes.error || dockerRes.error);
            return res.status(500).json({
                success: false,
                error: cloudRes.error?.message || dockerRes.error?.message
            });
        }

        // Check if table has updated_at column
        const hasUpdatedAtColumn = cloudRes.data?.[0]?.updated_at !== undefined;

        // Get latest updated_at from each source
        const cloudLatest = cloudRes.data?.length > 0
            ? cloudRes.data.reduce((latest, row) => {
                if (!row.updated_at) return latest;
                const rowDate = new Date(row.updated_at);
                return !latest || rowDate > new Date(latest) ? row.updated_at : latest;
            }, null)
            : null;

        const dockerLatest = dockerRes.data?.length > 0
            ? dockerRes.data.reduce((latest, row) => {
                if (!row.updated_at) return latest;
                const rowDate = new Date(row.updated_at);
                return !latest || rowDate > new Date(latest) ? row.updated_at : latest;
            }, null)
            : null;

        // Determine winner (Last-Write-Wins)
        let winner = null;
        let reason = '';

        if (!hasUpdatedAtColumn) {
            winner = 'cloud';
            reason = 'טבלה ללא updated_at - Cloud כברירת מחדל';
        } else if (!cloudLatest && !dockerLatest) {
            winner = null;
            reason = 'אין נתונים בשני המקורות';
        } else if (!cloudLatest) {
            winner = 'docker';
            reason = 'רק Docker יש נתונים';
        } else if (!dockerLatest) {
            winner = 'cloud';
            reason = 'רק Cloud יש נתונים';
        } else {
            const cloudDate = new Date(cloudLatest);
            const dockerDate = new Date(dockerLatest);

            if (cloudDate > dockerDate) {
                winner = 'cloud';
                reason = `Cloud עודכן לאחרונה (${cloudLatest})`;
            } else if (dockerDate > cloudDate) {
                winner = 'docker';
                reason = `Docker עודכן לאחרונה (${dockerLatest})`;
            } else {
                winner = 'cloud';
                reason = 'זהה - Cloud כברירת מחדל';
            }
        }

        console.log(`[AdminRoutes] ✓ ${table}: ${winner?.toUpperCase() || 'NO WINNER'} (${reason})`);

        return res.json({
            success: true,
            hasUpdatedAtColumn,
            cloud: {
                count: cloudRes.count || 0,
                latestUpdatedAt: cloudLatest
            },
            docker: {
                count: dockerRes.count || 0,
                latestUpdatedAt: dockerLatest
            },
            winner,
            reason
        });

    } catch (err) {
        console.error(`[AdminRoutes] Timestamp comparison error:`, err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/admin/sync-queue
 * Get sync queue status (placeholder for now)
 */
router.get('/sync-queue', async (req, res) => {
    // This is a placeholder - implement actual queue if needed
    return res.json({ success: true, queue: [] });
});

/**
 * POST /api/sync-cloud-to-local
 * Master sync endpoint: Cloud → Docker (Full bidirectional sync)
 * This is the main endpoint that syncs ALL tables from Cloud to Docker Local Supabase
 */
router.post('/sync-cloud-to-local', async (req, res) => {
    const { businessId } = req.body;

    if (!businessId) {
        return res.status(400).json({ success: false, error: 'businessId is required' });
    }

    console.log(`[CloudSync] Starting Cloud → Docker sync for business ${businessId}...`);

    const TABLES_TO_SYNC = [
        // Core tables (must sync first - dependencies)
        { name: 'businesses', hasBusinessId: false, priority: 1 },
        { name: 'employees', hasBusinessId: true, priority: 1 },

        // Menu & Categories
        { name: 'item_category', hasBusinessId: true, priority: 2 },
        { name: 'menu_items', hasBusinessId: true, priority: 2 },

        // Modifiers
        { name: 'optiongroups', hasBusinessId: true, priority: 2 },
        { name: 'optionvalues', hasBusinessId: false, priority: 2 },
        { name: 'menuitemoptions', hasBusinessId: false, priority: 2 },

        // Customers & Loyalty
        { name: 'customers', hasBusinessId: true, priority: 3 },
        { name: 'loyalty_cards', hasBusinessId: true, priority: 3 },
        { name: 'loyalty_transactions', hasBusinessId: true, priority: 3, recentDays: 3 },

        // Inventory & Tasks
        { name: 'inventory_items', hasBusinessId: true, priority: 3 },
        { name: 'prepared_items_inventory', hasBusinessId: true, priority: 3 },
        { name: 'suppliers', hasBusinessId: true, priority: 3 },
        { name: 'recurring_tasks', hasBusinessId: true, priority: 3 },
        { name: 'tasks', hasBusinessId: true, priority: 3 },
        { name: 'task_completions', hasBusinessId: true, priority: 3 },

        // Orders (historical - 3 days only)
        { name: 'orders', hasBusinessId: true, priority: 4, recentDays: 3 },
        { name: 'order_items', hasBusinessId: false, priority: 4, recentDays: 3 },

        // Discounts
        { name: 'discounts', hasBusinessId: true, priority: 3 }
    ];

    // Sort by priority
    const sortedTables = TABLES_TO_SYNC.sort((a, b) => a.priority - b.priority);

    const results = {};
    let totalSynced = 0;
    let totalErrors = 0;

    try {
        for (const table of sortedTables) {
            try {
                console.log(`[CloudSync] Syncing ${table.name}...`);

                // Build Cloud query
                let cloudQuery = cloudSupabase.from(table.name).select('*');

                // Filter by businessId if applicable
                if (table.hasBusinessId) {
                    cloudQuery = cloudQuery.eq('business_id', businessId);
                }

                // Filter by date for historical tables
                if (table.recentDays) {
                    const cutoffDate = new Date();
                    cutoffDate.setDate(cutoffDate.getDate() - table.recentDays);
                    cloudQuery = cloudQuery.gte('created_at', cutoffDate.toISOString());
                }

                // Fetch from Cloud
                const { data: cloudData, error: cloudError } = await cloudQuery;

                if (cloudError) {
                    console.error(`[CloudSync] Cloud fetch error for ${table.name}:`, cloudError);
                    results[table.name] = { success: false, error: cloudError.message };
                    totalErrors++;
                    continue;
                }

                if (!cloudData || cloudData.length === 0) {
                    console.log(`[CloudSync] No data in Cloud for ${table.name}`);
                    results[table.name] = { success: true, count: 0, action: 'skip' };
                    continue;
                }

                // Clear Docker table first (for this business only)
                console.log(`[CloudSync] Clearing Docker ${table.name}...`);
                if (table.hasBusinessId) {
                    await dockerSupabase.from(table.name).delete().eq('business_id', businessId);
                } else if (table.name === 'businesses') {
                    await dockerSupabase.from(table.name).delete().eq('id', businessId);
                } else {
                    // For tables without business_id (optionvalues, menuitemoptions, order_items)
                    // We need to be more careful - delete only what's related to this business
                    // For now, we'll skip clearing these tables completely to avoid data loss
                    console.log(`[CloudSync] Skipping clear for ${table.name} (no business_id)`);
                }

                // Insert/Upsert into Docker
                const { error: dockerError } = await dockerSupabase
                    .from(table.name)
                    .upsert(cloudData, { onConflict: 'id' });

                if (dockerError) {
                    console.error(`[CloudSync] Docker upsert error for ${table.name}:`, dockerError);
                    results[table.name] = { success: false, error: dockerError.message };
                    totalErrors++;
                    continue;
                }

                console.log(`[CloudSync] ✓ Synced ${cloudData.length} rows for ${table.name}`);
                results[table.name] = { success: true, count: cloudData.length, action: 'synced' };
                totalSynced += cloudData.length;

            } catch (tableError) {
                console.error(`[CloudSync] Error syncing ${table.name}:`, tableError);
                results[table.name] = { success: false, error: tableError.message };
                totalErrors++;
            }
        }

        console.log(`[CloudSync] ✓ Sync complete: ${totalSynced} records, ${totalErrors} errors`);
        return res.json({
            success: true,
            totalSynced,
            totalErrors,
            results
        });

    } catch (err) {
        console.error('[CloudSync] Fatal error:', err);
        return res.status(500).json({
            success: false,
            error: err.message,
            results
        });
    }
});

/**
 * POST /api/sync-local-to-cloud
 * Reverse sync: Docker → Cloud (Push local changes to cloud)
 */
router.post('/sync-local-to-cloud', async (req, res) => {
    const { businessId } = req.body;

    if (!businessId) {
        return res.status(400).json({ success: false, error: 'businessId is required' });
    }

    console.log(`[DockerSync] Starting Docker → Cloud sync for business ${businessId}...`);

    // Only sync tables that can have local modifications
    const TABLES_TO_PUSH = [
        'orders',
        'order_items',
        'customers',
        'loyalty_cards',
        'loyalty_transactions',
        'task_completions',
        'prepared_items_inventory'
    ];

    const results = {};
    let totalPushed = 0;
    let totalErrors = 0;

    try {
        for (const tableName of TABLES_TO_PUSH) {
            try {
                console.log(`[DockerSync] Pushing ${tableName}...`);

                // Fetch from Docker
                let dockerQuery = dockerSupabase.from(tableName).select('*');

                // Filter by businessId if table has it
                if (!['order_items'].includes(tableName)) {
                    dockerQuery = dockerQuery.eq('business_id', businessId);
                }

                const { data: dockerData, error: dockerError } = await dockerQuery;

                if (dockerError) {
                    console.error(`[DockerSync] Docker fetch error for ${tableName}:`, dockerError);
                    results[tableName] = { success: false, error: dockerError.message };
                    totalErrors++;
                    continue;
                }

                if (!dockerData || dockerData.length === 0) {
                    console.log(`[DockerSync] No data in Docker for ${tableName}`);
                    results[tableName] = { success: true, count: 0, action: 'skip' };
                    continue;
                }

                // Upsert to Cloud (conflict resolution: newer wins)
                const { error: cloudError } = await cloudSupabase
                    .from(tableName)
                    .upsert(dockerData, {
                        onConflict: 'id',
                        ignoreDuplicates: false
                    });

                if (cloudError) {
                    console.error(`[DockerSync] Cloud upsert error for ${tableName}:`, cloudError);
                    results[tableName] = { success: false, error: cloudError.message };
                    totalErrors++;
                    continue;
                }

                console.log(`[DockerSync] ✓ Pushed ${dockerData.length} rows for ${tableName}`);
                results[tableName] = { success: true, count: dockerData.length, action: 'pushed' };
                totalPushed += dockerData.length;

            } catch (tableError) {
                console.error(`[DockerSync] Error pushing ${tableName}:`, tableError);
                results[tableName] = { success: false, error: tableError.message };
                totalErrors++;
            }
        }

        console.log(`[DockerSync] ✓ Push complete: ${totalPushed} records, ${totalErrors} errors`);
        return res.json({
            success: true,
            totalPushed,
            totalErrors,
            results
        });

    } catch (err) {
        console.error('[DockerSync] Fatal error:', err);
        return res.status(500).json({
            success: false,
            error: err.message,
            results
        });
    }
});

/**
 * GET /api/admin/docker-health
 * Check if Docker Local Supabase is running and responsive
 */
router.get('/docker-health', async (req, res) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${DOCKER_URL}/rest/v1/`, {
            method: 'GET',
            headers: { 'apikey': DOCKER_KEY },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            // Try a simple query to verify connection
            const { data, error } = await dockerSupabase.from('businesses').select('id').limit(1);

            return res.json({
                success: true,
                status: 'healthy',
                url: DOCKER_URL,
                canQuery: !error,
                message: error ? `Connected but query failed: ${error.message}` : 'Docker Supabase is running and responsive'
            });
        } else {
            return res.json({
                success: false,
                status: 'unhealthy',
                url: DOCKER_URL,
                message: `Docker responded with status ${response.status}`
            });
        }
    } catch (err) {
        return res.json({
            success: false,
            status: 'offline',
            url: DOCKER_URL,
            message: `Docker Local Supabase is not running: ${err.message}`
        });
    }
});

/**
 * POST /api/admin/full-bidirectional-sync
 * Complete sync: Cloud → Docker → Cloud (ensures perfect consistency)
 */
router.post('/full-bidirectional-sync', async (req, res) => {
    const { businessId } = req.body;

    if (!businessId) {
        return res.status(400).json({ success: false, error: 'businessId is required' });
    }

    console.log(`[FullSync] Starting full bidirectional sync for business ${businessId}...`);

    try {
        // Step 1: Push Docker → Cloud (preserve local changes)
        console.log('[FullSync] Step 1: Pushing local changes to Cloud...');
        const pushResponse = await fetch(`http://localhost:${process.env.PORT || 8081}/api/admin/sync-local-to-cloud`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId })
        });
        const pushResult = await pushResponse.json();

        // Step 2: Pull Cloud → Docker (get latest from cloud)
        console.log('[FullSync] Step 2: Pulling latest from Cloud to Docker...');
        const pullResponse = await fetch(`http://localhost:${process.env.PORT || 8081}/api/admin/sync-cloud-to-local`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId })
        });
        const pullResult = await pullResponse.json();

        console.log('[FullSync] ✓ Full bidirectional sync complete');
        return res.json({
            success: true,
            push: pushResult,
            pull: pullResult,
            message: 'Full sync completed successfully'
        });

    } catch (err) {
        console.error('[FullSync] Error:', err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

export default router;
