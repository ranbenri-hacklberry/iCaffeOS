import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { InventoryItem, Supplier } from '@/pages/ipad_inventory/types';

export const useInventoryData = (businessId?: string) => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!businessId) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Suppliers
            const { data: suppliersData, error: supError } = await supabase
                .from('suppliers')
                .select('*')
                .eq('business_id', businessId)
                .order('name');
            if (supError) throw supError;
            setSuppliers(suppliersData || []);

            // 2. Fetch Inventory Items
            const { data: itemsRaw, error: itemError } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('business_id', businessId)
                .order('name');
            if (itemError) throw itemError;

            // Map DB columns to Frontend Interface if needed
            // (Handle schema drift: low_stock_threshold_units vs low_stock_alert)
            const itemsData = (itemsRaw || []).map((i: any) => ({
                ...i,
                low_stock_threshold_units: i.low_stock_threshold_units ?? i.low_stock_alert ?? 0
            }));

            // 3. Fetch Menu Items that need inventory tracking
            const { data: menuItemsData, error: menuError } = await supabase
                .from('menu_items')
                .select('*')
                .eq('business_id', businessId);

            if (menuError) {
                console.warn('Error fetching menu items for inventory:', menuError);
            }

            // 4. Create a map of menu item IDs that need inventory tracking
            // First, let's see what ALL menu items have in their inventory_settings
            (menuItemsData || []).forEach((i: any) => {
                if (i.inventory_settings) {
                    console.log(`📦 ${i.name}:`, JSON.stringify(i.inventory_settings, null, 2));
                }
            });

            // Filter for items that have inventory_settings with actual tracking enabled
            // NOT preparationMode (that's for KDS only!)
            const trackedMenuItems = (menuItemsData || []).filter((item: any) => {
                const settings = item.inventory_settings;

                // Check if settings exists, is an object, and is NOT empty
                if (!settings || typeof settings !== 'object') return false;

                // If it only has preparationMode and nothing else, it's NOT inventory tracking
                const keys = Object.keys(settings);
                if (keys.length === 0) return false;

                // If the ONLY key is preparationMode, this is KDS only, not inventory
                if (keys.length === 1 && keys[0] === 'preparationMode') return false;

                // Otherwise, it has inventory settings
                return true;
            });

            console.log('🔍 Filtered Tracked Items:', {
                totalMenuItems: menuItemsData?.length || 0,
                itemsWithInventorySettings: trackedMenuItems.length,
                trackedNames: trackedMenuItems.map((i: any) => i.name)
            });

            const trackedMenuItemIds = new Set(trackedMenuItems.map((item: any) => item.id));

            // 5. Update existing inventory items to mark them as 'prep' if their menu item is tracked
            const updatedInventoryItems = (itemsData || []).map(item => {
                // If this inventory item is linked to a tracked menu item, ensure it has prep category
                if (item.catalog_item_id && trackedMenuItemIds.has(item.catalog_item_id)) {
                    const currentCategory = item.category || '';
                    if (!currentCategory.includes('prep')) {
                        return {
                            ...item,
                            category: currentCategory ? `${currentCategory},prep` : 'prep'
                        };
                    }
                }
                return item;
            });

            // 6. Create virtual inventory items ONLY for tracked menu items that don't have inventory records
            const virtualItems: InventoryItem[] = [];

            trackedMenuItems.forEach((menuItem: any) => {
                // Check if this menu item already has an inventory record
                const existingInvItem = updatedInventoryItems.find(
                    inv => inv.catalog_item_id === menuItem.id || inv.id === menuItem.id
                );

                if (!existingInvItem) {
                    // Create virtual inventory item with 0 stock
                    virtualItems.push({
                        id: menuItem.id,
                        name: menuItem.name,
                        unit: menuItem.unit || 'יחידה',
                        current_stock: 0,
                        low_stock_threshold_units: 0,
                        supplier_id: null,
                        category: 'prep', // Mark as prep category so it shows in prepared items
                        catalog_item_id: menuItem.id,
                        count_step: 1,
                        last_counted_at: undefined,
                    });
                }
            });

            // 7. Combine real inventory items with virtual ones
            const allItems = [...updatedInventoryItems, ...virtualItems];
            setItems(allItems);
        } catch (err: any) {
            console.error('Error fetching inventory data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [businessId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { items, suppliers, loading, error, refresh: fetchData };
};
