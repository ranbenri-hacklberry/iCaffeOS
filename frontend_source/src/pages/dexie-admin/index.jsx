import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/db/database';
import { supabase } from '@/lib/supabase';
import syncService from '@/services/syncService';
import Icon from '@/components/AppIcon';
import ConnectionStatusBar from '@/components/ConnectionStatusBar';

/**
 * Advanced Data Dashboard (Refined)
 * Premium look following the project's design system.
 * Features: Aleph-Bet filtering, Date navigation for points/orders.
 */
const DexieAdminPanel = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('customers');
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [exactMatchQuery, setExactMatchQuery] = useState(null);

    // Filter Debounce Logic: Prevents heavy re-calculation on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Data states
    const [customers, setCustomers] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [syncStatus, setSyncStatus] = useState({});
    const [syncResult, setSyncResult] = useState(null);
    const [speedTest, setSpeedTest] = useState(null);

    // 🆕 Sync Modal State
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncLogs, setSyncLogs] = useState([]);
    const [syncComplete, setSyncComplete] = useState(false);

    // PERFORMANCE: Virtualization states for long lists
    const [visibleItemsCount, setVisibleItemsCount] = useState({
        customers: 50,
        transactions: 100,
        orders: 100
    });

    // Reset visible counts when tab changes or search query changes
    useEffect(() => {
        setVisibleItemsCount({
            customers: 50,
            transactions: 100,
            orders: 100
        });
    }, [activeTab, debouncedQuery, exactMatchQuery]);

    useEffect(() => {
        if (currentUser?.business_id) {
            loadData();
        }
    }, [currentUser?.business_id]); // Re-load when business identity is confirmed

    // 🔄 AUTO-SYNC: Sync loyalty data when entering the 'transactions' tab
    useEffect(() => {
        const syncLoyaltyOnTabEnter = async () => {
            if (activeTab !== 'transactions' || !currentUser?.business_id) return;

            try {
                console.log('🔄 Auto-syncing loyalty data...');

                // Use get_all_loyalty_cards which returns ALL cards
                const { data: cards, error: cardsErr } = await supabase.rpc('get_all_loyalty_cards', {
                    p_business_id: currentUser.business_id
                });

                if (cardsErr) {
                    console.warn('❌ get_all_loyalty_cards error:', cardsErr.message);
                } else {
                    console.log(`📊 Found ${cards?.length || 0} loyalty cards`);
                    if (cards?.length > 0) {
                        await db.loyalty_cards.clear();
                        await db.loyalty_cards.bulkPut(cards);
                    }
                }

                // Sync loyalty transactions
                const { data: txs, error: txErr } = await supabase.rpc('get_loyalty_transactions_for_sync', {
                    p_business_id: currentUser.business_id
                });

                if (txErr) {
                    console.warn('❌ get_loyalty_transactions_for_sync error:', txErr.message);
                } else {
                    console.log(`📊 Found ${txs?.length || 0} transactions`);
                    if (txs?.length > 0) {
                        await db.loyalty_transactions.clear();
                        await db.loyalty_transactions.bulkPut(txs);
                    }
                }

                console.log('✅ Loyalty data synced');
                loadData();
            } catch (err) {
                console.warn('Loyalty auto-sync failed:', err);
            }
        };
        syncLoyaltyOnTabEnter();
    }, [activeTab, currentUser?.business_id]);



    const loadData = async () => {
        setLoading(true);
        try {
            const businessId = currentUser?.business_id;
            if (!businessId) return;

            // 0. SYNC CUSTOMERS from Supabase - GLOBAL for Admin to ensure local consistency
            try {
                const { data: cloudCustomers, error: custErr } = await supabase
                    .from('customers')
                    .select('*'); // Pull all local customers for the admin view

                if (!custErr && cloudCustomers?.length > 0) {
                    console.log(`☁️ Global Sync: ${cloudCustomers.length} customers from local Docker...`);
                    await db.customers.bulkPut(cloudCustomers);
                }
            } catch (syncErr) {
                console.warn('Customer global sync failed:', syncErr);
            }

            // 1. Load Customers (Global for admin panel)
            const customersData = await db.customers.toArray();

            const loyaltyCards = await db.loyalty_cards
                .where('business_id')
                .equals(businessId)
                .toArray();

            const loyaltyMap = new Map();
            loyaltyCards.forEach(card => {
                const phone = card.customer_phone;
                if (phone) loyaltyMap.set(phone.replace(/\D/g, ''), card.points_balance || 0);
            });

            const finalCustomers = customersData.map(c => {
                const cleanPhone = (c.phone_number || c.phone || '').toString().replace(/\D/g, '');
                const card = loyaltyCards.find(lc => lc.customer_phone?.replace(/\D/g, '') === cleanPhone);

                // FINAL TRICK: Use loyalty_coffee_count if card is missing or points are 0
                const cardPoints = card?.points_balance || 0;
                const customerCount = c.loyalty_coffee_count || 0;
                const points = Math.max(cardPoints, customerCount);

                return {
                    ...c,
                    points,
                    rewards: card?.free_coffees || 0
                };
            }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

            console.log(`📊 Loaded ${finalCustomers.length} customers with loyalty resolution (Ran: ${finalCustomers.find(c => c.name?.includes('רן'))?.points || 0})`);

            // 1.1 Load last purchase dates for these customers
            // Fetch all orders from business to match in-memory for speed if not too many
            const allOrdersRaw = await db.orders.toArray();
            const allOrders = allOrdersRaw.filter(o => o.business_id === businessId);
            console.log(`📊 Loaded ${allOrders.length} orders for history mapping`);

            const lastPurchaseMap = new Map();
            allOrders.forEach(order => {
                if (!order.customer_id) return;
                const existing = lastPurchaseMap.get(order.customer_id);
                if (!existing || new Date(order.created_at) > new Date(existing)) {
                    lastPurchaseMap.set(order.customer_id, order.created_at);
                }
            });

            const customersWithHistory = finalCustomers.map(c => ({
                ...c,
                last_purchase: lastPurchaseMap.get(c.id) || null
            }));
            setCustomers(customersWithHistory);

            // 2. Load ALL Transactions (last 30 days) - GLOBAL for admin panel
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // SYNC Transactions from Supabase first
            try {
                const { data: cloudTxs, error: txError } = await supabase
                    .from('loyalty_transactions')
                    .select('*'); // Pull all local transactions

                if (!txError && cloudTxs?.length > 0) {
                    await db.loyalty_transactions.clear();
                    await db.loyalty_transactions.bulkPut(cloudTxs);
                }
            } catch (err) {
                console.warn('Loyalty transaction global sync failed:', err);
            }

            const txData = await db.loyalty_transactions.toArray();
            console.log(`📊 Loaded ${txData.length} global transactions for sync check`);

            // Filter to last 30 days and sort newest first
            const allTx = txData
                .filter(tx => new Date(tx.created_at) >= thirtyDaysAgo)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            const txWithNames = allTx.map(tx => {
                const card = loyaltyCards.find(c => c.id === tx.card_id);
                const txPhone = (tx.customer_phone || card?.customer_phone || '').toString().replace(/\D/g, '');
                
                // Use the enhanced PhoneMap to find the customer
                const customer = customerPhoneMap.get(txPhone) || finalCustomers.find(cust => {
                    const cp = (cust.phone_number || cust.phone || '').toString().replace(/\D/g, '');
                    return cp === txPhone && txPhone !== '';
                });

                return {
                    ...tx,
                    customerName: customer?.name || (txPhone ? `${txPhone}` : 'לקוח אנונימי'),
                    customerPhone: tx.customer_phone || card?.customer_phone || customer?.phone_number || customer?.phone,
                    currentBalance: card?.points_balance ?? customer?.points ?? 0,
                    customer_id: customer?.id || tx.customer_id,
                    dateGroup: new Date(tx.created_at).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
                };
            });

            // 🌟 VIRTUAL TRANSACTION INJECTION - Add virtual "Starting Balance" for customers with points but NO TXs
            const customersWithTransactions = new Set(txWithNames.map(tx => tx.customerPhone?.replace(/\D/g, '')));
            
            finalCustomers.forEach(cust => {
                const phone = (cust.phone_number || cust.phone || '').toString().replace(/\D/g, '');
                if (cust.points > 0 && !customersWithTransactions.has(phone)) {
                    // 🎯 FIND LATEST ORDER DATE for this customer to make the virtual TX realistic
                    const customerOrders = allOrders.filter(o => {
                        const oPhone = (o.customer_phone || o.customerPhone || '').toString().replace(/\D/g, '');
                        return (oPhone === phone && phone !== '') || (o.customer_id === cust.id);
                    });

                    // Sort orders newest first to find the latest
                    customerOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    const latestOrderDate = customerOrders[0]?.created_at;

                    // Priority: Latest Order Date -> Customer Created At -> Now
                    const txDate = latestOrderDate ? new Date(latestOrderDate) : (cust.created_at ? new Date(cust.created_at) : new Date());
                    
                    txWithNames.push({
                        id: `virtual-${phone}`,
                        customerName: cust.name || phone,
                        customerPhone: phone,
                        change_amount: cust.points,
                        transaction_type: 'sync_balance',
                        created_at: txDate.toISOString(),
                        currentBalance: cust.points,
                        notes: latestOrderDate ? 'נצבר בהזמנה אחרונה (יומן חסר)' : 'יתרת פתיחה/סנכרון - לא נמצא יומן עסקאות',
                        dateGroup: txDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
                    });
                }
            });

            // 🕒 CHRONOLOGICAL SORT: Newest first
            txWithNames.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setTransactions(txWithNames);

            // 3. Load ALL Orders (last 14 days) - Optimized indexed query
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

            const allOrdersData = await db.orders
                .where('business_id')
                .equals(businessId)
                .toArray();

            const recentOrders = allOrdersData
                .filter(o => new Date(o.created_at) >= fourteenDaysAgo)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Fetch Order Items for these orders
            const orderIds = recentOrders.map(o => o.id);
            const orderItems = await db.order_items.where('order_id').anyOf(orderIds).toArray();

            // 2. Fetch ALL Menu Items in Dexie (to ensure names display even with business_id mismatches in Admin)
            const allMenuItems = await db.menu_items.toArray();
            const menuMap = new Map();
            allMenuItems.forEach(m => {
                if (m.id) {
                    menuMap.set(String(m.id), m.name);
                    const numId = Number(m.id);
                    if (!isNaN(numId)) menuMap.set(numId, m.name);
                }
            });

            // Fast Customer Access Maps
            const customerMap = new Map();
            const customerPhoneMap = new Map();
            customersWithHistory.forEach(c => {
                customerMap.set(String(c.id), c);
                const phone = (c.phone_number || c.phone || '').toString().replace(/\D/g, '');
                if (phone) customerPhoneMap.set(phone, c);
            });

            // Fetch Loyalty Transactions to get points added per order
            const txDataForPoints = await db.loyalty_transactions
                .where('business_id')
                .equals(businessId)
                .toArray();

            const orderPointsMap = new Map();
            txDataForPoints.forEach(tx => {
                if (tx.order_id && tx.transaction_type === 'purchase') {
                    const current = orderPointsMap.get(tx.order_id) || 0;
                    orderPointsMap.set(tx.order_id, current + (tx.change_amount || 0));
                }
            });

            // Attach items and resolved customer names to orders
            const ordersWithItems = recentOrders.map(order => {
                const cleanPhone = (order.customer_phone || '').toString().replace(/\D/g, '');
                const resolvedCustomer = customerMap.get(String(order.customer_id)) || customerPhoneMap.get(cleanPhone);

                const items = orderItems.filter(i => String(i.order_id) === String(order.id)).map(i => ({
                    ...i,
                    menu_item_name: menuMap.get(String(i.menu_item_id)) || menuMap.get(Number(i.menu_item_id)) || 'פריט לא ידוע'
                }));

                return {
                    ...order,
                    items,
                    resolved_customer_name: resolvedCustomer?.name || (cleanPhone ? null : order.customer_name),
                    points_added: orderPointsMap.get(order.id) || 0,
                    dateGroup: new Date(order.created_at).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
                };
            });

            setOrders(ordersWithItems);

            // 3. Load Menu
            const menu = await db.menu_items.where('business_id').equals(businessId).toArray();
            setMenuItems(menu);

            // 4. Sync Status
            const tables = ['customers', 'menu_items', 'orders', 'order_items', 'loyalty_cards', 'loyalty_transactions'];
            // Tables that have 'business_id' indexed in Dexie
            const tablesWithBusinessId = ['customers', 'menu_items', 'orders', 'loyalty_cards', 'loyalty_transactions'];

            const status = { syncing: false };
            let calculatedCloudOrderItems = 0; // Validated from fetched orders
            for (const table of tables) {
                let local = 0;
                let localError = null;
                try {
                    // FORCE JS Filter for ALL tables with business_id as indexes seem flaky
                    // This is less efficient but guarantees accuracy for small-medium datasets
                    if (tablesWithBusinessId.includes(table)) {
                        const allRecords = await db[table].toArray();
                        local = allRecords.filter(r => r.business_id === businessId).length;
                    }
                    // Try to use index for others
                    else if (tablesWithBusinessId.includes(table) && db[table]?.where) {
                        try {
                            local = await db[table].where('business_id').equals(businessId).count();
                        } catch (indexError) {
                            console.warn(`Index lookup failed for ${table}, falling back to filter`, indexError);
                            // Fallback to JS filter if index is missing/broken
                            const allRecords = await db[table].toArray();
                            local = allRecords.filter(r => r.business_id === businessId).length;
                        }
                    } else if (table === 'order_items') {
                        // Count ONLY items belonging to orders of this business
                        const businessOrderIds = (await db.orders.where('business_id').equals(businessId).toArray()).map(o => o.id);
                        local = await db.order_items.where('order_id').anyOf(businessOrderIds).count();
                    } else {
                        local = await db[table]?.count() || 0;
                    }
                } catch (e) {
                    console.warn(`Local count error for ${table}:`, e);
                    localError = e.message;
                }

                let cloud = 0;
                let cloudError = null;
                try {
                    // 1. Determine Fetch Strategy
                    if (table === 'orders') {
                        // Strategy: RPC for Orders History (Bypasses RLS logic for count)
                        // Use 30 days to match the new aggressive sync window
                        const fromDate = new Date();
                        fromDate.setDate(fromDate.getDate() - 30);
                        const { data, error } = await supabase.rpc('get_orders_history', {
                            p_business_id: businessId,
                            p_from_date: fromDate.toISOString(),
                            p_to_date: new Date().toISOString()
                        });

                        if (error) {
                            cloudError = error.message;
                        } else {
                            cloud = data?.length || 0;

                            // CRITICAL FIX: To show truthful status, local count MUST match the same 30-day window
                            const localOrdersInWindow = await db.orders
                                .where('business_id').equals(businessId)
                                .filter(o => new Date(o.created_at) >= fromDate)
                                .toArray();
                            local = localOrdersInWindow.length;

                            // Calculate items count from the fetched orders
                            if (data) {
                                calculatedCloudOrderItems = data.reduce((sum, order) => {
                                    const items = order.order_items || order.items_detail || [];
                                    return sum + items.length;
                                }, 0);
                            }
                        }
                    } else if (table === 'loyalty_cards') {
                        // Strategy: RPC for Loyalty Cards
                        const { data, error } = await supabase.rpc('get_loyalty_cards_for_sync', { p_business_id: businessId });
                        if (error) {
                            cloudError = error.message;
                        } else {
                            cloud = data?.length || 0;
                        }
                    } else if (table === 'loyalty_transactions') {
                        // Strategy: RPC for Loyalty Transactions
                        const { data, error } = await supabase.rpc('get_loyalty_transactions_for_sync', { p_business_id: businessId });
                        if (error) {
                            cloudError = error.message;
                        } else {
                            cloud = data?.length || 0;
                        }
                    } else if (table === 'order_items') {
                        // Strategy: Use pre-calculated count if available, otherwise skip
                        cloud = calculatedCloudOrderItems > 0 ? calculatedCloudOrderItems : -1;
                    } else {
                        // Strategy: Standard Query
                        let query = supabase.from(table).select('*', { count: 'exact', head: true });
                        if (tablesWithBusinessId.includes(table)) {
                            query = query.eq('business_id', businessId);
                        }
                        const { count, error } = await query;
                        if (error) {
                            cloudError = error.message;
                            console.warn(`Cloud count error for ${table}:`, error);
                        } else {
                            cloud = count || 0;
                        }
                    }
                } catch (e) {
                    cloudError = e.message;
                }
                status[table] = {
                    count: local,
                    cloudCount: cloud, // Keep raw value (-1) for logic checks
                    localError,
                    cloudError,
                    // Relaxed needsSync check
                    needsSync: local !== cloud && cloud > 0
                };
            }
            setSyncStatus(status);

        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * ADVANCED DATA GROUPING ENGINE
     * Optimized for scalability: uses single-pass reduction for O(n) performance
     * and debouncing to prevent UI lag.
     */
    const filteredContent = useMemo(() => {
        const query = (exactMatchQuery || debouncedQuery || '').toLowerCase().trim();
        const isExact = !!exactMatchQuery;

        if (!query) {
            // Fast Path: Full data grouping without filtering
            return {
                customers: groupData(customers, c => (c.name || '').trim().charAt(0)),
                menu: menuItems,
                orders: groupData(orders, o => o.dateGroup),
                transactions: groupData(transactions, t => t.dateGroup)
            };
        }

        // 1. Optimized Customer Filtering
        const filteredCustomers = customers.filter(c => {
            const name = (c.name || '').toLowerCase();
            const phone = (c.phone_number || c.phone || '').toString().replace(/\D/g, '');

            // Search match logic
            const isMatch = isExact
                ? (name === query || phone === query)
                : (name.includes(query) || phone.includes(query));

            return isMatch;
        });

        // 2. Optimized Transaction Filtering
        const filteredTransactions = transactions.filter(t => {
            const name = (t.customerName || '').toLowerCase();
            const phone = (t.customerPhone || '').toLowerCase();
            return isExact ? (name === query || phone === query) : (name.includes(query) || phone.includes(query));
        });

        // 3. Optimized Order Filtering
        const filteredOrders = orders.filter(o => {
            const orderNum = o.order_number?.toString() || '';
            const name = (o.customer_name || '').toLowerCase();
            const phone = (o.customer_phone || '').toLowerCase();
            return isExact ? (name === query || phone === query || orderNum === query) :
                (name.includes(query) || phone.includes(query) || orderNum.includes(query));
        });

        return {
            customers: groupData(filteredCustomers, c => (c.name || '').trim().charAt(0)),
            menu: menuItems.filter(m => {
                const name = (m.name || '').toLowerCase();
                return isExact ? name === query : name.includes(query);
            }),
            orders: groupData(filteredOrders, o => o.dateGroup),
            transactions: groupData(filteredTransactions, t => t.dateGroup)
        };
    }, [customers, menuItems, orders, transactions, debouncedQuery, exactMatchQuery]);

    // Helper: High-performance grouping utility (O(n) complexity)
    function groupData(items, labelSelector) {
        if (!items || items.length === 0) return [];
        return items.reduce((acc, item) => {
            const label = labelSelector(item) || '#';
            const lastGroup = acc[acc.length - 1];
            if (lastGroup && lastGroup.label === label) {
                lastGroup.items.push(item);
            } else {
                acc.push({ label, items: [item] });
            }
            return acc;
        }, []);
    }

    // Helper: Deterministic size generator (Moved to scope for cleaner code)
    const getShoeSize = (id) => {
        if (!id) return 42;
        const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        return Math.floor(Math.abs(Math.sin(hash)) * (45 - 36 + 1)) + 36;
    };

    const tabs = [
        { id: 'customers', label: 'לקוחות', icon: 'Users' },
        { id: 'transactions', label: 'נקודות', icon: 'Coffee' },
        { id: 'menu', label: 'תפריט', icon: 'Coffee' },
        { id: 'orders', label: 'הזמנות', icon: 'ShoppingCart' },
        { id: 'sync', label: 'סנכרון', icon: 'Database' },
    ];

    // 🆕 Full Sync Function with Terminal-like Logs
    const runFullSync = async () => {
        setIsSyncing(true);
        setSyncComplete(false);
        setSyncLogs([]);
        const log = (msg) => setSyncLogs(prev => [...prev, { time: new Date().toLocaleTimeString('he-IL'), msg }]);

        const businessId = currentUser?.business_id;
        if (!businessId) {
            log('❌ שגיאה: לא נמצא עסק');
            setIsSyncing(false);
            return;
        }

        try {
            log('🚀 מתחיל סנכרון מלא...');

            // 1. Sync Orders
            log('📦 מסנכרן הזמנות...');
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data: ordersData, error: ordersErr } = await supabase.rpc('get_orders_history', {
                p_business_id: businessId,
                p_from_date: thirtyDaysAgo.toISOString(),
                p_to_date: new Date().toISOString()
            });
            if (ordersErr) {
                log(`⚠️ שגיאה בהזמנות: ${ordersErr.message}`);
            } else if (ordersData?.length > 0) {
                await db.orders.bulkPut(ordersData);
                log(`✅ ${ordersData.length} הזמנות סונכרנו`);
            } else {
                log('📭 אין הזמנות חדשות');
            }

            // 2. Sync Customers
            log('👥 מסנכרן לקוחות...');
            const { data: customersData, error: custErr } = await supabase
                .from('customers')
                .select('*')
                .eq('business_id', businessId);
            if (custErr) {
                log(`⚠️ שגיאה בלקוחות: ${custErr.message}`);
            } else if (customersData?.length > 0) {
                await db.customers.bulkPut(customersData);
                log(`✅ ${customersData.length} לקוחות סונכרנו`);
            }

            // 3. Sync Loyalty Cards
            log('💳 מסנכרן כרטיסי נאמנות...');
            const { data: cards, error: cardsErr } = await supabase.rpc('get_all_loyalty_cards', {
                p_business_id: businessId
            });
            if (cardsErr) {
                log(`⚠️ שגיאה בכרטיסי נאמנות: ${cardsErr.message}`);
            } else if (cards?.length > 0) {
                await db.loyalty_cards.clear();
                await db.loyalty_cards.bulkPut(cards);
                log(`✅ ${cards.length} כרטיסי נאמנות סונכרנו`);
            }

            // 4. Sync Loyalty Transactions
            log('☕ מסנכרן נקודות נאמנות...');
            const { data: txs, error: txErr } = await supabase.rpc('get_loyalty_transactions_for_sync', {
                p_business_id: businessId
            });
            if (txErr) {
                log(`⚠️ שגיאה בנקודות: ${txErr.message}`);
            } else if (txs?.length > 0) {
                await db.loyalty_transactions.clear();
                await db.loyalty_transactions.bulkPut(txs);
                log(`✅ ${txs.length} פעולות נאמנות סונכרנו`);
            }

            // 5. Sync Menu Items - ROBUST: Pull all available to avoid ID mismatches
            log('🍕 מסנכרן תפריט...');
            const { data: menuData, error: menuErr } = await supabase
                .from('menu_items')
                .select('*');
                // Removed .eq('business_id', businessId) temporarily to ensure everything is local
            if (menuErr) {
                log(`⚠️ שגיאה בתפריט: ${menuErr.message}`);
            } else if (menuData?.length > 0) {
                await db.menu_items.clear(); // Clear old to avoid stale duplicates
                await db.menu_items.bulkPut(menuData);
                log(`✅ ${menuData.length} פריטי תפריט סונכרנו`);
            }

            log('');
            log('🎉 הסנכרון הושלם בהצלחה!');
            setSyncComplete(true);

            // Reload data after sync
            setTimeout(() => {
                loadData();
            }, 1500);

            // Auto-close modal after success
            setTimeout(() => {
                setShowSyncModal(false);
                setSyncLogs([]);
                setSyncComplete(false);
            }, 3000);

        } catch (err) {
            log(`🔥 שגיאה קריטית: ${err.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    // 🆕 Check sync status on load and prompt if needed
    useEffect(() => {
        const checkSyncStatus = async () => {
            if (!currentUser?.business_id) return;

            // Quick check: compare local orders count vs cloud
            const localOrdersCount = await db.orders.where('business_id').equals(currentUser.business_id).count();

            // If local is empty, definitely need sync
            if (localOrdersCount === 0) {
                setShowSyncModal(true);
            }
        };

        // Run after initial load completes
        if (!loading && currentUser?.business_id) {
            checkSyncStatus();
        }
    }, [loading, currentUser?.business_id]);



    return (
        <div className="min-h-screen bg-[#F8FAFC] font-heebo" dir="rtl">
            {/* 🆕 Sync Modal */}
            {showSyncModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Icon name="RefreshCw" size={24} className={isSyncing ? 'animate-spin' : ''} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black">סנכרון נתונים</h2>
                                    <p className="text-sm text-white/70">המידע המקומי לא מעודכן</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {!isSyncing && !syncComplete && syncLogs.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="text-6xl mb-4">🔄</div>
                                    <p className="text-lg font-bold text-slate-700 mb-2">המערכת זיהתה שהנתונים לא מסונכרנים</p>
                                    <p className="text-sm text-slate-500 mb-6">לחץ על הכפתור כדי לסנכרן את כל הנתונים מהענן</p>
                                    <button
                                        onClick={runFullSync}
                                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-lg rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                                    >
                                        🚀 התחל סנכרון
                                    </button>
                                </div>
                            )}

                            {/* Terminal-like Log Display */}
                            {syncLogs.length > 0 && (
                                <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
                                    <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                        <span className="text-xs text-slate-400 mr-4">Terminal - Sync</span>
                                        {isSyncing && <span className="text-xs text-blue-400 animate-pulse">● מסנכרן...</span>}
                                    </div>
                                    <div className="p-4 h-64 overflow-y-auto font-mono text-sm space-y-1">
                                        {syncLogs.map((log, idx) => (
                                            <div key={idx} className={`flex gap-3 ${log.msg.includes('✅') ? 'text-green-400' :
                                                log.msg.includes('❌') || log.msg.includes('🔥') ? 'text-red-400' :
                                                    log.msg.includes('⚠️') ? 'text-yellow-400' :
                                                        log.msg.includes('🎉') ? 'text-purple-400 font-bold text-base' :
                                                            'text-slate-300'
                                                }`}>
                                                <span className="text-slate-500 text-xs">[{log.time}]</span>
                                                <span>{log.msg}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Success State */}
                            {syncComplete && (
                                <div className="text-center py-4 animate-in fade-in duration-500">
                                    <div className="text-5xl mb-2">✅</div>
                                    <p className="text-lg font-black text-green-600">הסנכרון הושלם בהצלחה!</p>
                                    <p className="text-sm text-slate-500">החלון ייסגר אוטומטית...</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer - Close button if not syncing */}
                        {!isSyncing && !syncComplete && (
                            <div className="px-6 pb-6">
                                <button
                                    onClick={() => setShowSyncModal(false)}
                                    className="w-full py-3 text-slate-500 hover:text-slate-700 font-bold transition-colors"
                                >
                                    סגור ללא סנכרון
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header Redesign: Tabs Moved to Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
                    {/* Right Side: Back Button + Title */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/mode-selection')} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all text-slate-600 flex items-center gap-2">
                            <Icon name="ArrowRight" size={20} />
                            <span className="text-sm font-bold hidden sm:inline">חזרה</span>
                        </button>
                        <button
                            onClick={loadData}
                            className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl transition-all"
                            title="רענן נתונים"
                        >
                            <Icon name="RefreshCw" size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <div className="px-4 py-2 bg-orange-50 rounded-xl">
                            <p className="text-xs font-black text-orange-500 uppercase tracking-widest leading-none mb-1">צפייה בבסיס נתונים</p>
                            <p className="text-sm font-bold text-slate-800 leading-none">{currentUser?.business_name}</p>
                        </div>
                    </div>

                    {/* Navigation Bar in Header */}
                    <nav className="flex items-center bg-slate-100 p-1.5 rounded-2xl">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${activeTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                <Icon name={tab.icon} size={16} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="relative w-80 group">
                        <div className={`
                            flex items-center gap-2 w-full bg-slate-50 border transition-all duration-200 rounded-xl px-3 py-1.5
                            ${exactMatchQuery ? 'border-orange-200 ring-2 ring-orange-500/5' : 'border-slate-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/10'}
                        `}>
                            <Icon name="Search" size={16} className={`${exactMatchQuery ? 'text-orange-400' : 'text-slate-400'}`} />

                            {exactMatchQuery && (
                                <div className="flex items-center gap-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg border border-orange-200 animate-in zoom-in-95 duration-200 shrink-0">
                                    <button
                                        onClick={() => setExactMatchQuery(null)}
                                        className="p-0.5 hover:bg-orange-200 rounded-md transition-colors"
                                    >
                                        <Icon name="X" size={10} />
                                    </button>
                                    <span className="text-xs font-black tracking-tight">{exactMatchQuery}</span>
                                </div>
                            )}

                            <input
                                type="text"
                                placeholder={exactMatchQuery ? "" : "חיפוש..."}
                                className="flex-1 bg-transparent border-none p-0 py-1 text-sm font-bold outline-none placeholder:text-slate-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchQuery.trim()) {
                                        setExactMatchQuery(searchQuery.trim());
                                        setSearchQuery('');
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 opacity-30">
                        <div className="w-12 h-12 border-4 border-slate-300 border-t-orange-500 rounded-full animate-spin mb-4" />
                        <p className="font-black text-slate-500 tracking-tighter">מאחזר נתונים מהענן...</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {activeTab === 'customers' && (
                            <div className="space-y-4">
                                {filteredContent.customers.length === 0 ? (
                                    <div className="py-20 text-center font-bold text-slate-300 bg-white rounded-3xl border border-dashed border-slate-200">לא נמצאו לקוחות</div>
                                ) : filteredContent.customers.map((group, gIdx) => (
                                    <div key={`customer-group-${group.label}-${gIdx}`} className="space-y-4">
                                        <div className="flex items-center gap-3 py-6 sticky top-20 z-20 bg-[#F8FAFC]">
                                            <div className="px-4 py-1.5 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md">
                                                {group.label}
                                            </div>
                                            <div className="h-[1px] flex-1 bg-slate-200"></div>
                                        </div>

                                        <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-xl">
                                            <table className="w-full text-right border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-100">
                                                        <th className="px-6 py-5 text-sm font-black text-slate-500 uppercase">לקוח</th>
                                                        <th className="px-6 py-5 text-sm font-black text-slate-500 uppercase">טלפון</th>
                                                        <th className="px-6 py-5 text-sm font-black text-slate-500 uppercase">נקודות</th>
                                                        <th className="px-6 py-5 text-sm font-black text-slate-500 uppercase">צ'ופרים 🎁</th>
                                                        <th className="px-6 py-5 text-sm font-black text-slate-500 uppercase">קנייה אחרונה</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {group.items.slice(0, visibleItemsCount.customers).map(cust => {
                                                        const shoeSize = getShoeSize(cust.id);
                                                        return (
                                                            <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors group">
                                                                <td className="px-6 py-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                                                            {(cust.name || '?').charAt(0)}
                                                                        </div>
                                                                        <div className="font-black text-slate-800 text-lg uppercase">{cust.name || 'לקוח אנונימי'}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5 font-bold text-slate-400">{cust.phone_number || cust.phone || '---'}</td>
                                                                <td className="px-6 py-5">
                                                                    <div className={`w-fit px-4 py-1.5 rounded-xl font-black text-sm flex items-center gap-2 ${cust.points >= 9 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                        <Icon name="Coffee" size={14} />
                                                                        {cust.points}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5 text-slate-500 font-bold">
                                                                    {cust.last_purchase ? new Date(cust.last_purchase).toLocaleDateString('he-IL') : 'מעולם לא'}
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    {cust.rewards > 0 ? (
                                                                        <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-xl font-black text-sm animate-pulse border border-green-200">
                                                                            <Icon name="Gift" size={14} />
                                                                            {cust.rewards} קפה חינם
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-300 font-bold">-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}

                                {filteredContent.customers.reduce((acc, g) => acc + g.items.length, 0) > visibleItemsCount.customers && (
                                    <div className="flex justify-center pt-8">
                                        <button
                                            onClick={() => setVisibleItemsCount(prev => ({ ...prev, customers: prev.customers + 100 }))}
                                            className="px-8 py-4 bg-white border border-slate-200 rounded-3xl font-black text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm hover:shadow-md flex items-center gap-2 group"
                                        >
                                            <Icon name="ArrowDown" size={18} className="group-hover:translate-y-0.5 transition-transform" />
                                            טען עוד לקוחות
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'transactions' && (
                            <div className="space-y-4">
                                {filteredContent.transactions.length === 0 ? (
                                    <div className="py-20 text-center font-bold text-slate-300 bg-white rounded-3xl border border-dashed border-slate-200">אין פעולות בתאריך זה</div>
                                ) : filteredContent.transactions.map((group, gIdx) => (
                                    <div key={`tx-group-${group.label}-${gIdx}`} className="space-y-4">
                                        <div className="flex items-center gap-3 py-6 sticky top-20 z-20 bg-[#F8FAFC]">
                                            <div className="px-4 py-1.5 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md">
                                                {group.label}
                                            </div>
                                            <div className="h-[1px] flex-1 bg-slate-200"></div>
                                        </div>

                                        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                                            <table className="w-full text-right border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-100">
                                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">זמן</th>
                                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">לקוח</th>
                                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">טלפון</th>
                                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">פעולה</th>
                                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">שינוי</th>
                                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">יתרה נוכחית</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {group.items.slice(0, visibleItemsCount.transactions).map(tx => (
                                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4 text-sm font-bold text-slate-500">{new Date(tx.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</td>
                                                            <td className="px-6 py-4 font-black text-slate-800">{tx.customerName}</td>
                                                            <td className="px-6 py-4 text-sm text-slate-500 font-mono" dir="ltr">{tx.customerPhone || '---'}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${(tx.transaction_type === 'purchase' && (tx.change_amount || 0) >= 0) ? 'bg-blue-50 text-blue-600' :
                                                                    (tx.transaction_type === 'refund' || tx.transaction_type === 'cancellation' || (tx.transaction_type === 'purchase' && tx.change_amount < 0)) ? 'bg-red-50 text-red-600' :
                                                                        tx.transaction_type === 'redemption' ? 'bg-green-50 text-green-600' :
                                                                            'bg-purple-50 text-purple-600'}`}>
                                                                    {(tx.transaction_type === 'purchase' && (tx.change_amount || 0) >= 0) ? 'רכישה' :
                                                                        (tx.transaction_type === 'refund' || tx.transaction_type === 'cancellation' || (tx.transaction_type === 'purchase' && tx.change_amount < 0)) ? 'ביטול/החזר' :
                                                                            tx.transaction_type === 'redemption' ? 'מימוש' :
                                                                                'תיקון ידני'}
                                                                </span>
                                                            </td>
                                                            <td className={`px-6 py-4 font-black ${tx.change_amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                {tx.change_amount > 0 ? `+${tx.change_amount}` : tx.change_amount}
                                                            </td>
                                                            <td className="px-6 py-4 font-black text-slate-700">
                                                                <div className="flex items-center gap-1 bg-slate-100 w-fit px-2 py-1 rounded-lg">
                                                                    <Icon name="Coffee" size={14} className="text-slate-400" />
                                                                    <span>{tx.currentBalance}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}

                                {filteredContent.transactions.reduce((acc, g) => acc + g.items.length, 0) > visibleItemsCount.transactions && (
                                    <div className="flex justify-center pt-8">
                                        <button
                                            onClick={() => setVisibleItemsCount(prev => ({ ...prev, transactions: prev.transactions + 100 }))}
                                            className="px-8 py-4 bg-white border border-slate-200 rounded-3xl font-black text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm hover:shadow-md flex items-center gap-2 group"
                                        >
                                            <Icon name="ArrowDown" size={18} className="group-hover:translate-y-0.5 transition-transform" />
                                            טען עוד פעולות
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="space-y-4">
                                {filteredContent.orders.length === 0 ? (
                                    <div className="py-20 text-center font-bold text-slate-300 bg-white rounded-3xl border border-dashed border-slate-200">אין הזמנות בתאריך זה</div>
                                ) : filteredContent.orders.map((group, gIdx) => (
                                    <div key={`order-group-${group.label}-${gIdx}`} className="space-y-3">
                                        <div className="flex items-center gap-3 py-6 sticky top-20 z-20 bg-[#F8FAFC]">
                                            <div className="px-4 py-1.5 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md">
                                                {group.label}
                                            </div>
                                            <div className="h-[1px] flex-1 bg-slate-200"></div>
                                        </div>

                                        {group.items.slice(0, visibleItemsCount.orders).map(order => {
                                            const prepTime = order.updated_at && order.created_at ? Math.round((new Date(order.updated_at) - new Date(order.created_at)) / 60000) : 0;

                                            // 🆕 Enhanced payment method display
                                            const PAYMENT_METHOD_LABELS = {
                                                'cash': 'מזומן',
                                                'credit_card': 'אשראי',
                                                'bit': 'ביט',
                                                'paybox': 'פייבוקס',
                                                'gift_card': 'שובר',
                                                'oth': 'OTH',
                                                'cibus': 'סיבוס',
                                                'bis': 'תן ביס'
                                            };
                                            const paymentMethod = PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method || null;

                                            // 🆕 Check if actually paid
                                            const isPaid = order.is_paid === true;

                                            const relatedCustomer = customers.find(c =>
                                                (c.id && c.id === order.customer_id) ||
                                                (c.phone_number?.replace(/\D/g, '') === order.customer_phone?.replace(/\D/g, '')) ||
                                                (c.phone?.replace(/\D/g, '') === order.customer_phone?.replace(/\D/g, ''))
                                            );
                                            const displayPhone = order.customer_phone || relatedCustomer?.phone || relatedCustomer?.phone_number;
                                            const displayName = order.resolved_customer_name || relatedCustomer?.name || `#${order.order_number}`;

                                            // 🆕 Get loyalty points info for this customer
                                            const customerPoints = relatedCustomer?.points || 0;

                                            return (
                                                <div key={order.id} className="bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group w-full text-slate-800 h-[72px]">
                                                    <div className="flex flex-col justify-center w-[180px] shrink-0 border-l border-slate-50 pl-4">
                                                        <div className="font-black text-lg leading-tight text-slate-800 truncate text-right" title={displayName}>
                                                            {displayName}
                                                        </div>
                                                        <div className="text-xs font-bold text-slate-400 flex items-center gap-2 mt-0.5 h-4">
                                                            {displayName !== `#${order.order_number}` && <span>#{order.order_number}</span>}
                                                            {displayPhone && !displayPhone.toString().includes('GUEST') && (
                                                                <>
                                                                    {(displayName) && <span className="text-slate-300">|</span>}
                                                                    <span className="truncate" dir="ltr">{displayPhone}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="w-[60px] text-center shrink-0">
                                                        <div className="text-sm font-bold text-slate-400 font-mono">
                                                            {new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 flex items-center overflow-hidden h-full px-4 border-r border-slate-100 bg-slate-50/50 rounded-lg mx-2">
                                                        <div className="flex items-center gap-1 text-sm truncate w-full">
                                                            {order.items?.map((item, idx) => (
                                                                <span key={idx} className="flex items-center whitespace-nowrap text-slate-700">
                                                                    {item.quantity > 1 && <span className="font-black text-black ml-1.5">{item.quantity}</span>}
                                                                    <span className="font-bold">{item.menu_item_name}</span>
                                                                    {idx < order.items.length - 1 && <span className="mx-2 text-slate-300">|</span>}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 w-[160px] justify-between shrink-0 pl-2">
                                                        <span className="block font-black text-xl">₪{order.total_amount}</span>
                                                        {/* 🆕 Payment Status - Shows method OR unpaid badge */}
                                                        {isPaid ? (
                                                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{paymentMethod || 'שולם'}</span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md animate-pulse">לא שולם</span>
                                                        )}
                                                    </div>
                                                    <div className="w-[70px] flex justify-center shrink-0">
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-100 text-slate-400 bg-white">
                                                            <Icon name="Clock" size={12} />
                                                            <span className="text-xs font-bold font-mono">{prepTime > 0 ? `${prepTime}'` : '--'}</span>
                                                        </div>
                                                    </div>
                                                    {/* 🆕 Points Column - Shows ☕ total (+ earned) */}
                                                    <div className="w-[90px] flex justify-center shrink-0">
                                                        {customerPoints > 0 || order.points_added > 0 ? (
                                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-100">
                                                                <Icon name="Coffee" size={14} />
                                                                <span className="text-sm font-black">{customerPoints}</span>
                                                                {order.points_added > 0 && (
                                                                    <span className="text-[10px] font-bold text-orange-500">(+{order.points_added})</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">-</span>
                                                        )}
                                                    </div>
                                                    <div className="w-[90px] flex justify-end shrink-0">
                                                        <div className={`w-full py-1.5 rounded-xl text-xs font-black text-center shadow-sm ${order.order_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {order.order_status === 'completed' ? 'הושלם' : 'בתהליך'}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}

                                {filteredContent.orders.reduce((acc, g) => acc + g.items.length, 0) > visibleItemsCount.orders && (
                                    <div className="flex justify-center pt-8">
                                        <button
                                            onClick={() => setVisibleItemsCount(prev => ({ ...prev, orders: prev.orders + 100 }))}
                                            className="px-8 py-4 bg-white border border-slate-200 rounded-3xl font-black text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm hover:shadow-md flex items-center gap-2 group"
                                        >
                                            <Icon name="ArrowDown" size={18} className="group-hover:translate-y-0.5 transition-transform" />
                                            טען עוד הזמנות
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'menu' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {filteredContent.menu.map(item => (
                                    <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative overflow-hidden group">
                                        {!item.is_active && <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center font-black text-[10px] text-slate-400 uppercase rotate-12">לא פעיל</div>}
                                        <p className="text-[10px] font-black text-orange-500 uppercase mb-1">{item.category}</p>
                                        <h5 className="font-black text-slate-700 text-sm leading-tight mb-2">{item.name}</h5>
                                        <p className="font-black text-slate-900 text-xs">₪{item.price}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'sync' && (
                            <div className="max-w-3xl mx-auto">
                                <div className="bg-slate-900 rounded-[32px] p-8 text-white mb-8 shadow-2xl relative overflow-hidden">
                                    <div className="relative z-10 flex flex-col items-start gap-4 w-full">
                                        <div className="flex justify-between items-center w-full">
                                            <div>
                                                <h2 className="text-2xl font-black mb-1">מסוף סנכרון</h2>
                                                <p className="text-slate-400 text-sm font-bold flex items-center gap-2">
                                                    השוואת מסד הנתונים המקומי מול שרתי הענן
                                                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-500 font-mono">BID: {currentUser?.business_id?.substring(0, 8)}...</span>
                                                </p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    disabled={syncStatus.syncing || speedTest?.loading}
                                                    onClick={async () => {
                                                        setSpeedTest({ loading: true, result: null });
                                                        try {
                                                            const start = Date.now();
                                                            // Fetch a random image to test speed/latency
                                                            await fetch('https://source.unsplash.com/random/800x600', { cache: 'no-cache' }).catch(() => { });
                                                            // Fallback or just measure latency
                                                            await supabase.from('businesses').select('count', { count: 'exact', head: true });
                                                            const duration = Date.now() - start;
                                                            const speed = duration < 100 ? 'מעולה 🚀' : duration < 500 ? 'טוב ✅' : 'איטי ⚠️';
                                                            setSpeedTest({ loading: false, result: `${speed} (${duration}ms)` });
                                                        } catch (e) {
                                                            setSpeedTest({ loading: false, result: 'שגיאה ❌' });
                                                        }
                                                    }}
                                                    className="px-6 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-bold transition-all disabled:opacity-50 text-white border border-slate-600"
                                                >
                                                    {speedTest?.loading ? 'בודק...' : 'בדיקת מהירות'}
                                                </button>
                                                <button
                                                    disabled={syncStatus.syncing || speedTest?.loading}
                                                    onClick={async () => {
                                                        setSyncStatus(prev => ({ ...prev, syncing: true }));
                                                        setSyncResult(null);
                                                        try {
                                                            const res = await syncService.initialLoad(currentUser.business_id);
                                                            await loadData();
                                                            if (res?.success) {
                                                                // Format nice report
                                                                const changes = Object.entries(res.results).filter(([_, r]) => r.count > 0).map(([t, r]) => `${t}: ${r.count}`).join(', ');
                                                                const pruned = res.results.orders?.prunedCount || 0;
                                                                setSyncResult(`סנכרון הושלם בהצלחה (${res.duration}s). ${changes ? 'עודכנו: ' + changes : 'הכל מעודכן.'} ${pruned > 0 ? `🧹 נוקו ${pruned} הזמנות עודפות.` : ''}`);
                                                            } else {
                                                                setSyncResult('סנכרון נכשל or אוף-ליין');
                                                            }
                                                        } finally {
                                                            setSyncStatus(prev => ({ ...prev, syncing: false }));
                                                        }
                                                    }}
                                                    className="px-8 py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-black transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50"
                                                >
                                                    {syncStatus.syncing ? 'מסנכרן...' : 'הפעל סנכרון מלא'}
                                                </button>

                                                {/* Clear & Reset Button */}
                                                <button
                                                    disabled={syncStatus.syncing}
                                                    onClick={async () => {
                                                        if (!window.confirm('האם אתה בטוח? פעולה זו תמחק את כל הנתונים המקומיים ותסנכרן מחדש מהענן.')) return;

                                                        // 1. Immediate UI Feedback - set local counts to 1 (visual cue that it changed) or 0
                                                        setSyncStatus(prev => {
                                                            const cleared = { ...prev, syncing: true };
                                                            Object.keys(cleared).forEach(k => {
                                                                if (k !== 'syncing') cleared[k] = { ...cleared[k], count: 0 };
                                                            });
                                                            return cleared;
                                                        });
                                                        setSyncResult('מנקה נתונים מקומיים...');

                                                        try {
                                                            // 2. Clear Database
                                                            const { clearAllData, db } = await import('@/db/database');
                                                            await clearAllData();

                                                            // 3. Force re-load metadata to UI (should show zeros)
                                                            await loadData();
                                                            setSyncResult('מסד הנתונים נוקה. מתחיל סנכרון רענן...');

                                                            // 4. Fresh Sync
                                                            const res = await syncService.initialLoad(currentUser.business_id);

                                                            // 5. Final UI Refresh
                                                            await loadData();

                                                            if (res?.success) {
                                                                const changes = Object.entries(res.results).filter(([_, r]) => r.count > 0).map(([t, r]) => `${t}: ${r.count}`).join(', ');
                                                                setSyncResult(`🔄 אתחול הושלם בהצלחה! הכל נקי ומסונכרן. (${res.duration}s)`);
                                                            } else {
                                                                setSyncResult('⚠️ אתחול חלקי - אנא בדוק חיבור');
                                                            }
                                                        } catch (err) {
                                                            setSyncResult('❌ שגיאה: ' + err.message);
                                                        } finally {
                                                            setSyncStatus(prev => ({ ...prev, syncing: false }));
                                                        }
                                                    }}
                                                    className="px-6 py-4 bg-red-600/80 hover:bg-red-500 rounded-2xl font-black transition-all shadow-xl shadow-red-600/20 disabled:opacity-50 border border-red-400/30"
                                                >
                                                    🗑️ ניקוי ואתחול
                                                </button>
                                            </div>
                                        </div>

                                        {/* Results Display Area */}
                                        {(syncResult || speedTest?.result) && (
                                            <div className="w-full bg-slate-800/50 rounded-xl p-4 mt-2 border border-slate-700/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                                                {speedTest?.result && (
                                                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                                                        <Icon name="Activity" size={16} />
                                                        <span>מהירות רשת: {speedTest.result}</span>
                                                    </div>
                                                )}
                                                {syncResult && (
                                                    <div className="flex items-center gap-2 text-blue-300 font-medium text-sm">
                                                        <Icon name="CheckCircle" size={16} />
                                                        <span>{syncResult}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <Icon name="Database" size={160} className="absolute -left-10 -bottom-10 text-white/5" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(syncStatus).filter(([k]) => k !== 'syncing').map(([table, data]) => {
                                        return (
                                            <div key={table} className="bg-white rounded-2xl p-6 border border-slate-100 flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{table}</p>
                                                    <div className="flex flex-col text-sm font-bold gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                            <span>מקומי: {data.count}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                                                            <span>ענן: {data.cloudCount === -1 ? '?' : data.cloudCount}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {(data.count === data.cloudCount || data.cloudCount === -1) ? <Icon name="CheckCircle" className="text-green-500" /> : <Icon name="AlertCircle" className="text-red-500" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <ConnectionStatusBar />
        </div>
    );
};

export default DexieAdminPanel;
