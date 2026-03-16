import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Minus, AlertTriangle, Check, Package } from 'lucide-react';
import { InventoryItem } from '@/pages/ipad_inventory/types';

const MotionDiv = motion.div as any;

interface InventoryItemsGridProps {
    items: InventoryItem[];
    onUpdateStock: (itemId: string, newStock: number) => void;
    isLoading: boolean;
}

const InventoryItemsGrid: React.FC<InventoryItemsGridProps> = ({
    items,
    onUpdateStock,
    isLoading
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>('הכל');

    const categories = useMemo(() => {
        const allCats = new Set<string>();
        items.forEach(item => {
            if (item.category) {
                // Split by comma and trim each category
                item.category.split(',').forEach(c => {
                    const trimmed = c.trim();
                    if (trimmed) allCats.add(trimmed);
                });
            }
        });
        return ['הכל', ...Array.from(allCats).sort()];
    }, [items]);

    const filteredItems = items.filter(item => {
        if (selectedCategory && selectedCategory !== 'הכל') {
            const itemCats = item.category?.split(',').map(c => c.trim()) || [];
            if (!itemCats.includes(selectedCategory)) return false;
        }

        if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="flex-1 h-full bg-slate-50 overflow-hidden flex flex-col">
            {/* Header: Categories & Local Search */}
            <div className="px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 bg-white shadow-sm shrink-0 z-10">
                {/* Categories */}
                <div className="flex bg-slate-100/80 p-1 rounded-2xl gap-1 border border-slate-200 shadow-inner overflow-x-auto no-scrollbar max-w-full">
                    {categories.length === 0 && (
                        <div className="px-4 py-2 text-sm font-bold text-slate-400 italic">ללא קטגוריות</div>
                    )}
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${selectedCategory === cat
                                ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-900/5'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Local Search */}
                <div className="relative w-full md:w-64 shrink-0">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="חיפוש מהיר..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-10 pl-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all"
                    />
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 no-scrollbar">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : !selectedCategory ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                        <div className="p-6 bg-slate-100 rounded-full">
                            <Package size={48} />
                        </div>
                        <span className="text-xl font-bold">יש לבחור קטגוריה למעלה</span>
                        <span className="text-sm font-bold text-slate-400">הסחורה מסודרת לפי קטגוריות לייעול הספירה</span>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                        <div className="p-6 bg-slate-100 rounded-full">
                            <Search size={48} />
                        </div>
                        <span className="text-xl font-bold">לא נמצאו פריטים תואמים</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredItems.map((item) => (
                            <InventoryItemCard
                                key={item.id}
                                item={item}
                                onUpdateStock={onUpdateStock}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const InventoryItemCard: React.FC<{ item: InventoryItem, onUpdateStock: (itemId: string, newStock: number) => void }> = ({ item, onUpdateStock }) => {
    const wpu = parseFloat(item.weight_per_unit as any) || 0;
    const thresholdGrams = (parseFloat(item.low_stock_threshold_units as any) || 0) * (wpu || 1);
    const isLowStock = thresholdGrams > 0 && item.current_stock <= thresholdGrams;
    const [localStock, setLocalStock] = useState(item.current_stock);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastCountedDate, setLastCountedDate] = useState(item.last_counted_at);

    // Calculate display units
    const rawDisplayUnits = wpu > 0 ? localStock / wpu : localStock;
    const unitStep = Number(item.inventory_count_step) || 1;
    
    // Pessimistic rounding: always round DOWN to the nearest whole step
    // Add epsilon (0.00001) to handle floating point precision errors (e.g. 1.0/1.0 being 0.99999...)
    const displayUnits = Math.floor((rawDisplayUnits + 0.00001) / unitStep) * unitStep;

    const handleIncrement = () => {
        // Increment by count_step. If count_step is in units (e.g. 1 unit), 
        // and we store grams, we multiply by wpu.
        const gramStep = wpu > 0 ? unitStep * wpu : unitStep;

        const next = localStock + gramStep;
        setLocalStock(next);
        setIsDirty(true);
    };

    const handleDecrement = () => {
        const gramStep = wpu > 0 ? unitStep * wpu : unitStep;

        const next = Math.max(0, localStock - gramStep);
        setLocalStock(next);
        setIsDirty(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onUpdateStock(item.id, localStock);
        setLastCountedDate(new Date().toISOString());
        setIsSaving(false);
        setIsDirty(false);
    };

    return (
        <MotionDiv
            layout
            className={`group grid grid-cols-[1fr_auto] items-center gap-4 py-3 px-4 rounded-2xl border transition-all duration-200 bg-white shadow-sm h-[76px] ${isLowStock ? 'ring-1 ring-amber-200 border-amber-200' : 'border-slate-100 hover:border-slate-200'}`}
        >
            {/* 1. RIGHT SIDE: Name & Info (First in JSX = Right in RTL) */}
            <div className="flex flex-col justify-center text-right overflow-hidden min-w-0 flex-1">
                <div className="flex items-center gap-2 justify-start">
                    {isDirty && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />}
                    <h4 className="font-extrabold text-slate-800 text-[15.5px] leading-tight truncate text-right w-full" title={item.name}>
                        {item.name}
                    </h4>
                    {isLowStock && <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
                </div>
                {lastCountedDate && !isDirty && (
                    <div className="text-[10px] text-slate-400 font-bold mt-1">
                        נספר: {new Date(lastCountedDate).toLocaleDateString('he-IL')}
                    </div>
                )}
            </div>

            {/* 2. LEFT SIDE: Actions (Last in JSX = Left in RTL) */}
            <div className="flex items-center gap-2.5 shrink-0">
                {/* Counter Group */}
                <div className="flex items-center bg-slate-50/80 p-0.5 rounded-xl border border-slate-100 h-11 shrink-0">
                    <button
                        onClick={handleDecrement}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 hover:text-rose-500 transition"
                    >
                        <Minus size={14} />
                    </button>
                    <div className="w-14 text-center flex flex-col justify-center leading-none">
                        <span className={`text-[15px] font-black ${isDirty ? 'text-indigo-600' : 'text-slate-800'} tabular-nums`}>
                            {displayUnits % 1 === 0 ? displayUnits : displayUnits.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">יח'</span>
                    </div>
                    <button
                        onClick={handleIncrement}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 hover:text-emerald-500 transition"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0
                        ${isDirty ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white' : 'bg-slate-50 text-slate-200 cursor-not-allowed'}`}
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
