// 🆕 Triple-Check Functions for KDS Inventory
// Copy these functions into KDSInventoryScreen.jsx after executeDeleteOrder()

// Initialize Triple-Check Session from OCR Results
const initializeReceivingSession = useCallback((ocrData, orderId = null, supplierId = null) => {
    if (!ocrData?.items) return;

    const sessionItems = ocrData.items.map(ocrItem => {
        const name = ocrItem.name || ocrItem.description || 'פריט ללא שם';
        const invoicedQty = ocrItem.quantity || ocrItem.amount || 0;
        const unitPrice = ocrItem.price || ocrItem.cost_per_unit || 0;

        // Try to match with existing inventory item
        const matchedItem = items.find(inv =>
            inv.name.toLowerCase() === name.toLowerCase() ||
            inv.name.includes(name) ||
            name.includes(inv.name)
        );

        return {
            id: ocrItem.id || `temp-${Date.now()}-${Math.random()}`,
            name,
            unit: ocrItem.unit || matchedItem?.unit || 'יח׳',
            invoicedQty,
            actualQty: invoicedQty,
            unitPrice,
            countStep: matchedItem?.count_step || 1,
            inventoryItemId: matchedItem?.id || null,
            isNew: !matchedItem,
            matchedItem
        };
    });

    setReceivingSession({
        items: sessionItems,
        orderId,
        supplierId,
        totalInvoiced: ocrData.total_amount || sessionItems.reduce((sum, i) => sum + (i.invoicedQty * i.unitPrice), 0)
    });
}, [items]);

// Update Actual Quantity in Receiving Session
const updateActualQuantity = useCallback((itemId, newQty) => {
    setReceivingSession(prev => {
        if (!prev) return prev;
        return {
            ...prev,
            items: prev.items.map(item =>
                item.id === itemId ? { ...item, actualQty: newQty } : item
            )
        };
    });
}, []);

// Confirm Receipt - Call RPC
const confirmReceipt = async () => {
    if (!receivingSession || !currentUser?.business_id) return;

    setIsConfirmingReceipt(true);
    try {
        const rpcItems = receivingSession.items
            .filter(item => item.inventoryItemId)
            .map(item => ({
                inventory_item_id: item.inventoryItemId,
                actual_qty: item.actualQty,
                invoiced_qty: item.invoicedQty,
                unit_price: item.unitPrice
            }));

        const { data, error } = await supabase.rpc('receive_inventory_shipment', {
            p_items: rpcItems,
            p_order_id: receivingSession.orderId,
            p_supplier_id: receivingSession.supplierId,
            p_notes: null,
            p_business_id: currentUser.business_id
        });

        if (error) throw error;

        if (data?.success) {
            console.log('✅ Receipt confirmed:', data);
            setReceivingSession(null);
            setShowScannerModal(false);
            setScannerStep('choose');
            resetOCR();
            await fetchData();
            await fetchIncomingOrders();
            alert(`✅ קבלה אושרה! ${data.items_processed} פריטים עודכנו`);
        } else {
            throw new Error(data?.error || 'Unknown error');
        }
    } catch (err) {
        console.error('Error confirming receipt:', err);
        alert('שגיאה באישור הקבלה: ' + err.message);
    } finally {
        setIsConfirmingReceipt(false);
    }
};

// Handle Image Upload for OCR
const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScannerStep('scanning');
    try {
        await scanInvoice(file, currentUser?.business_id);
        setScannerStep('results');
    } catch (err) {
        console.error('Scan failed:', err);
        setScannerStep('choose');
        alert('שגיאה בסריקה: ' + err.message);
    }
};
