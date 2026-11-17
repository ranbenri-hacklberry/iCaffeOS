import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Check, CheckSquare, Square, AlertTriangle, Plus, Minus, PackageCheck } from 'lucide-react';
import { ReceivingSession, ReceivingSessionItem, InventoryItem } from '@/pages/ipad_inventory/types';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface TripleCheckSessionProps {
    session: ReceivingSession;
    items: InventoryItem[];
    onUpdateQty: (itemId: string, qty: number) => void;
    onUpdateInvoicedQty?: (itemId: string, qty: number) => void;
    onToggleChecked?: (itemId: string) => void;
    onToggleAllChecked?: (forceState?: boolean) => void;
    onMapItem: (itemId: string, inventoryItemId: string | number) => void;
    onUpdateCaseQuantity?: (itemId: string, caseQty: number) => void;
    onCreateNewItem?: (itemId: string, name: string, unit: string) => Promise<void>;
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

const getMatchScore = (invItemName: string, rawName: string) => {
    if (!invItemName || !rawName) return 0;
    const invWords = invItemName.toLowerCase().replace(/[^\w\s\u0590-\u05FF]/g, "").split(/\s+/).filter(w => w.length >= 2);
    const rawWords = rawName.toLowerCase().replace(/[^\w\s\u0590-\u05FF]/g, "").split(/\s+/).filter(w => w.length >= 2);
    let score = 0;
    for (const rw of rawWords) {
        for (const iw of invWords) {
            if (iw === rw) score += 10;
            else if (iw.includes(rw) || rw.includes(iw)) score += 3;
        }
    }
    return score;
};

export const TripleCheckSession: React.FC<TripleCheckSessionProps> = ({
    session,
    items,
    onUpdateQty,
    onUpdateInvoicedQty,
    onToggleChecked,
    onToggleAllChecked,
    onMapItem,
    onUpdateCaseQuantity,
    onCreateNewItem,
    onConfirm,
    onCancel,
    isSubmitting
}) => {
    const totalItems = session.items.length;
    const checkedCount = session.items.filter(i => i.checked !== false).length;
    const allChecked = totalItems > 0 && checkedCount === totalItems;

    const estimatedTotal = useMemo(() => {
        return session.items
            .filter(i => i.checked !== false)
            .reduce((sum, i) => {
                const qty = Number(i.actualQty) || 0;
                const price = Number(i.unitPrice) || 0;
                return sum + (qty * price);
            }, 0);
    }, [session.items]);

    return (
        <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-6"
            dir="rtl"
        >
            <MotionDiv
                initial={{ scale: 0.96, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white w-full max-w-5xl h-full md:h-[92vh] md:rounded-3xl rounded-none shadow-2xl flex flex-col overflow-hidden border border-slate-100 font-heebo"
            >
                {/* Header */}
                <div className="px-4 md:px-8 py-4 md:py-5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                            <PackageCheck size={26} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-xl md:text-2xl font-black text-slate-900">קבלת סחורה ובדיקת משלוח</h2>
                                {session.supplierName && (
                                    <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-0.5 rounded-full border border-indigo-100">
                                        ספק: {session.supplierName}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs md:text-sm text-slate-500 font-bold mt-0.5">
                                בדיקת התאמה בין הכמות שהוזמנה, מה שהגיע בפועל והחשבונית
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Check all toggle button */}
                        <button
                            type="button"
                            onClick={() => onToggleAllChecked?.(!allChecked)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${
                                allChecked
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                        >
                            {allChecked ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} />}
                            <span>{allChecked ? 'בטל סימון הכל' : 'סמן הכל כהתקבל'}</span>
                        </button>

                        <button
                            onClick={onCancel}
                            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition active:scale-95 shrink-0"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Table Column Headers on Desktop */}
                <div className="hidden lg:grid grid-cols-12 gap-3 px-8 py-2.5 bg-slate-100/80 text-xs font-black text-slate-500 border-b border-slate-200/60 uppercase tracking-wider shrink-0">
                    <div className="col-span-5 flex items-center gap-2">
                        <span>צ'קליסט ופריט</span>
                    </div>
                    <div className="col-span-2 text-center text-blue-700">
                        <span>1. כמה הוזמן</span>
                    </div>
                    <div className="col-span-3 text-center text-emerald-700">
                        <span>2. כמה יש בפועל</span>
                    </div>
                    <div className="col-span-2 text-center text-purple-700">
                        <span>3. כמה בחשבונית</span>
                    </div>
                </div>

                {/* Main List Area */}
                <div className="flex-1 overflow-y-auto px-3 md:px-8 py-3 md:py-4 no-scrollbar bg-slate-50/60 space-y-3">
                    {session.items.map((item) => (
                        <ReceivingRow
                            key={item.id}
                            item={item}
                            allInventoryItems={items}
                            onMapItem={onMapItem}
                            onUpdateCaseQuantity={onUpdateCaseQuantity}
                            onCreateNewItem={onCreateNewItem}
                            onToggleChecked={() => onToggleChecked?.(item.id)}
                            onUpdateQty={(qty) => onUpdateQty(item.id, qty)}
                            onUpdateInvoicedQty={(qty) => onUpdateInvoicedQty?.(item.id, qty)}
                        />
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="px-4 md:px-8 py-3.5 md:py-5 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 shadow-lg">
                    {/* Summary Counters */}
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-bold uppercase">פריטים מסומנים:</span>
                            <span className="text-lg md:text-xl font-black text-slate-800 tabular-nums">
                                {checkedCount} / {totalItems}
                            </span>
                        </div>

                        {estimatedTotal > 0 && (
                            <div className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1.5 rounded-xl">
                                סה"כ משוער: <b className="text-slate-900">₪{estimatedTotal.toFixed(2)}</b>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button
                            onClick={onCancel}
                            className="px-5 py-3 text-slate-500 font-bold text-sm md:text-base hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                        >
                            ביטול
                        </button>

                        <MotionButton
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onConfirm}
                            disabled={isSubmitting || checkedCount === 0}
                            className={`flex items-center gap-2 px-6 md:px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm md:text-base shadow-lg shadow-emerald-600/20 transition-all ${
                                isSubmitting ? 'cursor-not-allowed' : ''
                            }`}
                        >
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <Check size={18} strokeWidth={3} />
                            )}
                            <span>אישור ועדכון מלאי ({checkedCount} פריטים)</span>
                        </MotionButton>
                    </div>
                </div>
            </MotionDiv>
        </MotionDiv>
    );
};

interface ReceivingRowProps {
    item: ReceivingSessionItem;
    allInventoryItems: InventoryItem[];
    onMapItem: (itemId: string, inventoryItemId: string | number) => void;
    onUpdateCaseQuantity?: (itemId: string, caseQty: number) => void;
    onCreateNewItem?: (itemId: string, name: string, unit: string) => Promise<void>;
    onToggleChecked: () => void;
    onUpdateQty: (qty: number) => void;
    onUpdateInvoicedQty?: (qty: number) => void;
}

const ReceivingRow: React.FC<ReceivingRowProps> = ({
    item,
    allInventoryItems,
    onMapItem,
    onUpdateCaseQuantity,
    onCreateNewItem,
    onToggleChecked,
    onUpdateQty,
    onUpdateInvoicedQty
}) => {
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    const isChecked = item.checked !== false;
    const invoicedQty = item.invoicedQty ?? item.orderedQty;
    const actualQty = item.actualQty;
    const orderedQty = item.orderedQty;
    const step = item.countStep || 1;

    // Discrepancy checks
    const hasOrderedDiff = actualQty !== orderedQty;
    const hasInvoicedDiff = actualQty !== invoicedQty;
    const hasDiscrepancy = hasOrderedDiff || hasInvoicedDiff;

    // Sort matching suggestions
    const sortedInventoryItems = useMemo(() => {
        return [...allInventoryItems].sort((a, b) => {
            const scoreA = getMatchScore(a.name, item.name);
            const scoreB = getMatchScore(b.name, item.name);
            return scoreB - scoreA;
        });
    }, [allInventoryItems, item.name]);

    return (
        <MotionDiv
            layout
            className={`bg-white border rounded-2xl p-3.5 md:p-4 shadow-sm transition-all ${
                !isChecked
                    ? 'opacity-50 border-slate-200 bg-slate-50/50'
                    : hasDiscrepancy
                    ? 'border-amber-300 bg-amber-50/15'
                    : 'border-slate-200/90 hover:border-indigo-200'
            }`}
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                {/* Column 0: Checklist Checkbox + Item Info (cols 1-5 on LG) */}
                <div className="col-span-1 lg:col-span-5 flex items-start gap-3 min-w-0">
                    {/* Checkbox button */}
                    <button
                        type="button"
                        onClick={onToggleChecked}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm ${
                            isChecked
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20 active:scale-95'
                                : 'bg-slate-100 text-slate-400 border border-slate-300 hover:bg-slate-200'
                        }`}
                        title={isChecked ? 'סומן כהתקבל (לחץ לביטול)' : 'לא התקבל (לחץ לסימון)'}
                    >
                        <Check size={20} strokeWidth={isChecked ? 3.5 : 2} className={isChecked ? 'text-white' : 'opacity-40'} />
                    </button>

                    {/* Item Name and Unit */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm md:text-base font-black truncate block ${isChecked ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                                {item.name}
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">
                                {item.unit}
                            </span>
                        </div>

                        {/* Discrepancy Chips */}
                        {isChecked && hasDiscrepancy && (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px] font-bold">
                                {hasOrderedDiff && (
                                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <AlertTriangle size={11} />
                                        הפרש מהזמנה: {actualQty > orderedQty ? `+${actualQty - orderedQty}` : actualQty - orderedQty}
                                    </span>
                                )}
                                {hasInvoicedDiff && (
                                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                                        הפרש מחשבונית: {actualQty > invoicedQty ? `+${actualQty - invoicedQty}` : actualQty - invoicedQty}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* If Item is new or needs catalog mapping */}
                        {item.isNew && (
                            <div className="flex items-center gap-2 mt-2">
                                <select
                                    value={item.inventoryItemId || ''}
                                    disabled={isCreatingNew}
                                    onChange={async (e) => {
                                        const val = e.target.value;
                                        if (val === 'CREATE_NEW') {
                                            setIsCreatingNew(true);
                                            try {
                                                await onCreateNewItem?.(item.id, item.name, item.unit);
                                            } finally {
                                                setIsCreatingNew(false);
                                            }
                                        } else {
                                            onMapItem(item.id, val);
                                        }
                                    }}
                                    className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-2.5 py-1 font-bold focus:outline-none flex-1"
                                >
                                    <option value="" disabled>שייך לפריט במלאי...</option>
                                    {sortedInventoryItems.map((invItem) => (
                                        <option key={invItem.id} value={invItem.id}>
                                            {invItem.name} ({invItem.unit})
                                        </option>
                                    ))}
                                    <option value="CREATE_NEW" style={{ fontWeight: 'bold', color: '#4f46e5' }}>
                                        + צור מוצר חדש במלאי: "{item.name}"
                                    </option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3 Columns Section (cols 6-12 on LG) */}
                <div className="col-span-1 lg:col-span-7 grid grid-cols-3 gap-2 md:gap-3 items-center pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Column 1: כמה הוזמן (Ordered) */}
                    <div className="flex flex-col items-center justify-center p-2 bg-blue-50/70 border border-blue-100 rounded-2xl text-center">
                        <span className="text-[10px] font-black text-blue-700 uppercase mb-0.5">כמה הוזמן</span>
                        <span className="text-base md:text-xl font-black text-blue-900 tabular-nums">
                            {orderedQty} <span className="text-xs font-bold text-blue-600">{item.unit}</span>
                        </span>
                    </div>

                    {/* Column 2: כמה יש בפועל (Actual / Delivered) */}
                    <div className="flex flex-col items-center p-1.5 bg-emerald-50/50 border border-emerald-200 rounded-2xl">
                        <span className="text-[10px] font-black text-emerald-700 uppercase mb-1">כמה בפועל</span>
                        <div className="flex items-center justify-center gap-1 w-full">
                            <button
                                type="button"
                                disabled={!isChecked}
                                onClick={() => onUpdateQty(Math.max(0, actualQty - step))}
                                className="w-7 h-7 md:w-8 md:h-8 bg-white text-slate-600 hover:text-rose-600 rounded-lg flex items-center justify-center shadow-sm border border-slate-200 active:scale-95 transition disabled:opacity-40"
                            >
                                <Minus size={13} />
                            </button>

                            <input
                                type="number"
                                disabled={!isChecked}
                                value={actualQty}
                                onChange={(e) => onUpdateQty(Math.max(0, parseFloat(e.target.value) || 0))}
                                onFocus={(e) => e.target.select()}
                                className="w-12 md:w-14 text-center font-black text-sm md:text-base text-emerald-950 bg-white border border-emerald-300 rounded-lg py-0.5 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-40"
                                step={step}
                            />

                            <button
                                type="button"
                                disabled={!isChecked}
                                onClick={() => onUpdateQty(actualQty + step)}
                                className="w-7 h-7 md:w-8 md:h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center shadow-sm active:scale-95 transition disabled:opacity-40"
                            >
                                <Plus size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Column 3: כמה מופיע בחשבונית (Invoiced) */}
                    <div className="flex flex-col items-center justify-center p-1.5 bg-purple-50/70 border border-purple-200 rounded-2xl text-center">
                        <span className="text-[10px] font-black text-purple-700 uppercase mb-1">בחשבונית</span>
                        <div className="flex items-center justify-center gap-1 w-full">
                            <input
                                type="number"
                                disabled={!isChecked}
                                value={invoicedQty}
                                onChange={(e) => onUpdateInvoicedQty?.(Math.max(0, parseFloat(e.target.value) || 0))}
                                onFocus={(e) => e.target.select()}
                                className="w-16 md:w-20 text-center font-black text-sm md:text-base text-purple-900 bg-white border border-purple-300 rounded-lg py-1 tabular-nums focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-40"
                                step={step}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </MotionDiv>
    );
};

export default TripleCheckSession;
