import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { InventoryItem, ReceivingSession, ReceivingSessionItem } from '@/pages/ipad_inventory/types';

const parseCaseQuantityFromName = (name: string, matchedItem: any) => {
    let caseQuantity = matchedItem?.case_quantity || 1;
    if (caseQuantity === 1 && matchedItem && (matchedItem.unit === 'יח׳' || matchedItem.unit === 'יחידה' || matchedItem.unit === 'יח') && !(Number(matchedItem.weight_per_unit) > 0)) {
        const parsedCaseMatch = name.match(/\b(?:l|m)?(\d{1,2})\b/i);
        if (parsedCaseMatch) {
            const parsedVal = parseInt(parsedCaseMatch[1]);
            if (parsedVal > 1) {
                caseQuantity = parsedVal;
            }
        }
    }
    return caseQuantity;
};

export const useTripleCheckSession = (items: InventoryItem[], businessId?: string) => {
    const [session, setSession] = useState<ReceivingSession | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const initializeSession = useCallback((ocrData: any, orderId: string | null = null, supplierId: string | null = null) => {
        if (!ocrData) return;

        const itemsList = ocrData.items || [];
        const unmatchedList = ocrData.unmatched_items || [];

        const sessionItems: ReceivingSessionItem[] = [
            ...itemsList.map((ocrItem: any) => {
                const name = ocrItem.name || ocrItem.description || 'פריט ללא שם';
                const invoicedQty = Number(ocrItem.quantity || ocrItem.amount || 0);
                const unitPrice = Number(ocrItem.price || ocrItem.cost_per_unit || 0);

                const matchedItem = items.find(inv =>
                    inv.id === ocrItem.inventory_item_id ||
                    inv.name.toLowerCase() === name.toLowerCase() ||
                    inv.name.includes(name) ||
                    name.includes(inv.name) ||
                    (Array.isArray(inv.supplier_product_name) && inv.supplier_product_name.some((alias: string) => 
                        alias.toLowerCase().trim() === name.toLowerCase().trim()
                    ))
                );

                return {
                    id: ocrItem.id || `temp-${Date.now()}-${Math.random()}`,
                    name,
                    unit: ocrItem.unit || matchedItem?.unit || 'יח׳',
                    invoicedQty: invoicedQty,
                    orderedQty: invoicedQty,
                    actualQty: invoicedQty,
                    unitPrice,
                    countStep: matchedItem?.count_step || 1,
                    inventoryItemId: ocrItem.inventory_item_id || matchedItem?.id || null,
                    catalogItemId: matchedItem?.catalog_item_id || null,
                    isNew: !matchedItem,
                    matchedItem,
                    caseQuantity: parseCaseQuantityFromName(name, matchedItem),
                    checked: true
                };
            }),
            ...unmatchedList.map((ocrItem: any) => {
                const name = ocrItem.raw_name || ocrItem.name || 'פריט חדש';
                const invoicedQty = Number(ocrItem.quantity || ocrItem.amount || 0);
                const unitPrice = Number(ocrItem.price || ocrItem.cost_per_unit || 0);

                const matchedItem = items.find(inv =>
                    inv.name.toLowerCase() === name.toLowerCase() ||
                    inv.name.includes(name) ||
                    name.includes(inv.name) ||
                    (Array.isArray(inv.supplier_product_name) && inv.supplier_product_name.some((alias: string) => 
                        alias.toLowerCase().trim() === name.toLowerCase().trim()
                    ))
                );

                return {
                    id: ocrItem.id || `temp-unmatched-${Date.now()}-${Math.random()}`,
                    name,
                    unit: ocrItem.unit || matchedItem?.unit || 'יח׳',
                    invoicedQty: invoicedQty,
                    orderedQty: invoicedQty,
                    actualQty: invoicedQty,
                    unitPrice,
                    countStep: matchedItem?.count_step || 1,
                    inventoryItemId: matchedItem?.id || null,
                    catalogItemId: matchedItem?.catalog_item_id || null,
                    isNew: !matchedItem,
                    matchedItem,
                    caseQuantity: parseCaseQuantityFromName(name, matchedItem),
                    checked: true
                };
            })
        ];

        setSession({
            items: sessionItems,
            orderId,
            supplierId: supplierId || ocrData.supplier_id || null,
            hasInvoice: true,
            totalInvoiced: ocrData.total_amount || sessionItems.reduce((sum, i) => sum + ((i.invoicedQty || 0) * i.unitPrice), 0)
        });
    }, [items]);

    const initializeFromOrder = useCallback((order: any) => {
        if (!order?.items) return;

        const sessionItems: ReceivingSessionItem[] = order.items.map((orderItem: any, idx: number) => {
            const matchedItem = items.find(inv =>
                (orderItem.inventory_item_id && String(inv.id) === String(orderItem.inventory_item_id)) ||
                inv.name.toLowerCase() === (orderItem.name || '').toLowerCase()
            );

            const orderedQty = Number(orderItem.ordered_qty ?? orderItem.qty ?? orderItem.quantity ?? 0);
            const unitPrice = Number(orderItem.unit_price ?? orderItem.price ?? matchedItem?.cost_per_unit ?? 0);

            return {
                id: orderItem.id ? String(orderItem.id) : `order-item-${idx}-${Date.now()}`,
                name: orderItem.name || matchedItem?.name || 'פריט ללא שם',
                unit: orderItem.unit || matchedItem?.unit || 'יח׳',
                invoicedQty: orderedQty, // Default to ordered quantity
                orderedQty: orderedQty,
                actualQty: orderedQty,   // Default to ordered quantity
                unitPrice: unitPrice,
                countStep: matchedItem?.count_step || 1,
                inventoryItemId: matchedItem?.id || (orderItem.inventory_item_id ? String(orderItem.inventory_item_id) : null),
                catalogItemId: matchedItem?.catalog_item_id || null,
                isNew: !matchedItem,
                matchedItem,
                checked: true
            };
        });

        setSession({
            items: sessionItems,
            orderId: order.id ? String(order.id) : null,
            supplierId: order.supplier_id ? String(order.supplier_id) : null,
            supplierName: order.supplier_name,
            hasInvoice: false,
            totalInvoiced: sessionItems.reduce((sum, i) => sum + (i.orderedQty * i.unitPrice), 0)
        });
    }, [items]);

    const updateActualQty = (itemId: string, newQty: number) => {
        setSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                items: prev.items.map(item =>
                    item.id === itemId ? { ...item, actualQty: Math.max(0, newQty) } : item
                )
            };
        });
    };

    const updateInvoicedQty = (itemId: string, newQty: number) => {
        setSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                items: prev.items.map(item =>
                    item.id === itemId ? { ...item, invoicedQty: Math.max(0, newQty) } : item
                )
            };
        });
    };

    const toggleItemChecked = (itemId: string) => {
        setSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                items: prev.items.map(item =>
                    item.id === itemId ? { ...item, checked: !(item.checked ?? true) } : item
                )
            };
        });
    };

    const toggleAllChecked = (forceState?: boolean) => {
        setSession(prev => {
            if (!prev) return null;
            const targetState = forceState !== undefined 
                ? forceState 
                : !prev.items.every(i => i.checked !== false);
            return {
                ...prev,
                items: prev.items.map(item => ({
                    ...item,
                    checked: targetState
                }))
            };
        });
    };

    const confirmReceipt = async () => {
        if (!session || !businessId) return { success: false, error: 'No session' };

        setIsConfirming(true);
        try {
            const rpcItems = session.items
                .filter(item => (item.checked !== false) && item.actualQty > 0)
                .map(item => {
                    let actualQty = item.actualQty;
                    let invoicedQty = item.invoicedQty ?? item.actualQty;
                    let unitPrice = item.unitPrice;

                    const dbUnit = item.matchedItem?.unit;
                    let wpu = parseFloat(item.matchedItem?.weight_per_unit as any) || 0;
                    if (wpu === 0 && dbUnit === 'גרם') {
                        const nameLower = (item.name || '').toLowerCase();
                        const matchGrams = nameLower.match(/(\d+)\s*(?:ג|g)\b/);
                        if (matchGrams) {
                            wpu = parseFloat(matchGrams[1]);
                        } else {
                            const matchKg = nameLower.match(/(\d+(?:\.\d+)?)\s*(?:ק"ג|קג|kg)\b/);
                            if (matchKg) {
                                wpu = parseFloat(matchKg[1]) * 1000;
                            }
                        }
                    }

                    const invUnit = (item.unit || '').toLowerCase().trim();
                    const isKg = invUnit.includes('קג') || invUnit.includes('ק"ג') || invUnit.includes('kg');
                    const isUnit = invUnit.includes('יח') || invUnit.includes('יחיד') || invUnit.includes('unit') || invUnit.includes('מארז') || invUnit.includes('קופס');

                    if (dbUnit === 'גרם') {
                        if (isKg) {
                            actualQty = actualQty * 1000;
                            invoicedQty = invoicedQty * 1000;
                            unitPrice = unitPrice / 1000;
                        } else if (isUnit && wpu > 0) {
                            actualQty = actualQty * wpu;
                            invoicedQty = invoicedQty * wpu;
                            unitPrice = unitPrice / wpu;
                        }
                    } else if (dbUnit === 'יח׳' || dbUnit === 'יחידה' || dbUnit === 'יח') {
                        if (isKg && wpu > 0) {
                            actualQty = Math.round(actualQty * (1000 / wpu));
                            invoicedQty = Math.round(invoicedQty * (1000 / wpu));
                            unitPrice = unitPrice * (wpu / 1000);
                        } else {
                            const caseQty = parseInt(item.matchedItem?.case_quantity as any) || 1;
                            if (caseQty > 1) {
                                actualQty = actualQty * caseQty;
                                invoicedQty = invoicedQty * caseQty;
                                unitPrice = unitPrice / caseQty;
                            }
                        }
                    }

                    return {
                        inventory_item_id: item.inventoryItemId || (item.matchedItem?.id ? String(item.matchedItem.id) : null),
                        catalog_item_id: item.catalogItemId || null,
                        actual_qty: actualQty,
                        invoiced_qty: invoicedQty,
                        unit_price: unitPrice
                    };
                });

            const parsedOrderId = session.orderId ? parseInt(String(session.orderId)) : null;

            const { data, error } = await supabase.rpc('receive_inventory_shipment', {
                p_items: rpcItems,
                p_order_id: parsedOrderId,
                p_supplier_id: session.supplierId ? String(session.supplierId) : null,
                p_notes: null,
                p_business_id: businessId
            });

            if (error) throw error;

            setSession(null);
            return { success: true, data };
        } catch (err: any) {
            console.error('Error confirming receipt:', err);
            return { success: false, error: err.message };
        } finally {
            setIsConfirming(false);
        }
    };

    const updateMatchedItem = useCallback((itemId: string, inventoryItemId: string | number) => {
        setSession(prev => {
            if (!prev) return null;
            const targetInvItem = items.find(inv => String(inv.id) === String(inventoryItemId));
            return {
                ...prev,
                items: prev.items.map(item =>
                    item.id === itemId
                        ? {
                              ...item,
                              inventoryItemId: String(inventoryItemId),
                              catalogItemId: targetInvItem?.catalog_item_id || null,
                              matchedItem: targetInvItem,
                              isNew: false,
                              caseQuantity: targetInvItem?.case_quantity || 1
                          }
                        : item
                )
            };
        });
    }, [items]);

    const updateCaseQuantity = useCallback((itemId: string, caseQty: number) => {
        setSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                items: prev.items.map(item =>
                    item.id === itemId
                        ? { ...item, caseQuantity: Math.max(1, caseQty) }
                        : item
                )
            };
        });
    }, []);

    return {
        session,
        isConfirming,
        initializeSession,
        initializeFromOrder,
        updateActualQty,
        updateInvoicedQty,
        toggleItemChecked,
        toggleAllChecked,
        updateMatchedItem,
        updateCaseQuantity,
        confirmReceipt,
        clearSession: () => setSession(null)
    };
};

