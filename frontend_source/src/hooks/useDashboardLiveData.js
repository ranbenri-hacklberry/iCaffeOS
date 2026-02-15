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
                const { data: orders, error: ordErr } = await supabase
                    .from('orders')
                    .select('id, order_status')
                    .eq('business_id', businessId)
                    .in('order_status', ['preparing', 'ready', 'fired', 'in_progress']);

                if (ordErr) throw ordErr;

                const activeOrders = (orders || []).filter(o => {
                    const s = o.order_status?.toLowerCase();
                    return s === 'preparing' || s === 'fired' || s === 'in_progress';
                }).length;

                const readyOrders = (orders || []).filter(o =>
                    o.order_status?.toLowerCase() === 'ready'
                ).length;

                // 2. Tasks - Count incomplete recurring tasks (not completed today)
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

                const { data: allTasks, error: taskErr } = await supabase
                    .from('recurring_tasks')
                    .select('id, name, category, is_active')
                    .eq('business_id', businessId)
                    .neq('is_active', false);

                if (taskErr) throw taskErr;

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
                const { data: inventoryItems, error: invErr } = await supabase
                    .from('inventory_items')
                    .select('id, name, current_stock, low_stock_alert')
                    .eq('business_id', businessId);

                if (invErr) throw invErr;

                const lowStockItems = (inventoryItems || []).filter(item => {
                    const currentStock = item.current_stock || 0;
                    const minStock = item.low_stock_alert || 0;
                    return minStock > 0 && currentStock <= minStock;
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
                        return status === 'preparing' || status === 'ready' || status === 'fired' || status === 'in_progress';
                    })
                    .toArray();

                const activeOrders = orders.filter(o => {
                    const s = o.order_status?.toLowerCase();
                    return s === 'preparing' || s === 'fired' || s === 'in_progress';
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
                    const currentStock = item.current_stock || 0;
                    const minStock = item.low_stock_alert || item.low_stock_threshold_units || item.min_stock || 0;
                    return minStock > 0 && currentStock <= minStock;
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
