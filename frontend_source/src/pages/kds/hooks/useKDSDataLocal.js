/**
 * useKDSDataLocal - Local-First KDS Data Hook
 * 
 * This is a simplified, local-first version of useKDSData that:
 * 1. Reads ALL data from Dexie (local IndexedDB)
 * 2. Uses useLiveQuery for real-time reactivity
 * 3. Writes go through offline queue for background sync
 * 
 * Benefits:
 * - Works offline by default
 * - Instant UI updates (no network latency)
 * - Automatic real-time sync via OfflineContext
 */

import { useMemo, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/context/AuthContext';
import db from '@/db/database';
import { groupOrderItems, isHotDrink as isHotDrinkUtil, isKitchenPrep } from '@/utils/kdsUtils';
import { useKDSSms } from '@/pages/kds/hooks/useKDSSms';

import { supabase } from '@/lib/supabase';

export const useKDSDataLocal = () => {
    const { currentUser } = useAuth();
    const businessId = currentUser?.business_id;
    const hasAutoSynced = useRef(false);

    // 📱 SMS HOOK integration
    const { smsToast, setSmsToast, isSendingSms, handleSendSms } = useKDSSms();

    // Auto-sync on mount and Realtime subscriptions
    useEffect(() => {
        if (!businessId) return;

        if (!hasAutoSynced.current) {
            hasAutoSynced.current = true;
            console.log('🔄 [KDS] Auto-syncing data on mount...');

            const autoSync = async () => {
                try {
                    const { syncOrders } = await import('@/services/syncService');
                    const result = await syncOrders(businessId);
                    if (result.success) {
                        console.log(`✅ [KDS] Auto-sync complete: ${result.ordersCount || 0} orders`);
                    }
                } catch (err) {
                    console.error('❌ [KDS] Auto-sync failed:', err);
                }
            };
            autoSync();
        }

        let debounceTimer = null;

        const triggerSync = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                try {
                    console.log('🔄 [KDS Background Sync] Realtime event triggered sync...');
                    const { syncOrders } = await import('@/services/syncService');
                    await syncOrders(businessId);
                } catch (e) { console.error(e) }
            }, 500);
        };

        const channel = supabase
            .channel(`kds-local-sync-${businessId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `business_id=eq.${businessId}`
            }, (payload) => {
                console.log(`🔔 KDS Realtime (orders): ${payload.eventType}`);
                triggerSync();
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'order_items'
            }, (payload) => {
                console.log(`🔔 KDS Realtime (items): ${payload.eventType}`);
                triggerSync();
            });

        channel.subscribe();

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
        };
    }, [businessId]);

    // ============================================
    // LIVE QUERIES - Auto-update when data changes
    // ============================================

    // Get today's active orders
    const activeOrders = useLiveQuery(async () => {
        if (!businessId) {
            console.log('⏸️ [KDS] No businessId yet');
            return [];
        }

        // 🛠️ FIX: Use BUSINESS DAY starting at 05:00 AM, not a 24-hour window
        const now = new Date();
        const businessDayStart = new Date(now);
        businessDayStart.setHours(5, 0, 0, 0);

        // If it's before 5 AM, the business day started yesterday at 5 AM
        if (now.getHours() < 5) {
            businessDayStart.setDate(businessDayStart.getDate() - 1);
        }

        console.log('🔍 [KDS] Querying orders for businessId:', businessId, 'since:', businessDayStart.toISOString());

        // Get orders that are active AND from current business day
        const orders = await db.orders
            .where('business_id')
            .equals(businessId)
            .filter(o => {
                const orderDate = new Date(o.created_at);
                const isFromToday = orderDate >= businessDayStart;
                const isActive = ['in_progress', 'ready', 'new', 'pending'].includes(o.order_status);
                const isPending = o.pending_sync === true;

                // Only show orders from today's business day
                return (isActive && isFromToday) || (isPending && isFromToday);
            })
            .toArray();

        console.log(`📊 [KDS] Found ${orders.length} active orders from business day`);
        return orders;
    }, [businessId]);

    // Get all order items for active orders
    const orderItems = useLiveQuery(async () => {
        if (!activeOrders || activeOrders.length === 0) return [];

        const orderIds = activeOrders.map(o => o.id);
        console.log('🔍 [KDS] Fetching items for order IDs:', orderIds);

        const items = await db.order_items
            .filter(item => orderIds.some(oid => String(oid) === String(item.order_id)))
            .toArray();

        console.log(`📊 [KDS] Fetched ${items.length} items:`, items.map(i => ({ id: i.id, order_id: i.order_id, status: i.item_status })));
        return items;
    }, [activeOrders]);

    // Get menu items for display
    const menuItems = useLiveQuery(async () => {
        const items = await db.menu_items.toArray();
        return new Map(items.map(m => [m.id, m]));
    }, []);

    // Get option values for modifiers
    const optionValues = useLiveQuery(async () => {
        const values = await db.optionvalues.toArray();
        const map = new Map();
        values.forEach(v => {
            const name = v.name || v.value_name;
            map.set(String(v.id), name);
            map.set(v.id, name);
        });
        return map;
    }, []);

    // ============================================
    // PROCESS DATA
    // ============================================

    const processedOrders = useMemo(() => {
        if (!activeOrders || !orderItems || !menuItems || !optionValues) {
            console.log('⏸️ [KDS] Waiting for data:', {
                hasOrders: !!activeOrders,
                hasItems: !!orderItems,
                hasMenu: !!menuItems,
                hasValues: !!optionValues
            });
            return { current: [], completed: [] };
        }

        const current = [];
        const completed = [];

        console.log(`🔄 [KDS] Processing ${activeOrders.length} orders with ${orderItems.length} items`);

        activeOrders.forEach(order => {
            // Get items for this order
            const items = orderItems.filter(i => String(i.order_id) === String(order.id));

            console.log(`📦 [KDS] Order ${order.order_number}: ${items.length} items`);

            if (items.length === 0) {
                console.log(`⏭️ [KDS] Skipping order ${order.order_number} - no items`);
                return;
            }

            // Check if order has active items
            const hasActiveItems = items.some(i =>
                ['in_progress', 'new', 'pending', 'ready'].includes(i.item_status)
            );

            // Skip completed orders with no active items
            if (order.order_status === 'completed' && !hasActiveItems) {
                console.log(`⏭️ [KDS] Skipping completed order ${order.order_number} - no active items`);
                return;
            }

            // Process items
            const processedItems = items
                .filter(item => item.item_status !== 'cancelled')
                .map(item => {
                    const menuItem = menuItems.get(item.menu_item_id);
                    const itemName = menuItem?.name || item.name || 'Unknown Item';

                    // NEW: Unified Prep Check from shared utility
                    const isPrep = isKitchenPrep(item);

                    // prep logic
                    const kdsLogic = menuItem?.kds_routing_logic || 'MADE_TO_ORDER';

                    // Check for override
                    let hasOverride = false;
                    const mods = item.mods;
                    if (typeof mods === 'string' && (mods.includes('__KDS_OVERRIDE__') || mods.includes('__KDS_OVER_RIDE__'))) hasOverride = true;
                    else if (Array.isArray(mods) && mods.some(m => String(m).includes('__KDS_OVERRIDE__'))) hasOverride = true;

                    let isPrepRequired = true;
                    if (isPrep) isPrepRequired = true;
                    else if (kdsLogic === 'GRAB_AND_GO') isPrepRequired = false;
                    else if (kdsLogic === 'CONDITIONAL') isPrepRequired = hasOverride;

                    // ⚡ AUTO-READY: If item doesn't need prep, it's effectively 'ready' instantly
                    let itemStatus = item.item_status;
                    if (!isPrepRequired && (itemStatus === 'new' || itemStatus === 'pending' || itemStatus === 'in_progress')) {
                        itemStatus = 'ready';
                    }

                    // Parse modifiers
                    let modsArray = [];
                    if (item.mods) {
                        try {
                            const parsed = typeof item.mods === 'string' ? JSON.parse(item.mods) : item.mods;
                            if (Array.isArray(parsed)) {
                                modsArray = parsed.map(m => {
                                    if (typeof m === 'object' && m?.value_name) return m.value_name;
                                    return optionValues.get(String(m)) || String(m);
                                }).filter(m =>
                                    m &&
                                    !m.toLowerCase().includes('default') &&
                                    m !== 'רגיל' &&
                                    !String(m).includes('KDS_OVERRIDE')
                                );
                            }
                        } catch (e) { /* ignore */ }
                    }

                    // Add notes
                    if (item.notes) {
                        modsArray.push({ name: item.notes, is_note: true });
                    }

                    // Structure modifiers for display
                    const structuredModifiers = modsArray.map(mod => {
                        if (typeof mod === 'object' && mod.is_note) {
                            return { text: mod.name, color: 'mod-color-purple', isNote: true };
                        }

                        const modName = typeof mod === 'string' ? mod : (mod.name || String(mod));
                        let color = 'mod-color-gray';

                        if (modName.includes('סויה')) color = 'mod-color-lightgreen';
                        else if (modName.includes('שיבולת')) color = 'mod-color-beige';
                        else if (modName.includes('שקדים')) color = 'mod-color-lightyellow';
                        else if (modName.includes('נטול')) color = 'mod-color-blue';
                        else if (modName.includes('רותח')) color = 'mod-color-red';
                        else if (modName.includes('קצף') && !modName.includes('בלי')) color = 'mod-color-foam-up';
                        else if (modName.includes('בלי קצף')) color = 'mod-color-foam-none';

                        return { text: modName, color, isNote: false };
                    });

                    const modsKey = modsArray.map(m => typeof m === 'object' ? m.name : m).sort().join('|');

                    return {
                        id: item.id,
                        menuItemId: item.menu_item_id,
                        name: itemName,
                        modifiers: structuredModifiers,
                        quantity: item.quantity,
                        status: item.item_status,
                        price: menuItem?.price || item.price || 0,
                        category: menuItem?.category || '',
                        modsKey,
                        course_stage: item.course_stage || 1,
                        item_fired_at: item.item_fired_at,
                        is_early_delivered: item.is_early_delivered || false,
                        isPrepRequired: isPrepRequired // Pass this through for filtering
                    };
                });

            if (processedItems.length === 0) return;

            // Calculate total
            const allItems = items.filter(i => i.item_status !== 'cancelled');
            const calculatedTotal = allItems.reduce((sum, i) => {
                const menuItem = menuItems.get(i.menu_item_id);
                return sum + (menuItem?.price || 0) * (i.quantity || 1);
            }, 0);

            const totalAmount = order.total_amount || calculatedTotal;
            const paidAmount = order.paid_amount || 0;
            const unpaidAmount = totalAmount - paidAmount;

            const baseOrder = {
                id: order.id,
                orderNumber: order.order_number || `#${String(order.id).slice(0, 8)}`,
                // 🛠️ FIX: Ensure customer name is prioritized correctly from all possible fields
                customerName: order.customer_name || order.customerName || (order.order_number ? `#${order.order_number}` : 'אורח'),
                customerPhone: order.customer_phone || order.customerPhone,
                customerId: order.customer_id,
                isPaid: order.is_paid,
                orderStatus: order.order_status, // 👈 CRITICAL FIX: Add orderStatus for OrderCard to read correctly
                totalAmount: unpaidAmount > 0 ? unpaidAmount : totalAmount,
                paidAmount,
                fullTotalAmount: totalAmount,
                timestamp: new Date(order.created_at).toLocaleTimeString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                fired_at: order.fired_at,
                ready_at: order.ready_at,
                updated_at: order.updated_at,
                payment_method: order.payment_method,
                is_offline: order.is_offline || String(order.id).startsWith('L'),
                pending_sync: order.pending_sync,
                created_at: order.created_at // 👈 CRITICAL FIX: Needed for agingMinutes calculation in OrderCard
            };

            // Group by course stage
            const itemsByStage = processedItems.reduce((acc, item) => {
                const stage = item.course_stage || 1;
                if (!acc[stage]) acc[stage] = [];
                acc[stage].push(item);
                return acc;
            }, {});

            // Process each stage
            Object.entries(itemsByStage).forEach(([stageStr, stageItems]) => {
                const stage = Number(stageStr);
                const cardId = stage === 1 ? order.id : `${order.id}-stage-${stage}`;

                // 🎯 VISIBILITY FILTER: For active KDS orders, we hide stages that don't need prep.
                // However, for READY/COMPLETED orders, we SHOW ALL stages so the full order can be checked.
                const hasPrepItems = stageItems.some(i => i.isPrepRequired);

                // Final card status/type logic
                const isOrderReady = order.order_status === 'ready';
                const isOrderCompleted = order.order_status === 'completed';

                // If it's an active order (not ready/completed) and has no prep items, hide the stage.
                if (!isOrderReady && !isOrderCompleted && !hasPrepItems) return;

                const allReady = stageItems.every(i =>
                    ['ready', 'completed', 'cancelled'].includes(i.status)
                );
                const hasActiveItems = stageItems.some(i =>
                    ['in_progress', 'new'].includes(i.status)
                );

                let cardType, cardStatus;
                if (isOrderReady || isOrderCompleted || allReady) {
                    cardType = 'ready'; // This pushes it to the bottom list (completedOrders)
                    cardStatus = isOrderCompleted ? 'completed' : 'ready';
                } else if (hasActiveItems) {
                    cardType = 'active';
                    cardStatus = 'in_progress';
                } else {
                    cardType = 'active';
                    cardStatus = 'pending';
                }

                // 🎯 KDS FILTERING: If the card is 'active', only show items that REQUIRE preparation.
                // Grab-and-go items will only appear when the card moves to 'ready'.
                const displayItems = cardType === 'active'
                    ? stageItems.filter(i => i.isPrepRequired)
                    : stageItems;

                // 🛡️ STABILITY: If an active card has NO items to display (all are non-prep), 
                // but the order isn't 'ready' yet, we still show the card (maybe with a notice)
                // OR we let the auto-status logic handle it.
                if (cardType === 'active' && displayItems.length === 0 && stageItems.length > 0) {
                    // This means we have an active order with only non-prep items.
                    // It should probably have been 'ready' already.
                }

                const groupedItems = groupOrderItems(displayItems);

                const processedOrder = {
                    ...baseOrder,
                    id: cardId,
                    originalId: order.id,
                    items: groupedItems,
                    type: cardType,
                    status: cardStatus,
                    courseStage: stage
                };

                if (cardType === 'ready') {
                    completed.push(processedOrder);
                } else {
                    current.push(processedOrder);
                }
            });
        });

        return { current, completed };
    }, [activeOrders, orderItems, menuItems, optionValues]);

    // ============================================
    // ACTIONS - All go through offline queue
    // ============================================

    const updateItemStatus = useCallback(async (itemId, newStatus) => {
        console.log(`🔄 [KDS Local] Updating item ${itemId} to status: ${newStatus}`);

        // 1. Update Dexie immediately (Optimistic UI)
        await db.order_items.update(itemId, {
            item_status: newStatus,
            updated_at: new Date().toISOString()
        });
        console.log(`✅ [KDS Local] Dexie updated for item ${itemId}`);

        // 2. Sync to Supabase in background (fire-and-forget)
        const { supabase } = await import('@/lib/supabase');
        supabase.from('order_items').update({ item_status: newStatus, updated_at: new Date().toISOString() }).eq('id', itemId)
            .then(({ error }) => error ? console.error(`❌ Sync failed:`, error) : console.log(`📤 Synced item ${itemId}`));
    }, []);

    const updateOrderStatus = useCallback(async (orderId, currentStatus, targetStatusOverride = null) => {
        const order = await db.orders.get(orderId);
        if (!order) return;

        // 🧠 Determine next status
        let nextStatus;
        if (targetStatusOverride) {
            nextStatus = targetStatusOverride;
        } else {
            const statusLower = (currentStatus || '').toLowerCase();

            if (statusLower === 'undo_ready') {
                nextStatus = 'in_progress';
            } else if (statusLower === 'ready') {
                nextStatus = 'completed';
            } else if (statusLower === 'in_progress') {
                nextStatus = 'ready';
            } else if (statusLower === 'new') {
                nextStatus = 'in_progress';
            } else if (statusLower === 'pending') {
                nextStatus = 'new';
            } else {
                nextStatus = 'in_progress';
            }
        }

        console.log(`🔄 [KDS Local] Moving Order ${orderId} (${currentStatus} -> ${nextStatus})`);
        const now = new Date().toISOString();

        const payload = {
            order_status: nextStatus,
            updated_at: now,
            ...(nextStatus === 'ready' && { ready_at: now }),
            pending_sync: true
        };

        const itemStatusForItems = nextStatus === 'completed' ? 'completed' :
            nextStatus === 'ready' ? 'ready' :
                nextStatus === 'new' ? 'new' :
                    nextStatus === 'cancelled' ? 'cancelled' :
                        'in_progress';
        const shouldResetEarlyMarks = ['ready', 'completed', 'shipped'].includes(nextStatus);

        // 1. Update Dexie immediately
        await db.transaction('rw', db.orders, db.order_items, async () => {
            await db.orders.update(orderId, payload);
            await db.order_items
                .where('order_id')
                .equals(orderId)
                .modify(it => {
                    // 🍫 SHOKO PROTECTION: NEVER overwrite a 'held' status during an order-level status change.
                    if (it.item_status !== 'held') {
                        it.item_status = itemStatusForItems;
                    }
                    if (shouldResetEarlyMarks) it.is_early_delivered = false;
                    it.updated_at = now;
                });
        });

        // 🔔 Trigger SMS if ready
        if (nextStatus === 'ready' && order.customer_phone && navigator.onLine) {
            const custName = order.customer_name || order.customerName || 'אורח';
            handleSendSms(order.customer_phone, custName);
        }

        // 2. Queue for reliable backend sync (handles offline seamlessly)
        const { queueAction } = await import('@/services/offlineQueue');
        await queueAction('UPDATE_ORDER_STATUS', {
            orderId: orderId,
            newStatus: nextStatus,
            isLocalOrder: String(orderId).startsWith('L') || order.is_offline
        });

        // 3. Opportunistic fast-sync
        const { supabase } = await import('@/lib/supabase');
        supabase.rpc('update_order_status_v3', {
            p_order_id: orderId,
            p_new_status: nextStatus,
            p_business_id: order.business_id,
            p_item_status: itemStatusForItems
        }).then(({ error }) => {
            if (error) console.error(`❌ Opportunistic Sync failed:`, error);
            else {
                console.log(`📤 Opportunistic Sync succeeded for ${orderId}`);
                db.orders.update(orderId, { pending_sync: false });
            }
        });
    }, [handleSendSms]);

    const fireItem = useCallback(async (itemId) => {
        const payload = {
            item_status: 'in_progress',
            item_fired_at: new Date().toISOString()
        };

        // 1. Update Dexie immediately
        await db.order_items.update(itemId, payload);

        // 2. Sync to Supabase
        const { supabase } = await import('@/lib/supabase');
        supabase.from('order_items').update(payload).eq('id', itemId)
            .then(({ error }) => error ? console.error(`❌ Sync failed:`, error) : console.log(`📤 Synced fire item ${itemId}`));
    }, []);

    const handleFireItems = useCallback(async (orderId, itemIds) => {
        for (const itemId of itemIds) {
            await fireItem(itemId);
        }
    }, [fireItem]);

    const handleReadyItems = useCallback(async (orderId, itemIds) => {
        for (const itemId of itemIds) {
            await updateItemStatus(itemId, 'ready');
        }

        // 📱 Check if ALL items in the order are now ready/completed
        // If so, and the order wasn't ready before, send SMS
        try {
            const oItems = await db.order_items.where('order_id').equals(orderId).toArray();
            const allReady = oItems.every(i => ['ready', 'completed', 'cancelled'].includes(i.item_status));

            if (allReady) {
                const order = await db.orders.get(orderId);
                // Allow re-sending if it was already ready but maybe user clicked again? 
                // Better to be safe: Only if not already completed (to avoid spamming history)
                if (order && order.order_status !== 'completed') {
                    // Update order status to ready if it's not already
                    if (order.order_status !== 'ready') {
                        await updateOrderStatus(orderId, null, 'ready');
                    }

                    // Send SMS if phone exists
                    if (order.customer_phone) {
                        console.log(`📱 [KDS Local] Order ${orderId} is fully ready, sending SMS to ${order.customer_phone}`);
                        handleSendSms(order.customer_phone, order.customer_name);
                    }
                }
            }
        } catch (e) {
            console.error('Error in SMS/Ready check:', e);
        }
    }, [updateItemStatus, updateOrderStatus, handleSendSms]);

    const handleToggleEarlyDelivered = useCallback(async (orderId, itemId, currentValue) => {
        const newValue = !currentValue;
        console.log(`🔄 [KDS Local] Toggling early delivery for item ${itemId}: ${currentValue} -> ${newValue}`);

        // 1. Update Dexie immediately
        await db.order_items.update(itemId, {
            is_early_delivered: newValue,
            updated_at: new Date().toISOString()
        });

        // 2. Sync to Supabase
        const { supabase } = await import('@/lib/supabase');
        await supabase.rpc('toggle_early_delivered', {
            p_item_id: itemId,
            p_value: newValue
        }).then(({ error }) => {
            if (error) console.error(`❌ Early Delivered Sync failed:`, error);
            else console.log(`📤 Synced early delivery for ${itemId}`);
        });
    }, []);

    const handleCancelOrder = useCallback(async (orderId) => {
        await updateOrderStatus(orderId, null, 'cancelled');
    }, [updateOrderStatus]);

    const handleConfirmPayment = useCallback(async (orderId, paymentMethod) => {
        const payload = {
            is_paid: true,
            payment_method: paymentMethod,
            order_status: 'completed',
            updated_at: new Date().toISOString()
        };

        // 1. Update Dexie immediately
        await db.orders.update(orderId, payload);

        // 2. Sync to Supabase
        const { supabase } = await import('@/lib/supabase');
        supabase.from('orders').update(payload).eq('id', orderId)
            .then(({ error }) => error ? console.error(`❌ Sync failed:`, error) : console.log(`📤 Synced payment ${orderId}`));
    }, []);

    const fetchHistoryOrders = useCallback(async (selectedDate, signal) => {
        if (!businessId) return [];

        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const startISO = startOfDay.toISOString();
        const endISO = endOfDay.toISOString();

        console.log(`📜 [KDS History] Fetching for ${selectedDate.toDateString()} [${startISO} to ${endISO}]`);

        // 1. Try Local First using composite index if available
        let ordersList = await db.orders
            .where('[business_id+created_at]')
            .between([businessId, startISO], [businessId, endISO])
            .toArray();

        // 2. If nothing found locally (and we are online), try to fetch from server
        if (ordersList.length === 0 && navigator.onLine) {
            console.log(`📜 [KDS History] No local orders, attempting server fetch for biz ${businessId}...`);
            try {
                const { supabase } = await import('@/lib/supabase');
                // Use get_orders_history which returns ALL orders (history + active) for the period
                // It also returns nested items_detail, so we don't need a separate fetch!
                const { data: serverOrders, error } = await supabase
                    .rpc('get_orders_history', {
                        p_from_date: startISO,
                        p_to_date: endISO,
                        p_business_id: businessId
                    });

                if (error) throw error;

                if (serverOrders && serverOrders.length > 0) {
                    console.log(`📥 [KDS History] Fetched ${serverOrders.length} orders from server.`);

                    // 1. Prepare Orders and Items for bulk saving
                    const ordersToSave = [];
                    const itemsToSave = [];

                    serverOrders.forEach(order => {
                        const { items_detail, ...orderData } = order;
                        ordersToSave.push({
                            ...orderData,
                            business_id: businessId,
                            is_offline: false,
                            pending_sync: false,
                            updated_at: orderData.updated_at || new Date().toISOString()
                        });

                        if (items_detail && Array.isArray(items_detail)) {
                            items_detail.forEach(item => {
                                itemsToSave.push({
                                    ...item,
                                    order_id: orderData.id // Ensure linkage
                                });
                            });
                        }
                    });

                    // 2. Save both to Dexie
                    await db.orders.bulkPut(ordersToSave);
                    if (itemsToSave.length > 0) {
                        console.log(`__ [KDS History] Saving ${itemsToSave.length} nested items to Dexie...`);
                        await db.order_items.bulkPut(itemsToSave);
                    }

                    // Re-query Dexie to reflect saved data
                    ordersList = await db.orders
                        .where('[business_id+created_at]')
                        .between([businessId, startISO], [businessId, endISO])
                        .toArray();
                }
            } catch (err) {
                console.warn('❌ Failed to fetch history from server:', err);
            }
        }

        console.log(`📜 [KDS History] Final count: ${ordersList.length} orders`);

        if (ordersList.length === 0) return [];

        // Get items for these orders
        const orderIds = ordersList.map(o => o.id);
        const allItems = await db.order_items
            .filter(item => orderIds.some(oid => String(oid) === String(item.order_id)))
            .toArray();

        const customerIds = [...new Set(ordersList.map(o => o.customer_id).filter(Boolean))];
        const customersMap = await db.customers
            .where('id').anyOf(customerIds)
            .toArray()
            .then(custs => new Map(custs.map(c => [c.id, c])));

        // Process for UI
        const menuItemsMap = await db.menu_items.toArray().then(items =>
            new Map(items.map(m => [m.id, m]))
        );

        return ordersList.map(order => {
            const orderItems = allItems.filter(i => String(i.order_id) === String(order.id));
            const customer = customersMap.get(order.customer_id);
            const derivedCustomerName = order.customer_name || order.customerName || customer?.name || customer?.phone_number || (order.order_number ? `#${order.order_number}` : 'אורח');

            return {
                id: order.id,
                order_number: order.order_number,
                order_status: order.order_status,
                orderNumber: order.order_number || `#${String(order.id).slice(0, 8)}`,
                customerName: derivedCustomerName,
                customer_name: derivedCustomerName,
                customer_phone: order.customer_phone || order.customerPhone || customer?.phone_number,
                isPaid: order.is_paid,
                is_paid: order.is_paid,
                totalAmount: order.total_amount,
                created_at: order.created_at,
                timestamp: new Date(order.created_at).toLocaleTimeString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                items: orderItems.map(item => {
                    const menuItem = menuItemsMap.get(item.menu_item_id) || { name: 'Unknown', price: 0 };

                    let parsedMods = [];
                    try {
                        if (typeof item.mods === 'string') {
                            parsedMods = JSON.parse(item.mods);
                        } else if (Array.isArray(item.mods)) {
                            parsedMods = item.mods;
                        }
                    } catch (e) { /* ignore */ }

                    // Supress KDS Override tag from rendering in KDS
                    if (Array.isArray(parsedMods)) {
                        parsedMods = parsedMods.filter(m => {
                            if (typeof m === 'string') return m !== '__KDS_OVERRIDE__';
                            if (m && m.text) return m.text !== '__KDS_OVERRIDE__';
                            if (m && m.valueName) return m.valueName !== '__KDS_OVERRIDE__';
                            return true;
                        });
                    }

                    return {
                        id: item.id,
                        name: menuItem.name || item.name, // Try falling back if present on item
                        price: menuItem.price,
                        quantity: item.quantity,
                        item_status: item.item_status,
                        modifiers: parsedMods,
                        is_early_delivered: item.is_early_delivered
                    };
                })
            };
        });
    }, [businessId]);

    const findNearestActiveDate = useCallback(async (currentDate) => {
        if (!businessId) return null;
        // Look for orders in the past 30 days
        const thirtyDaysAgo = new Date(currentDate);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ordersList = await db.orders
            .where('business_id')
            .equals(businessId)
            .filter(o => new Date(o.created_at) >= thirtyDaysAgo)
            .toArray();

        if (ordersList.length === 0) return null;

        // Find the most recent date
        const dates = ordersList.map(o => new Date(o.created_at));
        dates.sort((a, b) => b - a); // Descending
        return dates[0];
    }, [businessId]);

    const handleUndoLastAction = useCallback(async () => {
        // TODO: Implement undo via offline queue
        console.log('Undo not yet implemented in local-first version');
    }, []);

    const fetchOrders = useCallback(async (signal) => {
        if (!businessId) return { success: false };
        console.log('🔄 [KDS] Refreshing - pulling latest from Supabase...');
        try {
            // Pull latest orders from Supabase to Dexie
            const { syncOrders } = await import('@/services/syncService');
            const pullResult = await syncOrders(businessId);
            if (pullResult.success) {
                console.log(`✅ [KDS] Pulled ${pullResult.ordersCount || 0} orders from Supabase`);
            } else {
                console.warn(`⚠️ [KDS] Pull failed:`, pullResult.error);
            }

            return { success: true };
        } catch (err) {
            console.error('❌ [KDS] Refresh failed:', err);
            return { success: false, error: err.message };
        }
    }, [businessId]);

    return useMemo(() => ({
        currentOrders: processedOrders.current || [],
        completedOrders: processedOrders.completed || [],
        isLoading: false,
        isOffline: !navigator.onLine,
        lastUpdated: new Date(),
        lastAction: null,
        smsToast,
        setSmsToast,
        errorModal: null,
        setErrorModal: () => { },
        isSendingSms,
        updateItemStatus,
        updateOrderStatus,
        fireItem,
        handleFireItems,
        handleReadyItems,
        handleCancelOrder,
        handleConfirmPayment,
        fetchOrders,
        fetchHistoryOrders,
        findNearestActiveDate,
        handleUndoLastAction,
        handleToggleEarlyDelivered,
        handleItemStatusChange: updateItemStatus,
        handleOrderStatusChange: updateOrderStatus
    }), [
        processedOrders,
        smsToast,
        setSmsToast,
        isSendingSms,
        updateItemStatus,
        updateOrderStatus,
        fireItem,
        handleFireItems,
        handleReadyItems,
        handleCancelOrder,
        handleConfirmPayment,
        fetchOrders,
        fetchHistoryOrders,
        findNearestActiveDate,
        handleUndoLastAction,
        handleToggleEarlyDelivered
    ]);
};
