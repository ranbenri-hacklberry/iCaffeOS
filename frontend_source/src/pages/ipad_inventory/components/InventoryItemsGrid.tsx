import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Minus, History, AlertTriangle, Save, Check } from 'lucide-react';
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

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 h-full bg-slate-50 overflow-hidden flex flex-col">
            {/* Local Search */}
            <div className="px-6 py-4 flex items-center gap-4">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="חיפוש מהיר של פריטים..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all"
                    />
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
            className={`bg-white rounded-lg p-2.5 shadow-sm border ${isLowStock ? 'border-amber-200 bg-amber-50/10' : 'border-slate-100'
                } group hover:shadow-md hover:border-indigo-200 transition-all`}
        >
            {/* Single Line Layout */}
            <div className="flex items-center gap-2">
                {/* Alert Icon */}
                {isLowStock && (
                    <div className="bg-amber-100 p-1 rounded text-amber-600 shrink-0">
                        <AlertTriangle size={12} />
                    </div>
                )}

                {/* Item Name & Unit */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-900 leading-tight truncate">{item.name}</h4>
                    <span className={`inline-block text-[9px] font-bold px-1 py-0.5 rounded ${isLowStock ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {item.unit}
                    </span>
                </div>

                {/* Stock Number */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={handleDecrement}
                        className="w-7 h-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
                    >
                        <Minus size={14} />
                    </button>

                    <div className="min-w-[50px] text-center">
                        <span className="text-lg font-black text-slate-900 tabular-nums">
                            {localStock % 1 === 0 ? localStock : localStock.toFixed(2)}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold block leading-none">במלאי</span>
                    </div>

                    <button
                        onClick={handleIncrement}
                        className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-100 active:scale-95 transition-all"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {/* Fixed Width Container for Save Button / Date */}
                <div className="w-[70px] shrink-0 flex items-center justify-center">
                    {isDirty ? (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold rounded-md hover:from-green-600 hover:to-emerald-600 active:scale-95 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
                        >
                            {isSaving ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={10} />
                                    <span>שמור</span>
                                </>
                            )}
                        </button>
                    ) : lastCountedDate ? (
                        <div className="text-[9px] font-bold text-slate-400 text-center">
                            {new Date(lastCountedDate).toLocaleDateString('he-IL')}
                        </div>
                    ) : null}
                </div>
            </div>
        </MotionDiv>
    );
};

export default InventoryItemsGrid;
