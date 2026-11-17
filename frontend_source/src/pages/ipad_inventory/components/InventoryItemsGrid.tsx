import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Minus, AlertTriangle, Check, Package, ChevronLeft, ShoppingBag } from "lucide-react";
import { InventoryItem, Supplier } from "@/pages/ipad_inventory/types";
import { convertToBase, convertFromBase, getPackagingLevels } from "@/pages/ipad_inventory/utils/packagingUtils";

const MotionDiv = motion.div as any;

interface InventoryItemsGridProps {
    items: InventoryItem[];
    onUpdateStock: (itemId: string, newStock: number) => void;
    onStockChange?: (itemId: string, newStock: number) => void;
    isLoading: boolean;
    emptyMode?: boolean;
    onEditItem?: (item: InventoryItem) => void;
    suppliers?: Supplier[];
    supplierCounts?: Record<string, number>;
    onSelectSupplier?: (id: string) => void;
    selectedSupplier?: Supplier | null;
    onCreateSupplierOrder?: () => void;
}

const InventoryItemsGrid: React.FC<InventoryItemsGridProps> = ({
    items,
    onUpdateStock,
    onStockChange,
    isLoading,
    emptyMode = false,
    onEditItem,
    suppliers,
    supplierCounts,
    onSelectSupplier,
    selectedSupplier,
    onCreateSupplierOrder
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>("הכל");

    const categories = useMemo(() => {
        const allCats = new Set<string>();
        items.forEach(item => {
            if (item.category) {
                item.category.split(",").forEach(c => {
                    let trimmed = c.trim();
                    if (!trimmed) return;
                    
                    const lower = trimmed.toLowerCase();
                    if (lower === "dairy" || lower === "חלב" || lower === "מוצרי חלב") {
                        trimmed = "מוצרי חלב";
                    } else if (trimmed === "שימורים" || trimmed === "רטבים" || trimmed === "יבשים") {
                        trimmed = "יבשים";
                    }
                    
                    allCats.add(trimmed);
                });
            }
        });
        return ["הכל", ...Array.from(allCats).sort()];
    }, [items]);

    const filteredItems = items.filter(item => {
        if (selectedCategory && selectedCategory !== "הכל") {
            const itemCats = item.category?.split(",").map(c => {
                const trimmed = c.trim();
                const lower = trimmed.toLowerCase();
                if (lower === "dairy" || lower === "חלב" || lower === "מוצרי חלב") return "מוצרי חלב";
                if (trimmed === "שימורים" || trimmed === "רטבים" || trimmed === "יבשים") return "יבשים";
                return trimmed;
            }) || [];
            if (!itemCats.includes(selectedCategory)) return false;
        }

        if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="flex-1 h-full bg-slate-50 overflow-hidden flex flex-col">
            {/* Header: Categories & Local Search */}
            <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between border-b border-slate-100 bg-white shadow-sm shrink-0 z-10">
                {!emptyMode && onSelectSupplier && (
                    <button
                        onClick={() => onSelectSupplier(null as any)}
                        className="md:hidden w-full flex items-center gap-2 text-indigo-600 font-bold text-sm active:opacity-70"
                    >
                        <ChevronLeft size={18} className="rotate-180" />
                        <span>חזרה לרשימת ספקים</span>
                    </button>
                )}
                
                {!emptyMode && (
                <div className="flex-1 w-full overflow-hidden">
                    <div className="flex bg-slate-100/80 p-1 rounded-2xl gap-1 border border-slate-200 shadow-inner overflow-x-auto no-scrollbar max-w-full">
                        {categories.length === 0 && (
                            <div className="px-4 py-2 text-sm font-bold text-slate-400 italic">ללא קטגוריות</div>
                        )}
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${selectedCategory === cat
                                    ? "bg-white shadow-sm text-indigo-600 ring-1 ring-slate-900/5"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                )}

                {/* Supplier Order Button & Local Search */}
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    {!emptyMode && onCreateSupplierOrder && selectedSupplier && (
                        <button
                            type="button"
                            onClick={onCreateSupplierOrder}
                            className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 active:scale-95 transition shrink-0"
                            title="פתח מודאל הזמנת רכש מבוסס מלאי יעד לספק זה"
                        >
                            <ShoppingBag size={15} />
                            <span>הזמנה לספק</span>
                        </button>
                    )}

                    <div className={`relative flex-1 md:flex-initial ${emptyMode ? "w-full md:w-96" : "w-full md:w-56"}`}>
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={emptyMode ? "חיפוש פריט בכל המלאי..." : "חיפוש מהיר..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full border border-slate-200 rounded-xl py-2 pr-10 pl-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all ${emptyMode ? "bg-white py-3 text-base" : "bg-slate-50"}`}
                        />
                    </div>
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 pb-24 no-scrollbar">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : !selectedCategory ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                        <div className="p-6 bg-slate-100 rounded-full">
                            <Package size={56} className="text-slate-300" />
                        </div>
                        <div className="text-center">
                            <span className="text-lg md:text-2xl font-black text-slate-400 block mb-0.5 md:mb-1">בחר ספק</span>
                            <span className="text-slate-300 font-medium text-xs md:text-sm block">או חפש פריט ספציפי בשורת החיפוש למעלה</span>
                        </div>

                        {suppliers && onSelectSupplier && (
                            <div className="w-full max-w-lg space-y-2 mt-0 md:mt-2">
                                {suppliers
                                    .filter(s => (supplierCounts?.[String(s.id)] || 0) > 0)
                                    .map(supplier => {
                                        const count = supplierCounts?.[String(supplier.id)] || 0;
                                        return (
                                            <button
                                                key={supplier.id}
                                                onClick={() => onSelectSupplier(String(supplier.id))}
                                                className="w-full flex items-center justify-between p-3.5 md:p-4 bg-white hover:bg-indigo-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all shadow-sm active:scale-[0.98]"
                                            >
                                                <div className="flex flex-col items-start gap-0.5">
                                                    <span className="font-bold text-slate-800">{supplier.name}</span>
                                                    <span className="text-xs text-slate-400 font-medium">{count} פריטים</span>
                                                </div>
                                                <ChevronLeft size={18} className="text-slate-300" />
                                            </button>
                                        );
                                    })}
                                {(supplierCounts?.["uncategorized"] || 0) > 0 && (
                                    <button
                                        onClick={() => onSelectSupplier("uncategorized")}
                                        className="w-full flex items-center justify-between p-3.5 md:p-4 bg-white hover:bg-indigo-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all shadow-sm active:scale-[0.98]"
                                    >
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className="font-bold text-slate-800">כללי / ללא ספק</span>
                                            <span className="text-xs text-slate-400 font-medium">{supplierCounts?.["uncategorized"] || 0} פריטים</span>
                                        </div>
                                        <ChevronLeft size={18} className="text-slate-300" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                        <div className="p-6 bg-slate-100 rounded-full">
                            <Search size={48} />
                        </div>
                        <span className="text-xl font-bold">לא נמצאו פריטים תואמים</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredItems.map((item) => (
                            <InventoryItemCard
                                key={item.id}
                                item={item}
                                onUpdateStock={onUpdateStock}
                                onStockChange={onStockChange}
                                onEditItem={onEditItem}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const InventoryItemCard: React.FC<{
    item: InventoryItem;
    onUpdateStock: (itemId: string, newStock: number) => void;
    onStockChange?: (itemId: string, newStock: number) => void;
    onEditItem?: (item: InventoryItem) => void;
}> = ({ item, onUpdateStock, onStockChange, onEditItem }) => {
    const { levels, countLevel: defaultCountLevel } = useMemo(() => getPackagingLevels(item), [item]);
    const hasMultipleLevels = levels.length > 1;

    const [localStock, setLocalStock] = useState(item.current_stock);
    const [activeLevel, setActiveLevel] = useState(hasMultipleLevels ? Math.max(1, defaultCountLevel) : defaultCountLevel);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastCountedDate, setLastCountedDate] = useState(item.last_counted_at);
    const [editingInput, setEditingInput] = useState<string | null>(null);

    React.useEffect(() => {
        if (!isDirty) {
            setLocalStock(item.current_stock);
        }
    }, [item.current_stock, isDirty]);

    const displayQty = convertFromBase(localStock, activeLevel, levels);
    const displayQtyFormatted = displayQty % 1 === 0 ? displayQty : Number(displayQty.toFixed(2));
    const baseQtyFormatted = localStock % 1 === 0 ? localStock : Number(localStock.toFixed(0));

    const thresholdBase = (parseFloat(item.low_stock_threshold_units as any) || 0) * (levels[defaultCountLevel]?.qty || 1);
    const isLowStock = thresholdBase > 0 && localStock <= thresholdBase;

    const countStep = Number(levels[activeLevel]?.count_step) || (activeLevel === 0 ? Number(item.inventory_count_step) || 1 : 1);

    const handleIncrement = () => {
        const currentDisplay = convertFromBase(localStock, activeLevel, levels);
        const nextDisplay = Math.ceil((currentDisplay + 0.00001) / countStep) * countStep;
        const finalDisplay = (nextDisplay - currentDisplay < 0.0001)
            ? nextDisplay + countStep
            : nextDisplay;

        const roundedDisplay = Number(finalDisplay.toFixed(4));
        const nextBase = convertToBase(roundedDisplay, activeLevel, levels);
        const roundedBase = Number(nextBase.toFixed(4));

        setLocalStock(roundedBase);
        setIsDirty(true);
        onStockChange?.(item.id, roundedBase);
    };

    const handleDecrement = () => {
        const currentDisplay = convertFromBase(localStock, activeLevel, levels);
        const prevDisplay = Math.floor((currentDisplay - 0.00001) / countStep) * countStep;
        const finalDisplay = (currentDisplay - prevDisplay < 0.0001)
            ? prevDisplay - countStep
            : prevDisplay;

        const finalDisplayClamped = Math.max(0, finalDisplay);
        const roundedDisplay = Number(finalDisplayClamped.toFixed(4));
        const nextBase = convertToBase(roundedDisplay, activeLevel, levels);
        const roundedBase = Number(nextBase.toFixed(4));

        setLocalStock(roundedBase);
        setIsDirty(true);
        onStockChange?.(item.id, roundedBase);
    };

    const handleLevelChange = (newLevel: number) => {
        setActiveLevel(newLevel);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valStr = e.target.value;
        setEditingInput(valStr);
        if (valStr === "") {
            setLocalStock(0);
            setIsDirty(true);
            onStockChange?.(item.id, 0);
            return;
        }
        const parsed = parseFloat(valStr);
        if (!isNaN(parsed) && parsed >= 0) {
            const nextBase = convertToBase(parsed, activeLevel, levels);
            const roundedBase = Number(nextBase.toFixed(4));
            setLocalStock(roundedBase);
            setIsDirty(true);
            onStockChange?.(item.id, roundedBase);
        }
    };

    const handleInputBlur = () => {
        setEditingInput(null);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
            handleSave();
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        onStockChange?.(item.id, localStock);
        await onUpdateStock(item.id, localStock);
        setLastCountedDate(new Date().toISOString());
        setIsSaving(false);
        setIsDirty(false);
    };

    React.useEffect(() => {
        if (!isDirty) return;
        const timer = setTimeout(async () => {
            await handleSave();
        }, 1200);
        return () => clearTimeout(timer);
    }, [localStock, isDirty]);

    return (
        <MotionDiv
            layout
            className={`group relative grid grid-cols-[1fr_auto] items-center gap-3 md:gap-4 py-3 px-3 md:px-4 rounded-2xl border transition-all duration-200 bg-white shadow-sm min-h-[82px] ${isLowStock ? "ring-1 ring-amber-200 border-amber-200" : "border-slate-100 hover:border-slate-200"}`}
        >
            {/* RIGHT SIDE: Name & Info */}
            <div className="flex flex-col justify-center text-right overflow-hidden min-w-0 flex-1">
                <div className="flex items-center gap-2 justify-start">
                    {isDirty && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />}
                    <h4
                        onClick={() => onEditItem && onEditItem(item)}
                        className="font-extrabold text-slate-800 text-[15.5px] leading-tight text-right w-full line-clamp-2 hover:text-indigo-600 hover:underline cursor-pointer transition"
                        title={item.name}
                    >
                        {item.name}
                    </h4>
                    {isLowStock && <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
                </div>
                {hasMultipleLevels && activeLevel > 0 && (
                    <div className="text-[10.5px] text-slate-400 font-bold mt-0.5">
                        = {baseQtyFormatted.toLocaleString()} {levels[0].name}
                    </div>
                )}
                {Number(item.target_stock) > 0 && !isDirty && (
                    <div className="flex items-center gap-1.5 mt-1 text-[10.5px] font-bold flex-wrap">
                        <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                            יעד: {item.target_stock} {levels[0]?.name || item.unit || "יח׳"}
                        </span>
                        {localStock < Number(item.target_stock) && (
                            <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                                חסר: {Number(item.target_stock) - localStock}
                            </span>
                        )}
                    </div>
                )}
                {lastCountedDate && !isDirty && (
                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                        נספר: {new Date(lastCountedDate).toLocaleDateString("he-IL")}
                    </div>
                )}
            </div>

            {/* LEFT SIDE: Counter + Actions */}
            <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
                <div className="flex items-center bg-slate-50/80 p-0.5 rounded-xl border border-slate-100 h-11 shrink-0">
                    <button
                        onClick={handleDecrement}
                        className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 hover:text-rose-500 active:scale-90 transition"
                    >
                        <Minus size={14} />
                    </button>
                    <div className="w-16 md:w-16 text-center flex flex-col justify-center items-center leading-none">
                        <input
                            type="number"
                            inputMode="decimal"
                            value={editingInput !== null ? editingInput : (displayQty === 0 && !isDirty ? 0 : displayQtyFormatted)}
                            onFocus={(e) => {
                                setEditingInput(displayQty.toString());
                                e.target.select();
                            }}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            onKeyDown={handleInputKeyDown}
                            className={`w-full bg-transparent border-none text-center font-black ${isDirty ? "text-indigo-600" : "text-slate-800"} focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-300 rounded text-[15px] p-0 h-5 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums cursor-text`}
                        />
                        {hasMultipleLevels ? (
                            <select
                                value={activeLevel}
                                onChange={(e) => handleLevelChange(Number(e.target.value))}
                                className="text-[9.5px] text-indigo-600 font-extrabold bg-indigo-50/60 hover:bg-indigo-100/80 rounded px-1 py-0.5 border border-indigo-200/40 outline-none cursor-pointer text-center appearance-none w-full mt-0.5"
                                style={{ WebkitAppearance: "none", textAlignLast: "center" }}
                            >
                                {levels.map((level, idx) => (
                                    <option key={idx} value={idx}>{level.name}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 select-none">{levels[0]?.name || item?.unit || "יח׳"}</span>
                        )}
                    </div>
                    <button
                        onClick={handleIncrement}
                        className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 hover:text-emerald-500 active:scale-90 transition"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                <button
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0
                        ${isDirty ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white" : "bg-slate-50 text-slate-200 cursor-not-allowed"}`}
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    ) : (
                        <Check size={22} strokeWidth={2.5} />
                    )}
                </button>
            </div>
        </MotionDiv>
    );
};

export default InventoryItemsGrid;
