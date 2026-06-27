import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, AlertCircle, Plus, Minus, Receipt } from 'lucide-react';
import { ReceivingSession, ReceivingSessionItem, InventoryItem } from '@/pages/ipad_inventory/types';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface TripleCheckSessionProps {
    session: ReceivingSession;
    items: InventoryItem[];
    onUpdateQty: (itemId: string, qty: number) => void;
    onMapItem: (itemId: string, inventoryItemId: number) => void;
    onUpdateCaseQuantity?: (itemId: string, caseQty: number) => void;
    onCreateNewItem?: (itemId: string, name: string, unit: string) => Promise<void>;
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

const TripleCheckSession: React.FC<TripleCheckSessionProps> = ({
    session,
    items,
    onUpdateQty,
    onMapItem,
    onUpdateCaseQuantity,
    onCreateNewItem,
    onConfirm,
    onCancel,
    isSubmitting
}) => {
    return (
        <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
        >
            <MotionDiv
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white"
            >
                {/* Header */}
                <div className="px-10 py-8 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Receipt size={32} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">אישור קבלת סחורה</h2>
                            <p className="text-slate-500 font-bold flex items-center gap-2">
                                {session.supplierName || 'בדיקת משלוח'} •
                                <span className="text-indigo-600 font-black">{session.items.length} פריטים</span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onCancel}
                        className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all"
                    >
                        <X size={28} />
                    </button>
                </div>

                {/* Main List Area */}
                <div className="flex-1 overflow-y-auto px-10 py-6 no-scrollbar bg-slate-50/50">
                    <div className="space-y-4">
                        {session.items.map((item) => (
                            <ReceivingRow
                                key={item.id}
                                item={item}
                                allInventoryItems={items}
                                onMapItem={onMapItem}
                                onUpdateCaseQuantity={onUpdateCaseQuantity}
                                onCreateNewItem={onCreateNewItem}
                                onUpdateQty={(qty) => onUpdateQty(item.id, qty)}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-10 py-8 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex flex-col">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">סה"כ פריטים שנקלטו</span>
                        <span className="text-3xl font-black text-slate-900 tabular-nums">
                            {session.items.reduce((sum, i) => sum + (i.actualQty > 0 ? 1 : 0), 0)} / {session.items.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onCancel}
                            className="px-8 py-5 text-slate-500 font-black text-lg hover:text-slate-800 transition-colors"
                        >
                            ביטול
                        </button>
                        <MotionButton
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onConfirm}
                            disabled={isSubmitting}
                            className={`flex items-center gap-3 px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            ) : (
                                <Check size={24} strokeWidth={3} />
                            )}
                            <span>אישור ועדכון מלאי</span>
                        </MotionButton>
                    </div>
                </div>
            </MotionDiv>
        </MotionDiv>
    );
};

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

const ReceivingRow: React.FC<{
    item: ReceivingSessionItem;
    allInventoryItems: InventoryItem[];
    onMapItem: (itemId: string, inventoryItemId: number) => void;
    onUpdateCaseQuantity?: (itemId: string, caseQty: number) => void;
    onCreateNewItem?: (itemId: string, name: string, unit: string) => Promise<void>;
    onUpdateQty: (qty: number) => void;
}> = ({ item, allInventoryItems, onMapItem, onUpdateCaseQuantity, onCreateNewItem, onUpdateQty }) => {
    const [localInvoiceQty, setLocalInvoiceQty] = React.useState(item.invoicedQty ?? item.orderedQty);
    const hasDiscrepancy = localInvoiceQty !== item.actualQty;
    const [isCreatingNew, setIsCreatingNew] = React.useState(false);

    const sortedInventoryItems = React.useMemo(() => {
        return [...allInventoryItems].sort((a, b) => {
            const scoreA = getMatchScore(a.name, item.name);
            const scoreB = getMatchScore(b.name, item.name);
            if (scoreA !== scoreB) return scoreB - scoreA;
            return a.name.localeCompare(b.name, 'he'); // fallback to Hebrew alphabetical
        });
    }, [allInventoryItems, item.name]);

    return (
        <MotionDiv
            layout
            className={`bg-white border rounded-2xl p-5 flex items-center gap-4 shadow-sm transition-all ${
                hasDiscrepancy ? 'border-amber-400 bg-amber-50/20' : 'border-slate-100'
            }`}
        >
            {/* Item Name */}
            <div className="flex-1 min-w-[180px]">
                <span className="text-lg font-black text-slate-900 block">{item.name}</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">
                    {item.unit}
                </span>
            </div>

            {/* Mapping Selector */}
            <div className="flex flex-col gap-1 min-w-[220px]">
                <span className="text-slate-400 font-bold text-[9px] uppercase whitespace-nowrap">שיוך למוצר מלאי</span>
                <div className="flex items-center gap-2">
                    <select
                        value={item.inventoryItemId || ""}
                        disabled={isCreatingNew}
                        onChange={async (e) => {
                            const val = e.target.value;
                            if (val === "CREATE_NEW") {
                                setIsCreatingNew(true);
                                try {
                                    await onCreateNewItem?.(item.id, item.name, item.unit);
                                } finally {
                                    setIsCreatingNew(false);
                                }
                            } else {
                                onMapItem(item.id, Number(val));
                            }
                        }}
                        className={`text-sm rounded-xl px-3 py-2 font-bold focus:outline-none transition-colors border flex-1 min-w-[130px] ${
                            item.isNew 
                                ? 'bg-amber-50/60 border-amber-200 text-amber-800 focus:border-amber-400' 
                                : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-slate-400'
                        }`}
                    >
                        <option value="" disabled={!item.isNew}>
                            {isCreatingNew ? 'מקים מוצר...' : (item.isNew ? 'שייך למוצר במלאי...' : 'לא משוייך')}
                        </option>
                        {sortedInventoryItems.map((invItem) => (
                            <option key={invItem.id} value={invItem.id}>
                                {invItem.name} ({invItem.unit})
                            </option>
                        ))}
                        {item.isNew && (
                            <option value="CREATE_NEW" style={{ fontWeight: 'bold', color: '#4f46e5' }}>
                                + צור מוצר חדש במלאי: "{item.name}"
                            </option>
                        )}
                    </select>

                    {item.isNew && (
                        <button
                            onClick={async () => {
                                setIsCreatingNew(true);
                                try {
                                    await onCreateNewItem?.(item.id, item.name, item.unit);
                                } finally {
                                    setIsCreatingNew(false);
                                }
                            }}
                            disabled={isCreatingNew}
                            className="px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-black transition-all whitespace-nowrap border border-indigo-100 shadow-sm"
                        >
                            {isCreatingNew ? 'מקים...' : '+ הקם חדש'}
                        </button>
                    )}
                </div>
                {item.matchedItem && (item.matchedItem.unit === 'יח׳' || item.matchedItem.unit === 'יחידה' || item.matchedItem.unit === 'יח') && !(Number(item.matchedItem.weight_per_unit) > 0) && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-600 font-black leading-none">
                        <span>מארז של</span>
                        <input
                            type="number"
                            value={item.caseQuantity || 1}
                            onChange={(e) => onUpdateCaseQuantity?.(item.id, parseInt(e.target.value) || 1)}
                            className="w-12 text-center border-b border-indigo-300 focus:border-indigo-600 focus:outline-none bg-indigo-50/50 rounded px-1 py-0.5 font-black text-indigo-700"
                        />
                        <span>יח' (המלאי יעודכן ב-{Math.round(item.actualQty * (item.caseQuantity || 1))} יח׳)</span>
                    </div>
                )}
            </div>

            {/* Column 1: Order Quantity (Read-only) */}
            <div className="flex flex-col items-center px-4 border-x border-slate-100">
                <span className="text-slate-400 font-bold text-[9px] uppercase mb-1 whitespace-nowrap">כמות בהזמנה</span>
                <span className="text-2xl font-black text-blue-600 tabular-nums">
                    {item.orderedQty}
                </span>
            </div>

            {/* Column 2: Actual Quantity (Editable via click/type or large iPad buttons) */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-3xl p-1.5 shadow-sm">
                <button
                    onClick={() => onUpdateQty(Math.max(0, item.actualQty - item.countStep))}
                    className="w-14 h-14 bg-white text-slate-600 rounded-2xl flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shadow-sm border border-slate-100"
                >
                    <Minus size={22} />
                </button>

                <div className="w-20 flex flex-col items-center justify-center">
                    <input
                        type="number"
                        value={item.actualQty}
                        onChange={(e) => onUpdateQty(Math.max(0, parseFloat(e.target.value) || 0))}
                        className={`w-18 text-center text-2xl font-black tabular-nums focus:outline-none bg-transparent border-0 p-0 ${
                            hasDiscrepancy ? 'text-amber-600' : 'text-green-600'
                        }`}
                    />
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap mt-0.5">כמות בפועל</span>
                </div>

                <button
                    onClick={() => onUpdateQty(item.actualQty + item.countStep)}
                    className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/10"
                >
                    <Plus size={22} />
                </button>
            </div>

            {/* Column 3: Invoice Quantity (Editable via input) */}
            <div className="flex flex-col items-center px-4 border-x border-slate-100">
                <span className="text-slate-400 font-bold text-[9px] uppercase mb-1 whitespace-nowrap">כמות בחשבונית</span>
                <input
                    type="number"
                    value={localInvoiceQty}
                    onChange={(e) => setLocalInvoiceQty(Number(e.target.value))}
                    className="w-20 text-2xl font-black text-purple-600 tabular-nums text-center bg-purple-50 border-2 border-purple-200 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-400 transition-colors"
                    step={item.countStep}
                />
            </div>

            {/* Status Icon */}
            <div className="shrink-0">
                {hasDiscrepancy ? (
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
                        <AlertCircle size={20} />
                    </div>
                ) : (
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                        <Check size={20} strokeWidth={3} />
                    </div>
                )}
            </div>
        </MotionDiv>
    );
};

export default TripleCheckSession;
