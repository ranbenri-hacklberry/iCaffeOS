import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/db/database';
import { useAuth } from '@/context/AuthContext';

export const useOrderPush = () => {
    const { currentUser } = useAuth();
    const isSyncing = useRef(false);

    useEffect(() => {
        if (!currentUser?.business_id) return;

        const syncPendingOrders = async () => {
            if (isSyncing.current || !navigator.onLine) return;
            isSyncing.current = true;

            try {
                // Find orders waiting to sync
                // Fallback to .filter() in case the pending_sync index hasn't migrated yet
                let pendingOrders;
                try {
                    pendingOrders = await db.orders
                        .where('pending_sync')
                        .equals(1) // IndexedDB stores booleans as 0/1
                        .toArray();
                    // Also catch true (some Dexie versions store as boolean)
                    const pendingTrue = await db.orders
                        .where('pending_sync')
                        .equals(true)
                        .toArray();
                    const ids = new Set(pendingOrders.map(o => o.id));
                    pendingTrue.forEach(o => { if (!ids.has(o.id)) pendingOrders.push(o); });
                } catch (indexErr) {
                    console.warn('⚠️ [OrderPush] pending_sync index missing, using filter fallback:', indexErr.message);
                    pendingOrders = await db.orders
                        .filter(o => o.pending_sync === true || o.pending_sync === 1)
                        .toArray();
                }

                if (pendingOrders.length === 0) {
                    isSyncing.current = false;
                    return;
                }

                console.log(`🔄 [OrderPush] Found ${pendingOrders.length} pending orders. Syncing...`);

                for (const order of pendingOrders) {
                    // Prepare Items
                    const items = await db.order_items.where('order_id').equals(order.id).toArray();

                    // Construct Payload for RPC
                    const payload = {
                        p_business_id: currentUser.business_id,
                        p_order_id: order.id,
                        p_payment_method: order.payment_method || 'cash',
                        p_is_paid: order.is_paid !== false, // Default to true if undefined
                        p_items: items.map(i => ({
                            menu_item_id: i.menu_item_id,
                            quantity: i.quantity || 1,
                            mods: (i.mods || []).map(m => typeof m === 'object' ? (m.valueId || m.text || JSON.stringify(m)) : m),
                            name: i.name, // Extra info if RPC supports it
                            price: i.price
                        })),
                        // Pass status if RPC supports p_status? 
                        // Usually submit_order_v3 defaults. We can try to update 'order_status' after creation if needed.
                    };

                    // We use submit_order_v3 because it handles inventory logic
                    console.log(`📤 [OrderPush] Pushing order ${order.order_number} (${order.id})`);

                    const { data, error } = await supabase.rpc('submit_order_v3', payload);

                    if (!error) {
                        console.log(`✅ [OrderPush] Order ${order.order_number} synced.`);
                        await db.orders.update(order.id, { pending_sync: false });

                        // Update Customer Info if needed
                        if (order.customer_name || order.customer_phone) {
                            await supabase.from('orders').update({
                                customer_name: order.customer_name,
                                customer_phone: order.customer_phone
                            }).eq('id', order.id);
                        }
                    } else {
                        console.error(`❌ [OrderPush] Sync failed for ${order.id}:`, error.message);
                        // If error is "duplicate key", mark as synced?
                        if (error.message?.includes('duplicate key') || error.code === '23505') {
                            console.warn('⚠️ Order already exists, marking as synced.');
                            await db.orders.update(order.id, { pending_sync: false });
                        }
                    }
                }

            } catch (err) {
                console.error('🔥 [OrderPush] Critical Error:', err);
            } finally {
                isSyncing.current = false;
            }
        };

        // Run sync every 10 seconds
        const interval = setInterval(syncPendingOrders, 10000);

        // Also run once immediately
        syncPendingOrders();

        return () => clearInterval(interval);
    }, [currentUser]);
};
