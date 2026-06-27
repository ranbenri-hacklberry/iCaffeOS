import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Check, AlertTriangle } from 'lucide-react';

const MotionDiv = motion.div as any;
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

// Hooks
import { useInventoryData } from '@/pages/ipad_inventory/hooks/useInventoryData';
import { useStockUpdates } from '@/pages/ipad_inventory/hooks/useStockUpdates';
import { useIncomingOrders } from '@/pages/ipad_inventory/hooks/useIncomingOrders';
import { useTripleCheckSession } from '@/pages/ipad_inventory/hooks/useTripleCheckSession';
import { useInvoiceOCR } from '@/pages/ipad_inventory/hooks/useInvoiceOCR';

// Components
import InventoryHeader from '@/pages/ipad_inventory/components/InventoryHeader';
import SuppliersList from '@/pages/ipad_inventory/components/SuppliersList';
import InventoryItemsGrid from '@/pages/ipad_inventory/components/InventoryItemsGrid';
import PreparedItemsView from '@/pages/ipad_inventory/components/PreparedItemsView';
import IncomingOrdersList from '@/pages/ipad_inventory/components/IncomingOrdersList';
import IncomingOrdersSidebar from '@/pages/ipad_inventory/components/IncomingOrdersSidebar';
import TripleCheckSession from '@/pages/ipad_inventory/components/TripleCheckSession';
import LowStockReportModal from '@/pages/ipad_inventory/components/LowStockReportModal';
import { IncomingOrder } from '@/pages/ipad_inventory/types';

interface IPadInventoryProps {
    onExit: () => void;
}

export const IPadInventory: React.FC<IPadInventoryProps> = ({ onExit }) => {
    const { currentUser } = useAuth();
    const businessId = currentUser?.business_id;

    // View State
    const [activeTab, setActiveTab] = useState<'counts' | 'shipping'>('counts');
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>('prepared');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [stockDeltas, setStockDeltas] = useState<Record<string, number>>({});
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Data Hooks
    const { items, suppliers, loading: dataLoading, refresh: refreshData } = useInventoryData(businessId);
    const { updateStock } = useStockUpdates();
    const { orders, loading: ordersLoading, refresh: refreshOrders } = useIncomingOrders(businessId);
    const { scanInvoice, isProcessing: isScanning } = useInvoiceOCR();
    const {
        session,
        initializeSession,
        initializeFromOrder,
        updateActualQty,
        updateMatchedItem,
        updateCaseQuantity,
        confirmReceipt,
        clearSession,
        isConfirming
    } = useTripleCheckSession(items, businessId);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Computed
    const shortagesCount = useMemo(() => {
        return items.filter(item => {
            const wpu = parseFloat(item.weight_per_unit as any) || 0;
            const thresholdGrams = (parseFloat(item.low_stock_threshold_units as any) || 0) * (wpu || 1);
            return thresholdGrams > 0 && item.current_stock <= thresholdGrams;
        }).length;
    }, [items]);

    const supplierCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        items.forEach(item => {
            const id = String(item.supplier_id || 'uncategorized');
            counts[id] = (counts[id] || 0) + 1;
        });
        // Count prepared (this is usually dynamic or from menu_items, but for now we mirror ItemsGrid logic)
        counts['prepared'] = items.filter(i => i.category?.includes('prep')).length;
        return counts;
    }, [items]);

    const filteredItems = useMemo(() => {
        if (!selectedSupplierId) return [];
        return items.filter(i => {
            if (selectedSupplierId === 'prepared') return i.category?.includes('prep');
            const supId = String(i.supplier_id || 'uncategorized');
            return supId === String(selectedSupplierId);
        });
    }, [items, selectedSupplierId]);

    // Handlers
    const handleStartScan = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const result = await scanInvoice(file, businessId);
        if (result) {
            initializeSession(result);
        }
    };

    const handleConfirmReceipt = async () => {
        if (session) {
            const unmatchedCount = session.items.filter(item => !item.inventoryItemId && item.actualQty > 0).length;
            if (unmatchedCount > 0) {
                const confirmSave = window.confirm(
                    `שים לב: ישנם ${unmatchedCount} פריטים בחשבונית שלא שויכו למלאי. פריטים אלו לא יעודכנו במלאי.\n\nהאם להמשיך בשמירה?`
                );
                if (!confirmSave) return;
            }
        }

        const result = await confirmReceipt();
        if (result.success) {
            refreshData();
            refreshOrders();
            showToast('קבלת הסחורה עודכנה בהצלחה במלאי!');
        } else {
            showToast('שגיאה בעדכון המלאי: ' + result.error, 'error');
        }
    };

    const handleCreateNewItem = async (itemId: string, name: string, unit: string) => {
        if (!businessId) {
            showToast('שגיאה: מזהה עסק חסר', 'error');
            return;
        }

        // Prompt the user to edit the item name before creation
        const editedName = window.prompt(
            'הקמת מוצר חדש במלאי:\nאנא הזן את שם המוצר כפי שיופיע במלאי שלכם:',
            name
        );
        if (editedName === null) return; // User cancelled
        const finalName = editedName.trim();
        if (!finalName) {
            showToast('שם המוצר אינו יכול להיות ריק', 'error');
            return;
        }

        const supplierId = session?.supplierId;
        const parsedSupplierId = (supplierId && !isNaN(Number(supplierId))) ? Number(supplierId) : null;

        try {
            // Determine category from existing items of this supplier, default to 'ירקות'
            const existingCategories = items
                .filter(i => parsedSupplierId && String(i.supplier_id) === String(parsedSupplierId))
                .map(i => i.category);
            const category = existingCategories[0] || 'ירקות';

            const { data, error } = await supabase
                .from('inventory_items')
                .insert({
                    name: finalName,
                    unit: unit === 'ק"ג' ? 'יח׳' : (unit || 'יח׳'),
                    category: category,
                    current_stock: 0,
                    business_id: businessId,
                    supplier_id: parsedSupplierId,
                    weight_per_unit: unit === 'ק"ג' ? 150 : 0,
                    count_step: 1
                })
                .select()
                .single();

            if (error) throw error;

            // Map the row in the triple check session to this new item
            updateMatchedItem(itemId, data.id);

            // Refresh inventory items so the new item is loaded in the cache/UI
            refreshData();

            showToast(`המוצר "${name}" נוצר בהצלחה במלאי!`);
        } catch (err: any) {
            console.error('Error creating inventory item:', err);
            showToast('שגיאה ביצירת המוצר: ' + err.message, 'error');
        }
    };

    const handleStockDelta = (itemId: string, newStock: number) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const newStockClamped = Math.max(0, newStock);

        // Update the actual stock via the hook
        updateStock(itemId, newStockClamped);

        // Track the delta for the modal
        setStockDeltas(prev => ({
            ...prev,
            [itemId]: newStockClamped
        }));
    };

    return (
        <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden font-heebo" dir="rtl">
            <InventoryHeader
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onExit={onExit}
                onShowReport={() => setShowReportModal(true)}
                shortagesCount={shortagesCount}
            />

            <main className="flex-1 flex overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === 'counts' ? (
                        <MotionDiv
                            key="counts"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex h-full relative"
                        >
                            {/* Desktop Sidebar */}
                            <div className="hidden md:block">
                                <SuppliersList
                                    suppliers={suppliers}
                                    selectedSupplierId={selectedSupplierId}
                                    onSelectSupplier={setSelectedSupplierId}
                                    supplierCounts={supplierCounts}
                                />
                            </div>

                            {/* Mobile Sidebar (Overlay/Drawer) */}
                            <AnimatePresence>
                                {showMobileSidebar && (
                                    <>
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setShowMobileSidebar(false)}
                                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] md:hidden"
                                        />
                                        <motion.div 
                                            initial={{ x: '100%' }}
                                            animate={{ x: 0 }}
                                            exit={{ x: '100%' }}
                                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                            className="fixed inset-y-0 right-0 w-80 bg-white z-[101] shadow-2xl md:hidden"
                                        >
                                            <SuppliersList
                                                suppliers={suppliers}
                                                selectedSupplierId={selectedSupplierId}
                                                onSelectSupplier={(id) => {
                                                    setSelectedSupplierId(id);
                                                    setShowMobileSidebar(false);
                                                }}
                                                supplierCounts={supplierCounts}
                                            />
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>

                            {/* Mobile Sidebar Toggle Button */}
                            <button 
                                onClick={() => setShowMobileSidebar(true)}
                                className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 md:hidden active:scale-90 transition-transform"
                            >
                                <Package size={24} />
                            </button>

                            {selectedSupplierId === 'prepared' ? (
                                <PreparedItemsView
                                    items={filteredItems}
                                    onUpdateStock={updateStock}
                                    isLoading={dataLoading}
                                />
                            ) : (
                                <InventoryItemsGrid
                                    items={filteredItems}
                                    onUpdateStock={updateStock}
                                    isLoading={dataLoading}
                                />
                            )}
                        </MotionDiv>
                    ) : (
                        <MotionDiv
                            key="shipping"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex-1 flex h-full"
                        >
                            <IncomingOrdersSidebar
                                orders={orders}
                                selectedOrderId={selectedOrderId}
                                onSelectOrder={(orderId) => {
                                    setSelectedOrderId(orderId);
                                    const order = orders.find(o => String(o.id) === orderId);
                                    if (order) initializeFromOrder(order);
                                }}
                                isLoading={ordersLoading}
                                onScanInvoice={async (file) => {
                                    const result = await scanInvoice(file, businessId);
                                    if (result) {
                                        setSelectedOrderId(null);
                                        initializeSession(result);
                                    }
                                }}
                                isScanning={isScanning}
                            />

                            {session ? (
                                <div className="flex-1 h-full bg-slate-50 relative">
                                    <TripleCheckSession
                                        session={session}
                                        items={items}
                                        onUpdateQty={updateActualQty}
                                        onMapItem={updateMatchedItem}
                                        onUpdateCaseQuantity={updateCaseQuantity}
                                        onCreateNewItem={handleCreateNewItem}
                                        onConfirm={handleConfirmReceipt}
                                        onCancel={() => {
                                            clearSession();
                                            setSelectedOrderId(null);
                                        }}
                                        isSubmitting={isConfirming}
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 h-full flex flex-col items-center justify-center text-slate-300 gap-6 bg-slate-50">
                                    <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                                        <Package size={64} />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-2xl font-black text-slate-400 block mb-2">קבלת סחורה</span>
                                        <span className="text-slate-400 font-bold">סרוק חשבונית או בחר הזמנה מהרשימה</span>
                                    </div>
                                </div>
                            )}
                        </MotionDiv>
                    )}
                </AnimatePresence>
            </main>

            {/* Overlays - Only show TripleCheck as overlay for counts tab, not for shipping (it's inline there) */}
            <AnimatePresence>
                {session && activeTab === 'counts' && (
                    <TripleCheckSession
                        session={session}
                        items={items}
                        onUpdateQty={updateActualQty}
                        onMapItem={updateMatchedItem}
                        onUpdateCaseQuantity={updateCaseQuantity}
                        onCreateNewItem={handleCreateNewItem}
                        onConfirm={handleConfirmReceipt}
                        onCancel={clearSession}
                        isSubmitting={isConfirming}
                    />
                )}

                {isScanning && (
                    <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-indigo-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-slate-900 mb-2">קורא חשבונית...</h3>
                            <p className="text-slate-500 font-bold italic">ה-AI שלנו מנתח את הפריטים והכמויות</p>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Low Stock Report Modal */}
            <LowStockReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                items={items}
                currentStocks={stockDeltas}
                onUpdateStock={handleStockDelta}
            />

            {/* Custom Toast Alert */}
            {toast && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 ${
                    toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900/95 backdrop-blur-md'
                } text-white font-bold border border-white/10`}>
                    {toast.type === 'error' ? <AlertTriangle size={24} /> : <Check size={24} className="text-emerald-400" />}
                    <span className="text-lg">{toast.message}</span>
                </div>
            )}

            {/* Hidden Inputs */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
            />
        </div>
    );
};

export default IPadInventory;
