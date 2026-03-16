import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { db, menu_cache } from '@/db/database';

// Map database categories to frontend category IDs (legacy fallback)
const CATEGORY_MAP = {};

// Fallback categories removed to prevent "Ghost" state flicker
const FALLBACK_CATEGORIES = [];

/**
 * Custom hook for menu items management
 */
export const useMenuItems = (defaultCategory = 'hot-drinks', businessId = null) => {
    // 🚩 TRACE: Initial State Log
    const [rawMenuData, setRawMenuData] = useState([]);
    const [categories, setCategories] = useState([]); // Initialize empty to avoid ghost categories

    // Track fetch completion for tighter hydration gate
    const [categoriesFetched, setCategoriesFetched] = useState(false);
    const [itemsFetched, setItemsFetched] = useState(false);

    if (!categories.length) console.log('🔍 [useMenuItems] Initial categories state: []');

    const [menuLoading, setMenuLoading] = useState(true);

    // isHydrated is now derived from both categories and items being definitely fetched
    const isHydrated = useMemo(() => categoriesFetched && itemsFetched, [categoriesFetched, itemsFetched]);

    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState(defaultCategory);

    const getCategoryId = useCallback((dbCategory, categoryId) => {
        if (categoryId) {
            const foundById = categories.find(c => c.id === categoryId);
            if (foundById) return foundById.id;
        }
        const found = categories.find(c =>
            c.name === dbCategory ||
            c.name_he === dbCategory ||
            c.db_name === dbCategory
        );
        if (found) return found.id;
        return CATEGORY_MAP[dbCategory] || 'other';
    }, [categories]);

    const isFoodItem = useCallback((item) => {
        if (!item) return false;
        if (item.kds_routing_logic === 'MADE_TO_ORDER') return true;
        const dbCat = (item.db_category || '').toLowerCase();
        const name = (item.name || '').toLowerCase();
        if (dbCat.includes('כריך') || dbCat.includes('טוסט') || dbCat.includes('פיצה') || dbCat.includes('סלט')) return true;
        if (name.includes('כריך') || name.includes('טוסט') || name.includes('פיצה')) return true;
        return false;
    }, []);

    const fetchCategories = useCallback(async () => {
        const effectiveId = businessId || localStorage.getItem('businessId') || localStorage.getItem('business_id');
        if (!effectiveId) return;

        try {
            // 🚀 STEP 1: Instant Local Categories
            const searchId = isNaN(effectiveId) ? effectiveId : Number(effectiveId);
            const [localCatsNum, localCatsStr] = await Promise.all([
                db.item_category.where('business_id').equals(searchId).toArray(),
                db.item_category.where('business_id').equals(String(effectiveId)).toArray()
            ]);

            const localCats = localCatsNum.length > 0 ? localCatsNum : localCatsStr;

            if (localCats.length > 0) {
                const sortedLocal = [...localCats].sort((a, b) => (a.position || 0) - (b.position || 0));
                setCategories(sortedLocal.map(cat => ({
                    id: cat.id,
                    name: cat.name_he || cat.name,
                    name_he: cat.name_he,
                    db_name: cat.name,
                    icon: cat.icon || 'Folder',
                    position: cat.position
                })));
                setCategoriesFetched(true); // Milestone reached
            }
        } catch (e) { console.warn('Local categories failed:', e); }

        try {
            // ☁️ STEP 2: Background Sync
            const isInvalidId = !effectiveId || effectiveId === 'null' || effectiveId === 'undefined';
            if (isInvalidId) {
                 setCategoriesFetched(true);
                 return;
            }

            const syncPromise = supabase
                .from('item_category')
                .select('id, name, name_he, icon, position, is_hidden')
                .eq('business_id', effectiveId)
                .or('is_deleted.is.null,is_deleted.eq.false')
                .or('is_hidden.is.null,is_hidden.eq.false')
                .order('position', { ascending: true, nullsFirst: false });

            // If we have categories, we don't await. If not, we await.
            const { data } = await syncPromise;

            if (data && data.length > 0) {
                setCategories(data.map(cat => ({
                    id: cat.id,
                    name: cat.name_he || cat.name,
                    name_he: cat.name_he,
                    db_name: cat.name,
                    icon: cat.icon || 'Folder',
                    position: cat.position
                })));
                await db.item_category.bulkPut(data.map(d => ({ ...d, business_id: effectiveId })));
            }

            // Mark categories as fetched regardless of result (if query completed)
            setCategoriesFetched(true);
        } catch (e) {
            console.error('BG categories error:', e);
        } finally {
            setCategoriesFetched(true); // Ensure hydration unblocks even on failure
        }
    }, [businessId]);

    const fetchMenuItems = useCallback(async () => {
        const effectiveId = businessId || localStorage.getItem('businessId') || localStorage.getItem('business_id');

        if (!effectiveId) {
            console.warn('⚠️ [Blocked] No Business ID.');
            setMenuLoading(false);
            setItemsFetched(true); // Milestone reached (empty state)
            return;
        }

        try {
            // 🚀 STEP 1: Aggressive Local Fetch
            const searchId = isNaN(effectiveId) ? effectiveId : Number(effectiveId);
            console.log('⏱️ [T0] Start fetching from Dexie (Business:', searchId, ')');

            // Try both numeric and string formats for maximum compatibility
            const [localDataNum, localDataStr] = await Promise.all([
                db.menu_items.where('business_id').equals(searchId).toArray(),
                db.menu_items.where('business_id').equals(String(effectiveId)).toArray()
            ]);

            const localData = localDataNum.length > 0 ? localDataNum : localDataStr;

            // 🔥 OPTIMIZED: Fetch inventory stock only for this business
            const localInventory = await db.prepared_items_inventory.where('business_id').equals(searchId).toArray();
            const inventoryMap = new Map(localInventory.map(inv => [inv.item_id, inv.current_stock]));

            const syncKey = `menu_sync_time_${effectiveId}`;
            const lastSync = parseInt(localStorage.getItem(syncKey) || '0', 10);
            const isStale = (Date.now() - lastSync) > 1000 * 60 * 5; // 5 mins

            // If data is stale OR from KDS (detect via session or URL), we want to wait for network.
            const fromKds = window.location.search.includes('from=kds') || sessionStorage.getItem('order_origin') === 'kds' || sessionStorage.getItem('order_origin') === 'kds-history';
            const isOnline = navigator.onLine;
            const shouldWaitForNetwork = (isStale || fromKds) && isOnline;

            const enrichedLocalData = localData.filter(i => !i.is_deleted).map(item => ({
                ...item,
                current_stock: inventoryMap.get(item.id) ?? item.current_stock
            }));

            console.log(`⏱️ [T1] Dexie returned ${localData.length} items (${enrichedLocalData.length} active)`);

            if (localData.length > 0 && !shouldWaitForNetwork) {
                console.log(`🚀 [Instant Load] Found ${localData.length} items locally for ${effectiveId} (Fresh)`);
                setRawMenuData(enrichedLocalData);
                setMenuLoading(false); // 🔓 Unblock UI immediately
                setItemsFetched(true); // 🔓 Hydration milestone
            } else if (localData.length > 0) {
                console.log(`⏳ [Delayed Load] Local data is stale or from KDS. Waiting for cloud sync to prevent flash...`);
                // Do NOT setMenuLoading false here, wait for the network layer below.
            } else {
                console.log(`⏳ [First Load] No local data. Waiting for cloud sync...`);
            }

            // ☁️ STEP 2: Background Sync (Non-blocking if local exists and fresh)
            const isInvalidId = !effectiveId || effectiveId === 'null' || effectiveId === 'undefined';
            if (isInvalidId) {
                setMenuLoading(false);
                setItemsFetched(true);
                return;
            }

            const syncPromise = supabase.from('menu_items')
                .select('id, name, price, sale_price, category, category_id, is_hot_drink, kds_routing_logic, allow_notes, is_in_stock, description, modifiers, image_url, inventory_settings, is_deleted')
                .eq('business_id', effectiveId)
                .not('is_deleted', 'eq', true)
                .order('id', { ascending: true });

            // Also fetch inventory from cloud
            const inventoryPromise = supabase.from('prepared_items_inventory')
                .select('item_id, current_stock')
                .eq('business_id', effectiveId);

            if (localData.length === 0 || shouldWaitForNetwork) {
                console.log(`☁️ [${localData.length === 0 ? 'First Load' : 'Awaiting Sync'}] Creating Cloud Promises...`);

                let isResolved = false;

                const dataFetchPromise = Promise.all([syncPromise, inventoryPromise])
                    .then(async ([{ data: cloudData }, { data: cloudInventory }]) => {
                        if (isResolved) return true; // Ignore if timeout already triggered
                        isResolved = true;

                        if (cloudData && cloudData.length > 0) {
                            console.log(`✅ [Awaited Sync] Pulled ${cloudData.length} items from server`);

                            // Merge inventory
                            const invMap = new Map((cloudInventory || []).map(inv => [inv.item_id, inv.current_stock]));
                            const enrichedCloudData = cloudData.map(item => ({
                                ...item,
                                current_stock: invMap.get(item.id) ?? null
                            }));

                            setRawMenuData(enrichedCloudData);
                            setMenuLoading(false); // 🔥 Unlock UI here!
                            setItemsFetched(true);

                            await db.menu_items.bulkPut(cloudData);
                            if (cloudInventory) await db.prepared_items_inventory.bulkPut(cloudInventory);

                            localStorage.setItem(syncKey, Date.now().toString());

                            // 🖼️ Cache images lazily (after data is safe)
                            import('@/services/imageSyncService').then(m => m.syncMenuImages(cloudData));
                        } else {
                            // Empty data or other issue, fallback
                            if (localData.length > 0) setRawMenuData(enrichedLocalData);
                            setMenuLoading(false); // 🔥 Unlock UI here!
                        }
                        return true;
                    })
                    .catch(err => {
                        console.error('❌ [Awaited Sync] Cloud Fetch Failed:', err);
                        if (!isResolved) {
                            isResolved = true;
                            if (localData.length > 0) setRawMenuData(enrichedLocalData);
                            setMenuLoading(false); // 🔥 Unlock UI here!
                            setItemsFetched(true);
                        }
                        return false;
                    });

                // 🛑 TIMEOUT PROTECTION: If network is slow, unblock UI after 10s but let fetch continue!
                const timeoutPromise = new Promise(resolve => setTimeout(() => {
                    if (!isResolved) {
                        console.warn('⚠️ [Awaited Sync] Slow Network - Unblocking UI using fallback while fetch continues...');
                        isResolved = true;
                        if (localData.length > 0) {
                            setRawMenuData(enrichedLocalData);
                        }
                        setMenuLoading(false); // 🔥 Unlock UI here!
                        setItemsFetched(true);
                    }
                    resolve(false);
                }, 10000)); // 10 seconds

                // Wait for either data or timeout
                await Promise.race([dataFetchPromise, timeoutPromise]);
            } else {
                // Background update (run anyway to keep cache fresh, but UI already unblocked)
                Promise.all([syncPromise, inventoryPromise]).then(async ([{ data: cloudData }, { data: cloudInventory }]) => {
                    if (cloudData && cloudData.length > 0) {
                        const invMap = new Map((cloudInventory || []).map(inv => [inv.item_id, inv.current_stock]));
                        const enrichedCloudData = cloudData.map(item => ({
                            ...item,
                            current_stock: invMap.get(item.id) ?? null
                        }));

                        setRawMenuData(enrichedCloudData);
                        await db.menu_items.bulkPut(cloudData);
                        if (cloudInventory) await db.prepared_items_inventory.bulkPut(cloudInventory);

                        localStorage.setItem(syncKey, Date.now().toString());

                        // 🖼️ Cache images for offline use
                        import('@/services/imageSyncService').then(m => m.syncMenuImages(cloudData));
                    }
                }).catch(err => {
                    console.error('🔥 Background Sync Error:', err);
                });
            }
        } catch (err) {
            console.error('🔥 Fetch Error:', err);
            setMenuLoading(false); // Only set to false on unexpected error.
        }
    }, [businessId]);

    useEffect(() => {
        fetchCategories();
        fetchMenuItems();
    }, [fetchCategories, fetchMenuItems]);

    // 🚩 TRACE: Hydration State Log
    useEffect(() => {
        if (isHydrated) {
            console.log('✅ [useMenuItems] isHydrated became TRUE. Categories:', categories.length, 'Items:', rawMenuData.length);
        }
    }, [isHydrated, categories.length, rawMenuData.length]);

    // REAL-TIME INVENTORY SUBSCRIPTION
    useEffect(() => {
        if (!businessId) return;

        const channel = supabase
            .channel('inventory_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'prepared_items_inventory'
                },
                (payload) => {
                    const updated = payload.new;
                    setRawMenuData(prev => prev.map(item => {
                        if (item.id === updated.item_id) {
                            return { ...item, current_stock: updated.current_stock };
                        }
                        return item;
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [businessId]);

    const updateStockLocally = useCallback((itemId, newStock) => {
        setRawMenuData(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, current_stock: newStock };
            }
            return item;
        }));
    }, []);

    const menuItems = useMemo(() => {
        const seen = new Set();
        return rawMenuData
            .filter(item => {
                if (seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
            })
            .sort((a, b) => a.id - b.id)
            .map(item => ({
                id: item.id,
                name: item.name,
                price: item.sale_price > 0 ? item.sale_price : item.price,
                originalPrice: item.sale_price > 0 ? item.price : null,
                category: getCategoryId(item.category, item.category_id),
                image: item.image_url || null,
                is_hot_drink: !!(
                    item.is_hot_drink || 
                    item.modifiers?.is_hot_drink || 
                    item.modifiers?.config?.is_hot_drink ||
                    (Array.isArray(item.modifiers) && item.modifiers.some(m => m.is_hot_drink))
                ),
                kds_routing_logic: item.kds_routing_logic,
                db_category: item.category,
                modifiers: item.modifiers || [],
                // Ensure tracked items show 0 instead of null/hidden
                current_stock: (item.inventory_settings?.isPreparedItem || item.kds_routing_logic === 'hybrid')
                    ? (item.current_stock ?? 0)
                    : null,
                available: (item.inventory_settings?.isPreparedItem || item.kds_routing_logic === 'hybrid')
                    ? ((item.current_stock ?? 0) > 0 || item.inventory_settings?.hideOnZeroStock === false)
                    : true,
                inventory_settings: item.inventory_settings,
                prepared_items_inventory: item.prepared_items_inventory,
                business_id: item.business_id
            }));
    }, [rawMenuData, getCategoryId]);

    // 🎯 Filter out categories that have no items and deduplicate
    const availableCategories = useMemo(() => {
        const deduplicate = (cats) => {
            const unique = [];
            const seenNames = new Set();
            for (const c of cats) {
                const name = (c.name_he || c.name || '').trim();
                if (name && !seenNames.has(name)) {
                    seenNames.add(name);
                    unique.push(c);
                }
            }
            return unique;
        };

        // 🚀 CRITICAL: DO NOT show categories until hydrated.
        // Avoid "ghost" categories starting with FALLBACK_CATEGORIES.
        if (!isHydrated || (menuLoading && categories.length === 0)) {
            return []; // Return empty during initial block
        }

        const usedCategories = new Set();
        menuItems.forEach(item => {
            if (item.category) usedCategories.add(String(item.category));
            if (item.db_category) usedCategories.add(String(item.db_category));
        });

        // 1. Filter out hidden or unused categories
        const filtered = categories.filter(cat =>
            !cat.is_hidden && (
                usedCategories.has(String(cat.id)) ||
                usedCategories.has(String(cat.name)) ||
                usedCategories.has(String(cat.name_he)) ||
                usedCategories.has(String(cat.db_name))
            )
        );

        // 2. Fallback to categories even if no items found, but ONLY after hydration
        const base = filtered.length > 0 ? filtered : categories;

        // 3. Deduplicate visually by name to avoid empty ghost tabs
        return deduplicate(base).sort((a, b) => (a.position || 0) - (b.position || 0));
    }, [categories, menuItems, menuLoading, isHydrated]);

    // Create a mapping from any variant (name, name_he, id) to the representative ID
    const categoryRepresentativeMap = useMemo(() => {
        const mapping = new Map();
        const nameToRepresentativeId = new Map();

        // Pass 1: Establish representatives for each name
        availableCategories.forEach(cat => {
            const name = (cat.name_he || cat.name || '').trim();
            if (name && !nameToRepresentativeId.has(name)) {
                nameToRepresentativeId.set(name, cat.id);
            }
        });

        // Pass 2: Map all original categories to their representative
        categories.forEach(cat => {
            const name = (cat.name_he || cat.name || '').trim();
            const repId = nameToRepresentativeId.get(name);
            if (repId) {
                mapping.set(String(cat.id), repId);
                if (cat.name) mapping.set(cat.name, repId);
                if (cat.name_he) mapping.set(cat.name_he, repId);
            }
        });

        return mapping;
    }, [categories, availableCategories]);

    // 🚀 Handle initial category selection or invalid selection
    useEffect(() => {
        if (availableCategories.length > 0) {
            const currentRepId = categoryRepresentativeMap.get(String(activeCategory));
            const isCurrentValid = availableCategories.some(c => c.id === currentRepId);

            if (!isCurrentValid || activeCategory === null) {
                setActiveCategory(availableCategories[0].id);
            } else if (activeCategory !== currentRepId) {
                // If we are on a "duplicate" category ID, switch to the representative one
                setActiveCategory(currentRepId);
            }
        }
    }, [availableCategories, activeCategory, categoryRepresentativeMap]);

    const itemsForDisplay = useMemo(() => {
        return menuItems.map(item => ({
            ...item,
            displayCategory: categoryRepresentativeMap.get(String(item.category)) || item.category
        }));
    }, [menuItems, categoryRepresentativeMap]);

    const filteredItems = useMemo(() => {
        return itemsForDisplay.filter(item => item.displayCategory === activeCategory);
    }, [itemsForDisplay, activeCategory]);

    return {
        menuItems: itemsForDisplay,
        menuLoading,
        isHydrated, // Export hydration status
        error,
        activeCategory,
        filteredItems,
        categories: availableCategories,
        handleCategoryChange: setActiveCategory,
        isFoodItem,
        updateStockLocally
    };
};

export default useMenuItems;
