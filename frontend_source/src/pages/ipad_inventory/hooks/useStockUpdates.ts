import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export const useStockUpdates = () => {
    const [isUpdating, setIsUpdating] = useState(false);

    const updateStock = async (itemId: string, newStock: number, userId?: string, source: string = 'manual') => {
        setIsUpdating(true);
        try {
            const { data, error } = await supabase.rpc('update_inventory_stock', {
                p_item_id: String(itemId),
                p_new_stock: newStock,
                p_counted_by: userId || null,
                p_source: source
            });

            if (error) {
                console.warn('RPC update_inventory_stock failed, falling back to direct table update:', error);
                const { error: directErr } = await supabase
                    .from('inventory_items')
                    .update({
                        current_stock: newStock,
                        last_counted_at: new Date().toISOString(),
                        last_updated: new Date().toISOString()
                    })
                    .eq('id', itemId);
                if (directErr) throw directErr;
            }
            return { success: true, data };
        } catch (err: any) {
            console.error('Error updating stock:', err);
            return { success: false, error: err.message };
        } finally {
            setIsUpdating(false);
        }
    };

    return { updateStock, isUpdating };
};
