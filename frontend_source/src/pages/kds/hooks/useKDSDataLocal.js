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

    // 🛡️ RECENT UPDATES MASK - Prevents sync-jumps by preserving local state for 10s
    const recentLocalUpdates = useRef(new Map());

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

                // 🛡️ Apply recent local update mask to prevent jumps during sync
                const localUpdate = recentLocalUpdates.current.get(o.id);
                if (localUpdate && Date.now() - localUpdate.timestamp < 10000) {
                    if (o.order_status !== localUpdate.status) {
                        console.log(`🛡️ [KDS-MASK] Protective mask applied to ${o.order_number}: ${o.order_status} -> ${localUpdate.status}`);
                        o.order_status = localUpdate.status;
                    }
                }

                const isTerminal = ['archived', 'cancelled'].includes(o.order_status);
                if (isTerminal) return false;

                const isActive = ['in_progress', 'ready', 'new', 'pending', 'preparing', 'fired'].includes(o.order_status);
                const isDone = ['completed', 'shipped'].includes(o.order_status);
                const isUnpaidDone = isDone && (!o.is_paid || (o.total_amount - (o.paid_amount || 0) > 0.01));
                const isPending = o.pending_sync === true;

                // 🎯 KDS INCLUSIVITY FIX: Include 'completed' and 'shipped' orders from today
                // so the memoized item-level filtering can decide if they still have active items.
                return (isActive) || (isFromToday && (isDone || isUnpaidDone || isPending));
            })
            .toArray();

        console.log(`📊 [KDS] Found ${orders.length} active orders from business day`);

        // 🛠️ SORT: Oldest first (will be on the RIGHT in RTL)
        return orders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }, [businessId]);

    // Get all order items for active orders
    const orderItems = useLiveQuery(async () => {
        if (!activeOrders || activeOrders.length === 0) {
            console.log('ℹ️ [KDS] No active orders - skipping items query');
            return [];
        }

        const orderIds = activeOrders.map(o => o.id);
        console.log('🔍 [KDS] Fetching items for order IDs using INDEXED query:', orderIds.length);

        // ⚡ PERFORMANCE FIX: Use anyOf() which uses the order_id index
        // Prevents full table scan on order_items which freezes the UI as DB grows
        const items = await db.order_items
            .where('order_id')
            .anyOf(orderIds)
            .toArray();

        console.log(`📊 [KDS] Fetched ${items.length} items`);
        return items;
    }, [activeOrders]);

    // Get menu items for display
    const menuItems = useLiveQuery(async () => {
        const items = await db.menu_items.toArray();
        console.log(`📋 [KDS] Loaded ${items.length} menu items from Dexie Cache`);
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

    // Get customers for active orders to resolve names
    // 🔍 ENHANCEMENT: Also map by phone for unlinked guest orders
    const { activeCustomers, activeCustomersByPhone } = useLiveQuery(async () => {
        const idMap = new Map();
        const phoneMap = new Map();
        
        try {
            // Fetch all customers for current business for better resolution
            const customers = await db.customers.toArray();
            customers.forEach(c => {
                if (c.id) idMap.set(String(c.id), c);
                const phone = c.phone_number || c.phone;
                if (phone) {
                    const cleanPhone = String(phone).replace(/\D/g, '');
                    if (cleanPhone) phoneMap.set(cleanPhone, c);
                }
            });
        } catch (e) { console.error('Failed to load customers for KDS mapping:', e); }

        return { activeCustomers: idMap, activeCustomersByPhone: phoneMap };
    }, [activeOrders]) || { activeCustomers: new Map(), activeCustomersByPhone: new Map() };

    // ============================================
    // PROCESS DATA
    // ============================================

    const processedOrders = useMemo(() => {
        console.log('🔄 [KDS-HOOK] Processing orders...', {
            active: !!activeOrders, items: !!orderItems, menu: !!menuItems, opts: !!optionValues, cust: !!activeCustomers
        });
        try {
            if (!activeOrders || !orderItems || !menuItems || !optionValues || !activeCustomers) {
                console.log('⏸️ [KDS-HOOK] Waiting for data (loading results)...');
                return { current: [], completed: [] };
            }

            const current = [];
            const completed = [];

            // ⚡ PERFORMANCE FIX: Pre-group items by order_id to avoid O(N*M) lookups in the loop
            const itemsByOrder = new Map();
            orderItems.forEach(item => {
                if (!item.order_id) return;
                const oid = String(item.order_id);
                if (!itemsByOrder.has(oid)) itemsByOrder.set(oid, []);
                itemsByOrder.get(oid).push(item);
            });

            // ⚡ STABLE SORT: Prevent jumping during updates (like payment confirmation)
            const sortedActiveOrders = [...activeOrders].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );

            sortedActiveOrders.forEach(order => {
                if (!order || !order.id) return;

                // ⚡ Optimized lookup with robust fallbacks for embedded item lists
                const items = itemsByOrder.get(String(order.id)) || order.order_items || order.items || order.items_detail || [];
                
                // CRITICAL: We also need to normalize the items if they came from JSON to ensure they have the order_id set correctly
                const normalizedItems = items.map(i => ({
                    ...i,
                    order_id: i.order_id || order.id,
                    item_status: i.item_status || i.status || 'new'
                }));

                // 🕵️ DEBUG ORDER 3757
                if (String(order.order_number).includes('3757')) {
                    console.log('🕵️ [KDS-PROCESS] Order 3757 details:', {
                        status: order.order_status,
                        customer_name: order.customer_name,
                        customerName: order.customerName,
                        normalizedItemsCount: normalizedItems.length,
                        is_paid: order.is_paid,
                        paid_amount: order.paid_amount,
                        total_amount: order.total_amount,
                        business_id: order.business_id,
                        created_at: order.created_at
                    });
                }

                if (normalizedItems.length === 0) {
                    if (String(order.order_number).includes('3757')) console.log('🕵️ [KDS-PROCESS] Skipping 3757: No items found!');
                    return;
                }

                // NEW: Calculate payment status early for filtering
                const allItems = normalizedItems.filter(i => i.item_status !== 'cancelled');
                const calculatedTotal = allItems.reduce((sum, i) => {
                    const menuItem = menuItems.get(i.menu_item_id);
                    return sum + (menuItem?.price || 0) * (i.quantity || 1);
                }, 0);

                const totalAmount = order.total_amount || calculatedTotal;
                const paidAmount = order.paid_amount || 0;
                const unpaidAmount = totalAmount - paidAmount;
                const isOrderPaid = order.is_paid === true;
                const isEffectivelyUnpaid = !isOrderPaid || unpaidAmount > 0.01;

                // 🎯 NEW KDS FILTERING LOGIC (USER REQUESTED): 
                // An order is "Active" if it has ANY item that is NOT 'completed', 'shipped', or 'cancelled'.
                // If ALL items are 'completed', 'shipped', or 'cancelled', it moves to History.
                
                const hasNonTerminalItems = normalizedItems.some(i => 
                    !['completed', 'shipped', 'cancelled'].includes(i.item_status)
                );

                const isTerminalStatus = ['archived', 'cancelled'].includes(order.order_status);
                
                // If the order is explicitly archived/cancelled at parent level, it's gone from active.
                if (isTerminalStatus) {
                    console.log(`🚮 [KDS-PROCESS] Removing ${order.order_number} - terminal status: ${order.order_status}`);
                    return;
                }

                // If all items are done AND it's paid, it shouldn't be in the active list at all.
                // 🛡️ EXCEPTION: 'ready' orders stay on screen for final handover even if all items are 'completed'.
                if (!hasNonTerminalItems && !isEffectivelyUnpaid && order.order_status !== 'ready') {
                    console.log(`⏭️ [KDS-PROCESS] Skipping fully completed & paid order ${order.order_number}`);
                    return;
                }

                // Process items
                const processedItems = normalizedItems
                    .filter(item => item.item_status !== 'cancelled')
                    .map(item => {
                        const menuItem = menuItems.get(item.menu_item_id);
                        // 🛡️ RE-DEFENSIVE: Try everything for the name (Dexie-cache, local-field, nested-server-join)
                        const itemName = menuItem?.name || item.name || item.menu_items?.name || 'Unknown Item';

                        // NEW: Unified Prep Check from shared utility
                        const isPrep = isKitchenPrep(item);

                        // prep logic
                        const kdsLogic = menuItem?.kds_routing_logic || 'MADE_TO_ORDER';

                        // Check for override
                        let hasOverride = false;
                        const mods = item.mods;
                        if (typeof mods === 'string' && (mods.includes('__KDS_OVERRIDE__') || mods.includes('__KDS_OVER_RIDE__'))) hasOverride = true;
                        else if (Array.isArray(mods) && mods.some(m => String(m).includes('__KDS_OVER_REIDE__'))) hasOverride = true;
                        else if (Array.isArray(mods) && mods.some(m => String(m).includes('__KDS_OVERRIDE__'))) hasOverride = true;

                        // Use the ORDER ITEM's own kds_routing_logic if it exists (set by POS clerk choice),
                        // otherwise fall back to the menu item's default
                        const effectiveLogic = item.kds_routing_logic || kdsLogic;

                        let isPrepRequired = true;
                        if (isPrep) isPrepRequired = true;
                        // 🚀 HERO: If explicitly set to MADE_TO_ORDER by clerk/modal, it ALWAYS needs prep
                        else if (effectiveLogic === 'MADE_TO_ORDER') isPrepRequired = true;
                        else if (effectiveLogic === 'GRAB_AND_GO') isPrepRequired = false;
                        else if (effectiveLogic === 'prep_override') isPrepRequired = false;
                        else if (effectiveLogic === 'CONDITIONAL') isPrepRequired = hasOverride;

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
                            kds_routing_logic: effectiveLogic,
                            was_conditional: item.was_conditional || (kdsLogic === 'CONDITIONAL'),
                            isPrepRequired: isPrepRequired
                        };
                    });

                if (processedItems.length === 0) return;

                /* (Calculated earlier) */

                const cleanOrderPhone = String(order.customer_phone || order.customerPhone || '').replace(/\D/g, '');
                const customerFromPhone = cleanOrderPhone ? activeCustomersByPhone.get(cleanOrderPhone) : null;

                const baseOrder = {
                    id: order.id,
                    orderNumber: order.order_number || `#${String(order.id).slice(0, 8)}`,
                    // 🛠️ FIX: Ensure customer name is prioritized correctly from all possible fields (ID or PHONE)
                    customerName: order.customer_name || order.customerName || activeCustomers.get(String(order.customer_id))?.name || customerFromPhone?.name || '',
                    customerPhone: order.customer_phone || order.customerPhone || activeCustomers.get(String(order.customer_id))?.phone || activeCustomers.get(String(order.customer_id))?.phone_number || customerFromPhone?.phone_number || customerFromPhone?.phone || '',
                    customerId: order.customer_id,
                    isPaid: isOrderPaid,
                    isUnpaid: isEffectivelyUnpaid, // Added flag
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
                    const isOrderCompleted = order.order_status === 'completed';
                    const isClosed = ['completed', 'ready', 'archived', 'shipped'].includes(order.order_status);

                    const allTerminal = stageItems.every(i =>
                        ['completed', 'shipped', 'cancelled'].includes(i.status)
                    );

                    // 🎯 HIDE INDIVIDUAL STAGE IF DELIVERED: 
                    // If all items in this specific course are already completed/shipped, 
                    // then this specific card should not be visible anymore in Active views.
                    if (allTerminal) return;

                    const allReady = stageItems.every(i =>
                        ['ready', 'completed', 'cancelled'].includes(i.status)
                    );
                    const hasActiveItems = stageItems.some(i =>
                        ['in_progress', 'new'].includes(i.status)
                    );
                    const hasHeldItems = stageItems.some(i => i.status === 'held');

                    let cardType, cardStatus;
                    // 🧠 LOGIC: The card is 'ready' (moves to history) ONLY if ALL items in it are ready/terminal.
                    // If even one item is in progress or held, the card MUST be active.
                    // We ignore the top-level order_status here because items take priority for preparation flow.
                    if (allReady) {
                        cardType = 'ready'; // This pushes it to the bottom list (completedOrders)
                        cardStatus = (isOrderCompleted || order.order_status === 'archived' || order.order_status === 'shipped') ? 'completed' : 'ready';
                    } else if (hasActiveItems) {
                        cardType = 'active';
                        // If ANY item is in progress, the card is in progress
                        // If ALL active items are 'new', we show 'new' (to show "Start Prep" button)
                        const allNew = stageItems.filter(i => ['in_progress', 'new'].includes(i.status)).every(i => i.status === 'new');
                        cardStatus = allNew ? 'new' : 'in_progress';
                    } else if (hasHeldItems) {
                        cardType = 'active';
                        cardStatus = 'held';
                    } else {
                        cardType = 'active';
                        cardStatus = 'in_progress';
                    }

                    // 🎯 KDS STABILITY: Send ALL items to the card object. 
                    // Filtering which items to actually SHOW on the card face is now handled 
                    // exclusively in OrderCard.jsx (render-time). This ensures the Edit Modal 
                    // has access to the full list for toggle/undo purposes.
                    const displayItems = stageItems;

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
                        originalOrderId: order.id, // Explicitly provide UUID for actions
                        items: groupedItems,
                        type: cardType,
                        status: cardStatus,
                        orderStatus: cardStatus, // 👈 CRITICAL: Override orderStatus for OrderCard UI
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
        } catch (err) {
            console.error('🔥 [KDS-PROCESS] Critical failure in data processing:', err);
            return { current: [], completed: [] };
        }
    }, [activeOrders, orderItems, menuItems, optionValues, activeCustomers, activeCustomersByPhone]);

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
        // 🛠️ TECH FIX: Strip any stage suffixes (-stage-2, -ready) to get the real UUID
        const realId = String(orderId).replace(/-stage-\d+/, '').replace('-ready', '');
        const order = await db.orders.get(realId);
        if (!order) {
            console.error(`❌ [KDS Local] Order ${realId} not found for status update`);
            return;
        }

        // 🧠 Determine next status
        let nextStatus;
        if (targetStatusOverride) {
            nextStatus = targetStatusOverride;
        } else {
            const statusLower = (currentStatus || '').toLowerCase();

            if (statusLower === 'undo_ready') {
                nextStatus = 'in_progress';
            } else if (['archived', 'cancelled'].includes(statusLower)) {
                nextStatus = statusLower; // 🧱 TERMINAL PROTECTION
            } else if (['ready', 'shipped', 'completed', 'delivered', 'done'].includes(statusLower)) {
                // JUMP logic: If user clicks 'Delivered' when it's ready/delivered,
                // we move to 'archived' to make it vanish from active KDS completely.
                nextStatus = 'archived';
            } else if (['in_progress', 'new', 'pending', 'confirmed'].includes(statusLower)) {
                nextStatus = 'ready';
            } else {
                nextStatus = 'in_progress';
            }
        }

        console.log(`🔄 [KDS Local] Moving Order ${orderId} (${currentStatus} -> ${nextStatus})`);
        const now = new Date().toISOString();

        const payload = {
            order_status: nextStatus,
            updated_at: now,
            _localUpdatedAt: now, // 🛡️ CRITICAL: Mark local change time for SyncService LWW protection
            ...(nextStatus === 'ready' && { ready_at: now }),
            pending_sync: true
        };

        const itemStatusForItems = (nextStatus === 'completed' || nextStatus === 'archived' || nextStatus === 'shipped') ? 'completed' :
            nextStatus === 'ready' ? 'ready' :
                nextStatus === 'new' ? 'new' :
                    nextStatus === 'cancelled' ? 'cancelled' :
                        'in_progress';
        const shouldResetEarlyMarks = ['ready', 'completed', 'shipped', 'archived'].includes(nextStatus);

        // 🎯 STAGE-AWARE UPDATE: Only update items for the specific stage if provided
        const stageMatch = String(orderId).match(/-stage-(\d+)/);
        const targetStage = stageMatch ? Number(stageMatch[1]) : null;

        // 1. Update Dexie immediately
        await db.transaction('rw', db.orders, db.order_items, async () => {
            await db.orders.update(realId, payload);
            
            let itemsQuery = db.order_items.where('order_id').equals(realId);
            
            // If we have a target stage, only modify items for that stage
            if (targetStage) {
                itemsQuery = itemsQuery.filter(it => (it.course_stage || 1) === targetStage);
            }

            await itemsQuery.modify(it => {
                // 🍫 SHOKO PROTECTION (REFINED): 
                // 1. NEVER overwrite a 'held' status during an order-level status change.
                // 2. NEVER downgrade a terminal status ('completed', 'shipped', 'cancelled') back to 'ready' or 'in_progress'.
                const terminalStatuses = ['completed', 'shipped', 'cancelled'];
                const isCurrentlyTerminal = terminalStatuses.includes(it.item_status);
                const isTargetTerminal = terminalStatuses.includes(itemStatusForItems);

                if (it.item_status !== 'held' && (!isCurrentlyTerminal || isTargetTerminal)) {
                    it.item_status = itemStatusForItems;
                }

                if (shouldResetEarlyMarks) it.is_early_delivered = false;
                it.updated_at = now;
            });
        });

        // 🛡️ Update mask
        recentLocalUpdates.current.set(realId, { status: nextStatus, timestamp: Date.now() });

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
                if (order && order.order_status !== 'completed' && order.order_status !== 'ready') {
                    // Update order status to ready
                    await updateOrderStatus(orderId, null, 'ready');

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

    const handleDeliverItems = useCallback(async (orderId, itemIds) => {
        console.log(`🚚 [KDS Local] Delivering specific items for order ${orderId}:`, itemIds);
        for (const itemId of itemIds) {
            await updateItemStatus(itemId, 'completed');
        }

        // 🎯 AUTO-ARCHIVE CHECK: Only if ALL items are now terminal, update parent order to 'completed'
        try {
            const allItems = await db.order_items.where('order_id').equals(orderId).toArray();
            const allDone = allItems.every(i => ['completed', 'shipped', 'cancelled'].includes(i.item_status));
            
            if (allDone) {
                console.log(`🏁 [KDS Local] All items for order ${orderId} delivered. Archiving order.`);
                await updateOrderStatus(orderId, null, 'completed');
            } else {
                console.log(`⏳ [KDS Local] Order ${orderId} still has pending items. Parent order remains active.`);
            }
        } catch (e) {
            console.error('Error in Auto-Archive check:', e);
        }
    }, [updateItemStatus, updateOrderStatus]);

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
        const order = await db.orders.get(orderId);
        if (!order) {
            console.error(`❌ [KDS] Order ${orderId} not found in local DB`);
            return;
        }

        console.log(`💰 [KDS Local] Confirming payment for ${orderId} via ${paymentMethod}`);
        const now = new Date().toISOString();

        // 1. Update local database immediately
        await db.orders.update(orderId, {
            is_paid: true,
            paid_amount: order.total_amount || 0, // Ensure effectively paid
            payment_method: paymentMethod,
            order_status: 'completed',
            updated_at: now
        });

        // 2. Queue for reliable backend sync (handles offline seamlessly)
        try {
            const { queueAction } = await import('@/services/offlineQueue');
            await queueAction('CONFIRM_PAYMENT', {
                orderId: orderId,
                paymentMethod: paymentMethod,
                isLocalOrder: String(orderId).startsWith('L') || order?.is_offline
            });

            // 3. Opportunistic fast-sync
            const { supabase } = await import('@/lib/supabase');
            const { data, error } = await supabase.rpc('confirm_order_payment', {
                p_order_id: orderId,
                p_payment_method: paymentMethod
            });

            if (error) {
                console.error(`❌ Payment Sync failed:`, error);
                // Even if sync fails, the queueAction will retry.
            } else {
                console.log(`📤 Synced payment ${orderId} successfully`);
                // Mark as not needing sync anymore since we just did it
                await db.orders.update(orderId, { pending_sync: false });
            }
        } catch (err) {
            console.error('❌ Failed to process payment sync:', err);
        }
    }, []);

    const fetchHistoryOrders = useCallback(async (selectedDate) => {
        if (!businessId) return [];
        try {
            // 🕒 CALENDAR DAY LOGIC: 00:00 start (per user request)
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(startOfDay);
            endOfDay.setDate(endOfDay.getDate() + 1);

            const startISO = startOfDay.toISOString();
            const endISO = endOfDay.toISOString();

            console.log(`📜 [KDS History] Fetching for range: ${startISO} to ${endISO}`);

            let ordersList = await db.orders
                .where('[business_id+created_at]')
                .between([businessId, startISO], [businessId, endISO])
                .toArray();

            // Fallback to server if local is empty for that date
            if (ordersList.length === 0 && navigator.onLine) {
                try {
                    const { supabase } = await import('@/lib/supabase');
                    const { data: serverOrders } = await supabase.rpc('get_orders_history', {
                        p_from_date: startISO,
                        p_to_date: endISO,
                        p_business_id: businessId
                    });
                    if (serverOrders?.length > 0) ordersList = serverOrders;
                } catch (e) { console.warn('Online history fallback failed', e); }
            }

            const orderIds = ordersList.map(o => o.id);
            const [allItems, allCustomers, allMenuItems] = await Promise.all([
                db.order_items.where('order_id').anyOf(orderIds).toArray(),
                db.customers.where('business_id').equals(businessId).toArray(),
                db.menu_items.where('business_id').equals(businessId).toArray()
            ]);

            const menuItemsMap = new Map(allMenuItems.map(m => [m.id, m]));
            const customersMap = new Map(allCustomers.map(c => [c.id, c]));
            const finalHistoryCards = [];

            // Helper for Duration Formatting (MM:SS)
            const formatDuration = (ms) => {
                if (!ms || ms < 0) return null;
                const totalSeconds = Math.floor(ms / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            };

            ordersList.forEach(order => {
                const rawItems = allItems.filter(i => String(i.order_id) === String(order.id) && i.item_status !== 'cancelled');
                if (rawItems.length === 0) return;

                // 🛠️ Normalize statuses
                const orderItems = rawItems.map(i => ({
                    ...i,
                    item_status: i.item_status || (['completed', 'archived', 'shipped'].includes((order.orderStatus || order.order_status || '').toLowerCase()) ? 'completed' : 'new')
                }));

                const customer = customersMap.get(order.customer_id);
                const rawCName = order.customer_name || order.customerName || customer?.name;
                const isJustDigits = /^\d+$/.test(String(rawCName || ''));
                const derivedCustomerName = (rawCName && (rawCName.length > 15 || rawCName.includes('_') || isJustDigits)) ? '' : rawCName;

                const rawNum = String(order.order_number || '');
                const displayOrderNo = /^\d{1,5}$/.test(rawNum) ? rawNum : String(order.id).slice(-4).toUpperCase();

                // 📐 DURATION CALCULATIONS (Unified)
                const items1 = orderItems.filter(i => (i.course_stage || 1) === 1);
                const items2 = orderItems.filter(i => (i.course_stage || 1) === 2);

                let duration1 = null;
                let duration2 = null;

                // Duration 1: From created_at to latest Terminal Stage 1 Update
                if (items1.length > 0) {
                    const start1 = new Date(order.created_at).getTime();
                    const terminals1 = items1.filter(i => ['completed', 'shipped', 'ready', 'delivered'].includes(i.item_status));
                    if (terminals1.length > 0) {
                        const end1 = Math.max(...terminals1.map(i => new Date(i.updated_at || i.completed_at || order.updated_at).getTime()));
                        duration1 = formatDuration(end1 - start1);
                    }
                }

                // Duration 2: From earliest Fired_at to latest Terminal Stage 2 Update
                if (items2.length > 0) {
                    const firedItems = items2.filter(i => i.item_fired_at);
                    if (firedItems.length > 0) {
                        const start2 = Math.min(...firedItems.map(i => new Date(i.item_fired_at).getTime()));
                        const terminals2 = items2.filter(i => ['completed', 'shipped', 'ready', 'delivered'].includes(i.item_status));
                        if (terminals2.length > 0) {
                            const end2 = Math.max(...terminals2.map(i => new Date(i.updated_at || i.completed_at || order.updated_at).getTime()));
                            duration2 = formatDuration(end2 - start2);
                        }
                    }
                }

                finalHistoryCards.push({
                    id: order.id,
                    orderNumber: displayOrderNo,
                    customerName: derivedCustomerName,
                    customerPhone: order.customer_phone || order.customerPhone || customer?.phone_number,
                    isPaid: order.is_paid || order.isPaid,
                    totalAmount: order.totalAmount || order.total_amount,
                    created_at: order.created_at,
                    orderStatus: order.orderStatus || order.order_status,
                    timestamp: new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
                    duration: duration1,
                    duration2: duration2,
                    items: orderItems.map(item => {
                        const menuItem = menuItemsMap.get(item.menu_item_id) || { name: item.name || 'Unknown', price: 0 };
                        let parsedMods = [];
                        try {
                            if (typeof item.mods === 'string') parsedMods = JSON.parse(item.mods);
                            else if (Array.isArray(item.mods)) parsedMods = item.mods;
                        } catch (e) { }
                        if (Array.isArray(parsedMods)) {
                            parsedMods = parsedMods.filter(m => {
                                const name = (typeof m === 'object' ? (m.name || m.text || m.valueName) : String(m)) || '';
                                return !name.includes('KDS_OVERRIDE');
                            });
                        }
                        return { ...item, name: menuItem.name || item.name, modifiers: parsedMods };
                    })
                });
            });

            console.log(`📜 [KDS History] Unified count: ${finalHistoryCards.length}`);
            return finalHistoryCards;
        } catch (err) {
            console.error('❌ [KDS History] Failed to fetch:', err);
            return [];
        }
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
        console.log('🔄 [KDS] Refreshing - pulling latest from Supabase (Orders + Customers)...');
        try {
            const { syncOrders, syncLoyalty, syncTable } = await import('@/services/syncService');
            
            // Parallel sync of orders and supportive data (customers, loyalty)
            const [orderRes, custRes, loyaltyRes] = await Promise.all([
                syncOrders(businessId),
                syncTable('customers', 'customers', null, businessId),
                syncLoyalty(businessId).catch(() => ({ success: false })) // Non-critical fallback
            ]);

            if (orderRes.success && custRes.success) {
                console.log(`✅ [KDS] Refresh complete. Pulled ${orderRes.ordersCount || 0} orders and updated customers.`);
                return { success: true };
            } else {
                console.warn(`⚠️ [KDS] Refresh partial failure:`, { orderRes, custRes });
                return { success: false, error: 'Partial sync failure' };
            }
        } catch (err) {
            console.error('❌ [KDS] Refresh failed:', err);
            return { success: false, error: err.message };
        }
    }, [businessId]);

    const result = useMemo(() => ({
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
        handleDeliverItems,
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
        handleDeliverItems,
        handleCancelOrder,
        handleConfirmPayment,
        fetchOrders,
        fetchHistoryOrders,
        findNearestActiveDate,
        handleUndoLastAction,
        handleToggleEarlyDelivered
    ]);

    console.log('📦 [KDS-HOOK] Providing data to UI:', {
        current: result.currentOrders.length,
        completed: result.completedOrders.length,
        isOnline: navigator.onLine
    });

    return result;
};
