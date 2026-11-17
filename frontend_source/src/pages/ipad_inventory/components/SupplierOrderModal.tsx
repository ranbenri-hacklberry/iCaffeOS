import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Copy, Check, Plus, Minus, AlertCircle, ShoppingBag, Package, Calendar, Clock, DollarSign, ChevronDown, Trash2 } from 'lucide-react';
import { InventoryItem, Supplier, IncomingOrder } from '@/pages/ipad_inventory/types';
import { getPackagingLevels, convertFromBase, convertToBase } from '@/pages/ipad_inventory/utils/packagingUtils';
import { sendSms } from '@/services/smsService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const MotionDiv = motion.div as any;

interface OrderItemRow {
    item: InventoryItem;
    currentStock: number;
    targetStock: number;
    onOrderQty: number;
    orderQty: number; // in base units
    selected: boolean;
    caseQty: number;
    unitName: string;
    caseName: string;
    costPerUnit: number;
}

interface SupplierOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier | null;
    items: InventoryItem[];
    incomingOrders?: IncomingOrder[];
    businessName?: string;
    onOrderCreated?: () => void;
}

export const SupplierOrderModal: React.FC<SupplierOrderModalProps> = ({
    isOpen,
    onClose,
    supplier,
    items,
    incomingOrders = [],
    businessName = 'עגלת קפה',
    onOrderCreated
}) => {
    const { currentUser } = useAuth();
    const businessId = currentUser?.business_id;

    const [orderRows, setOrderRows] = useState<OrderItemRow[]>([]);
    const [deliveryDateNote, setDeliveryDateNote] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [copied, setCopied] = useState(false);
    const [sendingSms, setSendingSms] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);
    const [selectedAdditionalItemId, setSelectedAdditionalItemId] = useState<string>('');

    // Calculate on-order pending quantities per inventory item from incoming orders
    const pendingOnOrderMap = useMemo(() => {
        const map: Record<string, number> = {};
        incomingOrders.forEach(order => {
            (order.items || []).forEach((oi: any) => {
                const itemId = String(oi.inventory_item_id || oi.id || '');
                const qty = Number(oi.ordered_quantity_units || oi.quantity || oi.qty || 0);
                if (itemId && qty > 0) {
                    map[itemId] = (map[itemId] || 0) + qty;
                }
            });
        });
        return map;
    }, [incomingOrders]);

    // Initialize rows when modal opens or supplier changes
    useEffect(() => {
        if (!isOpen || !supplier) {
            setOrderRows([]);
            return;
        }

        // Filter items for this supplier
        const supplierItems = items.filter(i => String(i.supplier_id) === String(supplier.id));

        const rows: OrderItemRow[] = supplierItems.map(item => {
            const { levels } = getPackagingLevels(item);
            const baseLevel = levels[0] || { name: item.unit || 'יח׳', qty: 1 };
            const caseLevel = levels.length > 1 ? levels[levels.length - 1] : baseLevel;
            const caseQty = caseLevel.qty || item.case_quantity || 1;

            const currentStock = Number(item.current_stock) || 0;
            const targetStock = Number(item.target_stock) || 0;
            const onOrderQty = pendingOnOrderMap[String(item.id)] || 0;

            // Formula: needed = max(0, target - (current + onOrder))
            const rawNeeded = Math.max(0, targetStock - (currentStock + onOrderQty));

            // Round up to full case if caseQty > 1 and rawNeeded > 0
            let suggestedOrderQty = rawNeeded;
            if (caseQty > 1 && rawNeeded > 0) {
                const cases = Math.ceil(rawNeeded / caseQty);
                suggestedOrderQty = cases * caseQty;
            }

            return {
                item,
                currentStock,
                targetStock,
                onOrderQty,
                orderQty: suggestedOrderQty,
                selected: suggestedOrderQty > 0 || (targetStock > 0 && currentStock < targetStock),
                caseQty,
                unitName: baseLevel.name || item.unit || 'יח׳',
                caseName: caseLevel.name || 'ארגז',
                costPerUnit: Number(item.cost_per_unit) || 0
            };
        });

        // Sort: items needing order first, then alphabetical
        rows.sort((a, b) => {
            if (a.selected !== b.selected) return a.selected ? -1 : 1;
            return a.item.name.localeCompare(b.item.name);
        });

        setOrderRows(rows);

        // Pre-fill delivery day note if available in supplier schedule
        const schedule = (supplier as any).schedule || [];
        const today = new Date().getDay();
        const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        const nextDelivery = schedule.find((s: any) => s.day >= today) || schedule[0];
        if (nextDelivery) {
            setDeliveryDateNote(`ליום ${DAY_NAMES[nextDelivery.day]}`);
        } else {
            setDeliveryDateNote('');
        }
        setActionSuccess(null);
    }, [isOpen, supplier, items, pendingOnOrderMap]);

    // Items of this supplier not yet in the active rows
    const availableAdditionalItems = useMemo(() => {
        if (!supplier) return [];
        const currentIds = new Set(orderRows.map(r => String(r.item.id)));
        return items.filter(i => String(i.supplier_id) === String(supplier.id) && !currentIds.has(String(i.id)));
    }, [supplier, items, orderRows]);

    const handleQuantityChange = (itemId: string, newQty: number) => {
        setOrderRows(prev => prev.map(row => {
            if (String(row.item.id) !== String(itemId)) return row;
            const clamped = Math.max(0, newQty);
            return {
                ...row,
                orderQty: clamped,
                selected: clamped > 0 ? true : row.selected
            };
        }));
    };

    const handleCaseStep = (itemId: string, direction: 1 | -1) => {
        setOrderRows(prev => prev.map(row => {
            if (String(row.item.id) !== String(itemId)) return row;
            const step = row.caseQty > 1 ? row.caseQty : 1;
            const next = Math.max(0, row.orderQty + (direction * step));
            return {
                ...row,
                orderQty: next,
                selected: next > 0 ? true : row.selected
            };
        }));
    };

    const handleToggleSelect = (itemId: string) => {
        setOrderRows(prev => prev.map(row => {
            if (String(row.item.id) !== String(itemId)) return row;
            const nextSelected = !row.selected;
            return {
                ...row,
                selected: nextSelected,
                orderQty: nextSelected && row.orderQty === 0 ? (row.caseQty > 1 ? row.caseQty : 1) : row.orderQty
            };
        }));
    };

    const handleAddAdditionalItem = () => {
        if (!selectedAdditionalItemId) return;
        const item = items.find(i => String(i.id) === String(selectedAdditionalItemId));
        if (!item) return;

        const { levels } = getPackagingLevels(item);
        const baseLevel = levels[0] || { name: item.unit || 'יח׳', qty: 1 };
        const caseLevel = levels.length > 1 ? levels[levels.length - 1] : baseLevel;
        const caseQty = caseLevel.qty || item.case_quantity || 1;

        const newRow: OrderItemRow = {
            item,
            currentStock: Number(item.current_stock) || 0,
            targetStock: Number(item.target_stock) || 0,
            onOrderQty: pendingOnOrderMap[String(item.id)] || 0,
            orderQty: caseQty > 1 ? caseQty : 1,
            selected: true,
            caseQty,
            unitName: baseLevel.name || item.unit || 'יח׳',
            caseName: caseLevel.name || 'ארגז',
            costPerUnit: Number(item.cost_per_unit) || 0
        };

        setOrderRows(prev => [newRow, ...prev]);
        setSelectedAdditionalItemId('');
    };

    // Calculate totals
    const selectedRows = useMemo(() => {
        return orderRows.filter(r => r.selected && r.orderQty > 0);
    }, [orderRows]);

    const estimatedTotalCost = useMemo(() => {
        return selectedRows.reduce((sum, r) => sum + (r.orderQty * r.costPerUnit), 0);
    }, [selectedRows]);

    // Build formatted message text
    const messageText = useMemo(() => {
        if (!supplier) return '';
        const supplierGreeting = supplier.contact_person ? `שלום ${supplier.contact_person}` : `שלום ${supplier.name}`;
        const dateHeader = deliveryDateNote ? ` (${deliveryDateNote})` : ` (${new Date().toLocaleDateString('he-IL')})`;
        
        let text = `${supplierGreeting},\nהזמנה עבור ${businessName}${dateHeader}:\n\n`;

        selectedRows.forEach(r => {
            const hasCases = r.caseQty > 1 && r.orderQty >= r.caseQty;
            const casesCount = hasCases ? Math.floor(r.orderQty / r.caseQty) : 0;
            const remainder = hasCases ? r.orderQty % r.caseQty : 0;

            let qtyDescription = `${r.orderQty} ${r.unitName}`;
            if (hasCases) {
                if (remainder === 0) {
                    qtyDescription = `${r.orderQty} ${r.unitName} (${casesCount} ${r.caseName})`;
                } else {
                    qtyDescription = `${r.orderQty} ${r.unitName} (${casesCount} ${r.caseName} + ${remainder} ${r.unitName})`;
                }
            }

            text += `• ${r.item.name} - ${qtyDescription}\n`;
        });

        if (additionalNotes.trim()) {
            text += `\nהערות: ${additionalNotes.trim()}\n`;
        }

        text += `\nתודה רבה!`;
        return text;
    }, [supplier, businessName, deliveryDateNote, selectedRows, additionalNotes]);

    // Phone normalization for Israeli WhatsApp & SMS
    const getNormalizedPhone = (phone?: string) => {
        if (!phone) return '';
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '972' + cleaned.substring(1);
        }
        return cleaned;
    };

    // Actions
    const saveOrderInternal = async (quiet: boolean = false) => {
        if (!businessId || !supplier) return false;
        if (selectedRows.length === 0) {
            if (!quiet) alert('אין פריטים נבחרים להזמנה');
            return false;
        }

        try {
            // 1. Insert supplier order record
            const { data: orderData, error: orderError } = await supabase
                .from('supplier_orders')
                .insert({
                    business_id: businessId,
                    supplier_id: String(supplier.id),
                    order_date: new Date().toISOString().split('T')[0],
                    order_status: 'pending',
                    status: 'pending',
                    delivery_status: 'pending',
                    total_amount: estimatedTotalCost
                })
                .select('id')
                .single();

            if (orderError) throw orderError;

            // 2. Insert order items
            const orderId = orderData.id;
            const itemsPayload = selectedRows.map(r => ({
                business_id: businessId,
                supplier_order_id: orderId,
                inventory_item_id: String(r.item.id),
                ordered_quantity_units: r.orderQty,
                ordered_unit_name: r.unitName,
                unit_price: r.costPerUnit,
                line_item_status: 'pending',
                quantity: r.orderQty
            }));

            const { error: itemsError } = await supabase
                .from('supplier_order_items')
                .insert(itemsPayload);

            if (itemsError) throw itemsError;

            onOrderCreated?.();
            return true;
        } catch (err: any) {
            console.error('Error saving supplier order:', err);
            if (!quiet) alert('שגיאה בשמירת ההזמנה במערכת: ' + err.message);
            return false;
        }
    };

    const handleSendWhatsApp = async () => {
        if (!supplier?.phone_number) {
            alert('לא מוגדר מספר טלפון עבור ספק זה. אנא העתק את ההודעה או עדכן טלפון בהגדרות הספק.');
            return;
        }

        // Auto-save order to system so it immediately appears in קבלת סחורה
        await saveOrderInternal(true);

        const phone = getNormalizedPhone(supplier.phone_number);
        const encodedText = encodeURIComponent(messageText);

        // Try iOS app scheme first for seamless PWA execution, with web fallback
        const appUrl = `whatsapp://send?phone=${phone}&text=${encodedText}`;
        const webUrl = `https://wa.me/${phone}?text=${encodedText}`;

        // Attempt opening app url
        window.location.href = appUrl;

        // Fallback timeout in case app url isn't handled
        setTimeout(() => {
            window.open(webUrl, '_blank');
        }, 300);

        setActionSuccess('ההזמנה נשמרה ונפתחה בוואטסאפ!');
    };

    const handleSendSMS = async () => {
        if (!supplier?.phone_number) {
            alert('לא מוגדר מספר טלפון עבור ספק זה.');
            return;
        }
        setSendingSms(true);
        try {
            // Auto-save order to system so it immediately appears in קבלת סחורה
            await saveOrderInternal(true);

            const res = await sendSms(supplier.phone_number, messageText);
            if (res.success) {
                setActionSuccess('ההזמנה נשמרה וה-SMS נשלח בהצלחה לספק!');
            } else {
                alert('שגיאה בשליחת SMS: ' + (res.error || 'שגיאה לא ידועה'));
            }
        } catch (err: any) {
            console.error('SMS send failed:', err);
            alert('שגיאה בשליחה: ' + err.message);
        } finally {
            setSendingSms(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(messageText);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
            setActionSuccess('ההודעה הועתקה ללוח!');
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    const handleSaveOrderToSystem = async () => {
        setSavingOrder(true);
        try {
            const saved = await saveOrderInternal(false);
            if (saved) {
                setActionSuccess('ההזמנה נשמרה בהצלחה במערכת וממתינה לקליטה!');
            }
        } finally {
            setSavingOrder(false);
        }
    };

    if (!isOpen || !supplier) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[220] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 overflow-y-auto" dir="rtl">
                <MotionDiv
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-4xl bg-slate-50 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-100 font-heebo"
                >
                    {/* Header */}
                    <div className="p-5 md:p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl md:text-2xl font-black text-slate-900">{supplier.name}</h2>
                                    {supplier.contact_person && (
                                        <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
                                            איש קשר: {supplier.contact_person}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                                    הזמנת רכש חכמה מבוססת מלאי יעד (Par Level) וספירת מלאי נוכחית
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition active:scale-95"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 no-scrollbar">
                        {/* Delivery note & Add extra item row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
                                <Calendar size={18} className="text-indigo-500 shrink-0" />
                                <span className="text-xs font-bold text-slate-600 shrink-0">מועד אספקה מבוקש:</span>
                                <input
                                    type="text"
                                    value={deliveryDateNote}
                                    onChange={e => setDeliveryDateNote(e.target.value)}
                                    placeholder="למשל: למחר בבוקר / ליום שלישי"
                                    className="flex-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            {availableAdditionalItems.length > 0 && (
                                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
                                    <Plus size={18} className="text-emerald-500 shrink-0" />
                                    <select
                                        value={selectedAdditionalItemId}
                                        onChange={e => setSelectedAdditionalItemId(e.target.value)}
                                        className="flex-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                                    >
                                        <option value="">הוסף פריט נוסף של הספק...</option>
                                        {availableAdditionalItems.map(item => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddAdditionalItem}
                                        disabled={!selectedAdditionalItemId}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition"
                                    >
                                        הוסף
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Order Items Table / Cards */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-black text-slate-700">פריטים להזמנה ({selectedRows.length})</h3>
                                <span className="text-xs text-slate-400 font-bold">סמן פריטים והתאם כמויות</span>
                            </div>

                            {orderRows.length === 0 ? (
                                <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 font-bold">
                                    אין פריטים משוייכים לספק זה במלאי.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {orderRows.map(row => {
                                        const isBelowTarget = row.targetStock > 0 && row.currentStock < row.targetStock;
                                        const hasPending = row.onOrderQty > 0;
                                        const isPack = row.caseQty > 1;

                                        return (
                                            <div
                                                key={row.item.id}
                                                className={`p-3.5 md:p-4 rounded-2xl border transition-all bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                                                    row.selected
                                                        ? 'border-indigo-200 ring-1 ring-indigo-100'
                                                        : 'border-slate-100 opacity-60'
                                                }`}
                                            >
                                                {/* Right: Checkbox + Name & Stock Metrics */}
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={row.selected}
                                                        onChange={() => handleToggleSelect(String(row.item.id))}
                                                        className="mt-1 w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-extrabold text-slate-800 text-base leading-tight">
                                                                {row.item.name}
                                                            </span>
                                                            {isPack && (
                                                                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
                                                                    מארז של {row.caseQty} {row.unitName}
                                                                </span>
                                                            )}
                                                            {hasPending && (
                                                                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                                                                    📦 {row.onOrderQty} בהזמנה פתוחה
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Stock breakdown */}
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-bold flex-wrap">
                                                            <span>ספירה בפועל: <b className="text-slate-800">{row.currentStock}</b> {row.unitName}</span>
                                                            <span>•</span>
                                                            <span>יעד: <b className="text-indigo-600">{row.targetStock || '—'}</b> {row.unitName}</span>
                                                            {row.costPerUnit > 0 && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>מחיר יחידה: ₪{row.costPerUnit.toFixed(2)}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Left: Quantity Stepper & Pack indicators */}
                                                <div className="flex items-center gap-2 justify-end shrink-0">
                                                    {isPack && (
                                                        <span className="text-[11px] font-bold text-slate-400 hidden md:inline">
                                                            {row.orderQty > 0 ? `(${Math.ceil(row.orderQty / row.caseQty)} ${row.caseName})` : ''}
                                                        </span>
                                                    )}

                                                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 h-11">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCaseStep(String(row.item.id), -1)}
                                                            className="w-9 h-9 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 hover:text-rose-500 active:scale-90 transition"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <div className="w-16 text-center">
                                                            <input
                                                                type="number"
                                                                value={row.orderQty === 0 ? '' : row.orderQty}
                                                                onChange={e => handleQuantityChange(String(row.item.id), Number(e.target.value) || 0)}
                                                                className="w-full bg-transparent border-none text-center font-black text-slate-800 text-sm focus:outline-none p-0"
                                                                placeholder="0"
                                                            />
                                                            <span className="text-[9px] text-slate-400 font-bold block leading-none">{row.unitName}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCaseStep(String(row.item.id), 1)}
                                                            className="w-9 h-9 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 hover:text-emerald-500 active:scale-90 transition"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Additional notes */}
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm space-y-1.5">
                            <label className="block text-xs font-bold text-slate-600">הערות להזמנה לספק (אופציונלי):</label>
                            <input
                                type="text"
                                value={additionalNotes}
                                onChange={e => setAdditionalNotes(e.target.value)}
                                placeholder="למשל: נא להביא קרטונים סגורים בלבד / להשאיר ליד הדלת האחורית..."
                                className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Live Message Preview Box */}
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl shadow-inner space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-slate-800 pb-2">
                                <span>📱 תצוגה מקדימה של ההודעה לספק</span>
                                <span>טלפון ספק: {supplier.phone_number || 'לא הוגדר'}</span>
                            </div>
                            <pre className="text-xs md:text-sm font-sans whitespace-pre-wrap leading-relaxed text-emerald-300">
                                {messageText}
                            </pre>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 md:p-5 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 shadow-lg">
                        {/* Cost estimate & Success message */}
                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                            {estimatedTotalCost > 0 && (
                                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-black border border-emerald-200">
                                    <DollarSign size={16} />
                                    <span>סה״כ עלות משוערת: ~₪{estimatedTotalCost.toFixed(2)} (לפני מע״מ)</span>
                                </div>
                            )}
                            {actionSuccess && (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                    <Check size={14} /> {actionSuccess}
                                </span>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                            {/* Copy button */}
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="h-11 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-1.5 active:scale-95"
                                title="העתק טקסט"
                            >
                                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                                <span>{copied ? 'הועתק!' : 'העתק'}</span>
                            </button>

                            {/* Save to system */}
                            <button
                                type="button"
                                onClick={handleSaveOrderToSystem}
                                disabled={savingOrder || selectedRows.length === 0}
                                className="h-11 px-3.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-1.5 active:scale-95"
                                title="שמור במערכת לקבלת סחורה עתידית"
                            >
                                <Package size={16} />
                                <span>{savingOrder ? 'שומר...' : 'שמור במערכת'}</span>
                            </button>

                            {/* Send SMS */}
                            <button
                                type="button"
                                onClick={handleSendSMS}
                                disabled={sendingSms || selectedRows.length === 0 || !supplier.phone_number}
                                className="h-11 px-3.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-1.5 active:scale-95"
                                title="שלח SMS"
                            >
                                <MessageSquare size={16} />
                                <span>{sendingSms ? 'שולח...' : 'SMS'}</span>
                            </button>

                            {/* Send WhatsApp (Primary) */}
                            <button
                                type="button"
                                onClick={handleSendWhatsApp}
                                disabled={selectedRows.length === 0}
                                className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-xs md:text-sm transition flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95"
                            >
                                <Send size={16} />
                                <span>שלח בוואטסאפ</span>
                            </button>
                        </div>
                    </div>
                </MotionDiv>
            </div>
        </AnimatePresence>
    );
};

export default SupplierOrderModal;
