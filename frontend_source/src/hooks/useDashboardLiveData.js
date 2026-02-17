/**
 * useDashboardLiveData - Real-time data for Mode Selection Dashboard
 * Provides live counts for KDS orders, open tasks, and inventory alerts
 * 
 * ⚡ PRIMARY: Queries Supabase directly for accurate counts
 * 🔌 FALLBACK: Uses Dexie local data when offline
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/db/database';

const isOnline = () => navigator.onLine;

export const useDashboardLiveData = (businessId) => {
    const [data, setData] = useState({
        kds: {
            activeOrders: 0,
            readyOrders: 0,
        },
        tasks: {
            openTasks: 0,
            opening: 0,
            closing: 0,
            preps: 0,
        },
        inventory: {
            hasAlert: false,
            lowStockCount: 0,
        },
        loading: true,
    });

    const channelRef = useRef(null);

    useEffect(() => {
        if (!businessId) return;

        /**
         * Fetch from Supabase (primary source of truth)
         */
        const fetchFromSupabase = async () => {
            try {
                // 1. KDS Orders - Count active vs ready
                // Also include 'new' status for orders waiting to be prepared
                const { data: orders, error: ordErr } = await supabase
                    .from('orders')
                    .select('id, order_status')
                    .eq('business_id', businessId)
                    .in('order_status', ['new', 'preparing', 'ready', 'fired', 'in_progress'])
                    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

                if (ordErr) {
                    console.error('⚠️ [Orders] Supabase error:', ordErr);
                    throw ordErr;
                }

                console.log(`🍳 [Orders] Fetched ${(orders || []).length} active orders:`,
                    (orders || []).map(o => o.order_status));

                const activeOrders = (orders || []).filter(o => {
                    const s = o.order_status?.toLowerCase();
                    return s === 'new' || s === 'preparing' || s === 'fired' || s === 'in_progress';
                }).length;

                const readyOrders = (orders || []).filter(o =>
                    o.order_status?.toLowerCase() === 'ready'
                ).length;

                console.log(`🍳 [Orders] Active: ${activeOrders}, Ready: ${readyOrders}`);

                // 2. Tasks - Count incomplete recurring tasks (not completed today)
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

                // Note: recurring_tasks may or may not have business_id column
                // Try with business_id first, fallback to all tasks if column doesn't exist
                let allTasks = [];
                let taskErr = null;

                try {
                    const result = await supabase
                        .from('recurring_tasks')
                        .select('id, name, category, is_active, business_id')
                        .eq('business_id', businessId)
                        .neq('is_active', false);

                    allTasks = result.data || [];
                    taskErr = result.error;

                    // If business_id column doesn't exist, fallback to all tasks
                    if (taskErr?.message?.includes('column') || taskErr?.code === '42703') {
                        console.warn('⚠️ [Tasks] business_id column not found, fetching all tasks');
                        const fallbackResult = await supabase
                            .from('recurring_tasks')
                            .select('id, name, category, is_active')
                            .neq('is_active', false);
                        allTasks = fallbackResult.data || [];
                        taskErr = fallbackResult.error;
                    }
                } catch (e) {
                    console.error('⚠️ [Tasks] Query failed:', e);
                }

                if (taskErr) {
                    console.error('⚠️ [Tasks] Supabase error:', taskErr);
                }

                console.log(`📋 [Tasks] Found ${allTasks.length} active tasks`);

                // Get today's completions
                const todayStart = new Date(today + 'T00:00:00.000Z').toISOString();
                const todayEnd = new Date(today + 'T23:59:59.999Z').toISOString();

                const { data: completions, error: compErr } = await supabase
                    .from('task_completions')
                    .select('recurring_task_id')
                    .eq('business_id', businessId)
                    .gte('completion_date', todayStart)
                    .lte('completion_date', todayEnd);

                if (compErr) throw compErr;

                const completedTaskIds = new Set((completions || []).map(c => c.recurring_task_id));
                const activeTasks = (allTasks || []).filter(t => t.is_active !== false);
                const tasksNotCompleted = activeTasks.filter(task => !completedTaskIds.has(task.id));
                const openTasks = tasksNotCompleted.length;

                // Breakdown by category
                const opening = tasksNotCompleted.filter(t => t.category?.includes('פתיחה') || t.category?.toLowerCase().includes('open')).length;
                const closing = tasksNotCompleted.filter(t => t.category?.includes('סגירה') || t.category?.toLowerCase().includes('close')).length;
                const preps = tasksNotCompleted.filter(t => t.category?.includes('הכנה') || t.category?.toLowerCase().includes('prep')).length;

                // 3. Inventory - Check for low stock alerts
                // Some older schemas might not have low_stock_alert column yet
                let inventoryItems = [];
                let invErr = null;

                try {
                    const result = await supabase
                        .from('inventory_items')
                        .select('id, name, current_stock, low_stock_alert')
                        .eq('business_id', businessId);

                    if (result.error?.code === '42703' || result.error?.message?.includes('low_stock_alert')) {
                        console.warn('⚠️ [Inventory] low_stock_alert column missing, falling back to id, name, current_stock');
                        const fallback = await supabase
                            .from('inventory_items')
                            .select('id, name, current_stock')
                            .eq('business_id', businessId);
                        inventoryItems = fallback.data || [];
                        invErr = fallback.error;
                    } else {
                        inventoryItems = result.data || [];
                        invErr = result.error;
                    }
                } catch (e) {
                    console.error('⚠️ [Inventory] Fetch failed:', e);
                }

                if (invErr) {
                    console.error('⚠️ [Inventory] Supabase error:', invErr);
                    throw invErr;
                }

                console.log(`📦 [Inventory] Fetched ${(inventoryItems || []).length} items from Supabase`);

                const lowStockItems = (inventoryItems || []).filter(item => {
                    const currentStock = Number(item.current_stock) || 0;
                    // FIX: Only alert if low_stock_alert is explicitly set (not null/undefined)
                    // If undefined/null, treat as 0 (no alert)
                    const minStock = (item.low_stock_alert !== null && item.low_stock_alert !== undefined)
                        ? Number(item.low_stock_alert)
                        : 0;

                    const isBelowMin = minStock > 0 && currentStock < minStock;
                    if (isBelowMin) {
                        console.log(`  ⚠️ ${item.name}: ${currentStock} < ${minStock}`);
                    }
                    return isBelowMin;
                });

                console.log(`📦 [Inventory] Found ${lowStockItems.length} items below minimum`);

                setData({
                    kds: { activeOrders, readyOrders },
                    tasks: { openTasks, opening, closing, preps },
                    inventory: {
                        hasAlert: lowStockItems.length > 0,
                        lowStockCount: lowStockItems.length,
                    },
                    loading: false,
                });

            } catch (error) {
                console.error('⚠️ [DashboardLiveData] Supabase fetch failed, falling back to Dexie:', error.message);
                await fetchFromDexie();
            }
        };

        /**
         * Fallback: Fetch from Dexie (local database)
         */
        const fetchFromDexie = async () => {
            try {
                // 1. KDS Orders
                const orders = await db.orders
                    .where('business_id')
                    .equals(businessId)
                    .and(order => {
                        const status = order.order_status?.toLowerCase();
                        const isRecent = new Date(order.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                        return isRecent && (status === 'new' || status === 'preparing' || status === 'ready' || status === 'fired' || status === 'in_progress');
                    })
                    .toArray();

                const activeOrders = orders.filter(o => {
                    const s = o.order_status?.toLowerCase();
                    return s === 'new' || s === 'preparing' || s === 'fired' || s === 'in_progress';
                }).length;

                const readyOrders = orders.filter(o =>
                    o.order_status?.toLowerCase() === 'ready'
                ).length;

                // 2. Tasks
                const today = new Date().toISOString().split('T')[0];
                const recurringTasks = await db.recurring_tasks
                    .where('business_id')
                    .equals(businessId)
                    .and(task => task.is_active !== false)
                    .toArray();

                const completionsToday = await db.task_completions
                    .where('business_id')
                    .equals(businessId)
                    .and(completion => {
                        const completionDate = new Date(completion.completion_date).toISOString().split('T')[0];
                        return completionDate === today;
                    })
                    .toArray();

                const completedTaskIds = new Set(completionsToday.map(c => c.recurring_task_id));
                const tasksNotCompleted = recurringTasks.filter(task => !completedTaskIds.has(task.id));
                const openTasks = tasksNotCompleted.length;

                const opening = tasksNotCompleted.filter(t => t.category?.includes('פתיחה') || t.category?.toLowerCase().includes('open')).length;
                const closing = tasksNotCompleted.filter(t => t.category?.includes('סגירה') || t.category?.toLowerCase().includes('close')).length;
                const preps = tasksNotCompleted.filter(t => t.category?.includes('הכנה') || t.category?.toLowerCase().includes('prep')).length;

                // 3. Inventory
                const inventoryItems = await db.inventory_items
                    .where('business_id')
                    .equals(businessId)
                    .toArray();

                const lowStockItems = inventoryItems.filter(item => {
                    const currentStock = Number(item.current_stock) || 0;
                    const minStock = (item.low_stock_alert !== null && item.low_stock_alert !== undefined)
                        ? Number(item.low_stock_alert)
                        : 0;
                    return minStock > 0 && currentStock < minStock;
                });

                setData({
                    kds: { activeOrders, readyOrders },
                    tasks: { openTasks, opening, closing, preps },
                    inventory: {
                        hasAlert: lowStockItems.length > 0,
                        lowStockCount: lowStockItems.length,
                    },
                    loading: false,
                });
            } catch (error) {
                console.error('❌ [DashboardLiveData] Dexie fetch also failed:', error);
                setData(prev => ({ ...prev, loading: false }));
            }
        };

        // Choose data source
        const fetchData = async () => {
            if (isOnline()) {
                await fetchFromSupabase();
            } else {
                await fetchFromDexie();
            }
        };

        // Initial fetch
        fetchData();

        // Set up interval for live updates every 30 seconds
        const interval = setInterval(fetchData, 30000);

        // Set up Supabase Realtime for instant order updates
        try {
            channelRef.current = supabase
                .channel('dashboard-orders-live')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'orders',
                        filter: `business_id=eq.${businessId}`
                    },
                    () => {
                        // Debounce: wait a moment then refresh
                        setTimeout(fetchData, 500);
                    }
                )
                .subscribe();
        } catch (err) {
            console.warn('⚠️ Realtime subscription failed:', err);
        }

        return () => {
            clearInterval(interval);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [businessId]);

    return data;
};
