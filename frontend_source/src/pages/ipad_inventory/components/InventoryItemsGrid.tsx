import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Minus, History, AlertTriangle, Save, Check, Package } from 'lucide-react';
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
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = useMemo(() => {
        return Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[];
    }, [items]);

    const filteredItems = items.filter(item => {
        if (!selectedCategory || item.category !== selectedCategory) return false;
        if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="flex-1 h-full bg-slate-50 overflow-hidden flex flex-col">
            {/* Header: Categories & Local Search */}
            <div className="px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 bg-white shadow-sm shrink-0 z-10">
                {/* Categories */}
                <div className="flex bg-slate-100/80 p-1 rounded-2xl gap-1 border border-slate-200 shadow-inner overflow-x-auto no-scrollbar max-w-full">
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

    const handleIncrement = () => {
        const step = Number(item.count_step) || 1;
        const next = localStock + step;
        setLocalStock(next);
        setIsDirty(true);
    };

    const handleDecrement = () => {
        const step = Number(item.count_step) || 1;
        const next = Math.max(0, localStock - step);
        setLocalStock(next);
        setIsDirty(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onUpdateStock(item.id, localStock);
        // Update the date to today after successful save
        setLastCountedDate(new Date().toISOString());
        setIsSaving(false);
        setIsDirty(false);
    };

    return (
        <MotionDiv
            layout
            className={`group flex items-center gap-4 p-2.5 rounded-2xl border transition-all duration-200 bg-white shadow-sm ${isLowStock ? 'ring-1 ring-amber-200 border-amber-200' : 'border-slate-100 hover:border-slate-200'}`}
        >
            {/* Complete/Save Button */}
            <button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90
                    ${isDirty ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white' : 'bg-slate-50 text-slate-200 cursor-not-allowed'}`}
            >
                {isSaving ? (
                    <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                ) : (
                    <Check size={20} strokeWidth={2.5} />
                )}
            </button>

            {/* Middle Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center text-right">
                <div className="flex items-center gap-2 justify-start">
                    {isLowStock && <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
                    <h4 className="font-black text-slate-800 text-sm leading-tight truncate">{item.name}</h4>
                    {isDirty && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />}
                </div>
                {lastCountedDate && !isDirty && (
                    <div className="text-[9px] text-slate-400 font-bold mt-1">
                        נספר: {new Date(lastCountedDate).toLocaleDateString('he-IL')}
                    </div>
                )}
            </div>

            {/* Counter */}
            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100 h-10 shrink-0">
                <button
                    onClick={handleIncrement}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 hover:text-emerald-500 transition active:scale-90"
                >
                    <Plus size={14} />
                </button>
                <div className="w-12 text-center flex flex-col justify-center leading-none">
                    <span className={`text-sm font-black ${isDirty ? 'text-indigo-600' : 'text-slate-600'} tabular-nums`}>
                        {localStock % 1 === 0 ? localStock : localStock.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">{item.unit || 'יח\''}</span>
                </div>
                <button
                    onClick={handleDecrement}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 hover:text-rose-500 transition active:scale-90"
                >
                    <Minus size={14} />
                </button>
            </div>
        </MotionDiv>
    );
};

export default InventoryItemsGrid;
