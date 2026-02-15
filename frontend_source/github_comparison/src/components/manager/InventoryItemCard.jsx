import React, { useState, useRef, useEffect } from 'react';
import { Package, ChevronDown, ChevronUp, History, CheckCircle2, Minus, Plus, ShoppingCart } from 'lucide-react';

const InventoryItemCard = ({ item, onStockChange, onOrderChange, draftOrderQty = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentStock, setCurrentStock] = useState(Number(item.current_stock) || 0);
    const [orderQty, setOrderQty] = useState(draftOrderQty);
    const [updating, setUpdating] = useState(false);

    const timeoutRef = useRef(null);

    // Cleanup timeout on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // --- LOGIC FOR UNITS & STEPS ---
    const unitLower = (item.unit || '').trim().toLowerCase();

    // 1. Check if strict Unit item (Integer only)
    const isUnitItem = ['unit', 'יח׳', 'יחידה', 'item', 'piece'].some(u => unitLower === u || unitLower.startsWith(u)); // Flexible match

    // 2. Count Step
    // Unit items -> Integer only (Step 1)
    // Non-Unit (Kg, Liter, etc.) -> Allow fractions (Step 0.25)
    const countStep = isUnitItem ? 1 : 0.25;

    // 3. Order Step
    const caseQty = item.case_quantity && item.case_quantity > 0 ? item.case_quantity : 0;

    // Order Step Logic:
    // If Case Quantity defined -> Step is Case Quantity.
    // Otherwise -> Step is ALWAYS 1 (Integers only for orders, per user request).
    const orderStep = caseQty > 0 ? caseQty : 1;

    // Status Logic
    const lastCountDate = item.last_counted_at ? new Date(item.last_counted_at) : null;
    const isCountedToday = lastCountDate && (
        lastCountDate.getDate() === new Date().getDate() &&
        lastCountDate.getMonth() === new Date().getMonth() &&
        lastCountDate.getFullYear() === new Date().getFullYear()
    );

    const handleStockUpdate = (newValue) => {
        let val = Math.max(0, newValue);

        // Count Logic:
        // If Unit Item -> Force Integer.
        // If Bulk/Other -> Allow Decimals (don't round to integer).
        if (isUnitItem) val = Math.round(val);

        // Round to safe decimals for JS float math
        val = Math.round(val * 100) / 100;

        setCurrentStock(val);
        setUpdating(true);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            try {
                if (onStockChange) await onStockChange(item.id, val);
            } finally {
                setUpdating(false);
            }
        }, 800);
    };

    const handleOrderUpdate = (newValue) => {
        let val = newValue;
        if (val < 0) val = 0;

        // Min Order Rule: If > 0, must be at least 1 (or case min)
        const minOrder = caseQty > 0 ? caseQty : 1;

        if (val > 0 && val < minOrder) {
            val = minOrder;
        }

        // Case Multiple Rule
        if (caseQty > 0 && val > 0) {
            // Snap to nearest multiple
            const remainder = val % caseQty;
            if (remainder !== 0) {
                // Simple snap: round to nearest multiple
                val = Math.round(val / caseQty) * caseQty;
                if (val === 0 && newValue > 0) val = caseQty;
            }
        }
        else {
            // General Rule: Orders are always Integers (multiples of 1)
            val = Math.round(val);
        }

        val = Math.round(val * 100) / 100;

        setOrderQty(val);
        if (onOrderChange) onOrderChange(item.id, val);
    };

    // Increment/Decrement handlers for ORDER
    const incrementOrder = () => {
        let next = orderQty + orderStep;

        // Initial Jump: 0 -> Min (1 or Case)
        const minOrder = caseQty > 0 ? caseQty : 1;
        if (orderQty === 0) next = minOrder;

        handleOrderUpdate(next);
    }

    const decrementOrder = () => {
        let next = orderQty - orderStep;

        // Drop Rule: If going below min, drop to 0
        const minOrder = caseQty > 0 ? caseQty : 1;
        if (next < minOrder) next = 0;

        handleOrderUpdate(next);
    }

    return (
        <div className={`bg-white rounded-xl border transition-all shadow-sm ${isExpanded ? 'border-blue-200 ring-1 ring-blue-50' : 'border-gray-200'} `}>
            {/* Header - Always Visible */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-3 flex items-center justify-between cursor-pointer select-none ${isExpanded ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50'} `}
            >
                {/* Right: Item Info */}
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 ${item.current_stock <= (item.low_stock_alert || 5) ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} `}>
                        <Package size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate leading-tight">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-gray-600">{item.unit || 'יח׳'}</span>
                        </div>
                    </div>
                </div>

                {/* Left: Alerts & Chevron */}
                <div className="flex items-center gap-3 pl-1">
                    {/* Current Stock Prominent Badge (Collapsed Only) */}
                    {!isExpanded && (
                        <div className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg border min-w-[3rem] ${currentStock <= (item.low_stock_alert || 5)
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-gray-50 border-gray-200 text-gray-800'
                            }`}>
                            <span className="text-[10px] text-gray-400 leading-none mb-0.5">מלאי</span>
                            <span className="font-black text-lg leading-none">{currentStock}</span>
                        </div>
                    )}

                    {/* Draft Indicator */}
                    {orderQty > 0 && !isExpanded && (
                        <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100 min-w-[3rem]">
                            <ShoppingCart size={10} className="mb-0.5" />
                            <span className="font-bold text-sm leading-none">+{orderQty}</span>
                        </div>
                    )}

                    {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
            </div>

            {/* Expanded Content - Controls */}
            {isExpanded && (
                <div className="border-t border-gray-100 p-3 bg-white space-y-4 animate-in slide-in-from-top-2 duration-200">

                    {/* 1. Stock Update Section */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-500 flex items-center gap-1">
                            מלאי נוכחי
                            {updating && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}
                        </span>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
                            <button onClick={() => handleStockUpdate(currentStock - countStep)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded shadow-sm text-red-500 text-lg active:scale-95 transition">-</button>
                            <div className="w-12 text-center font-black text-lg text-gray-800">{currentStock}</div>
                            <button onClick={() => handleStockUpdate(currentStock + countStep)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded shadow-sm text-blue-600 text-lg active:scale-95 transition">+</button>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full"></div>

                    {/* 2. Order Update Section */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-blue-600 block">להוסיף להזמנה</span>
                            {item.case_quantity > 0 && <span className="text-[10px] text-blue-400">מארז: {item.case_quantity} {item.unit}</span>}
                        </div>
                        <div className={`flex items-center gap-2 rounded-lg p-1 border transition-colors ${orderQty > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-70'} `}>
                            <button onClick={decrementOrder} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded shadow-sm text-blue-400 text-lg active:scale-95 transition">-</button>
                            <div className={`w-12 text-center font-black text-lg ${orderQty > 0 ? 'text-blue-700' : 'text-gray-300'} `}>{orderQty > 0 ? orderQty : '-'}</div>
                            <button onClick={incrementOrder} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded shadow-sm text-blue-600 text-lg active:scale-95 transition">+</button>
                        </div>
                    </div>

                    {item.supplier && (
                        <div className="text-[10px] text-gray-400 text-center pt-1">
                            ספק: {item.supplier.name || 'לא זמין'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(InventoryItemCard);
