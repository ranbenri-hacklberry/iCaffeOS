import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Snowflake, Package, Plus, Minus, Save } from 'lucide-react';
import { InventoryItem } from '@/pages/ipad_inventory/types';

const MotionDiv = motion.div as any;

interface PreparedItemsViewProps {
    items: InventoryItem[];
    onUpdateStock: (itemId: string, newStock: number) => void;
    isLoading: boolean;
}

const PreparedItemsView: React.FC<PreparedItemsViewProps> = ({ items, onUpdateStock, isLoading }) => {
    // Split items by prep type (assuming defrost items have specific keywords or future prep_type field)
    const { prepItems, defrostItems } = useMemo(() => {
        const prep: InventoryItem[] = [];
        const defrost: InventoryItem[] = [];

        items.forEach(item => {
            // Check if item name or category indicates defrost
            const isDefrost = item.name.includes('הפשרה') || item.name.includes('קפוא') || item.category?.includes('defrost');
            if (isDefrost) {
                defrost.push(item);
            } else {
                prep.push(item);
            }
        });

        return { prepItems: prep, defrostItems: defrost };
    }, [items]);

    if (isLoading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50">
            {/* Header with Stats */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl shadow-inner flex items-center justify-center text-indigo-600">
                        <ChefHat size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">הכנות והפשרות</h3>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                <Package size={12} />
                                {items.length} פריטים במעקב
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl gap-2">
                    <div className="flex flex-col items-center px-4 py-1.5 bg-white rounded-lg shadow-sm border border-slate-200/50">
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">הכנות וייצור</span>
                        <span className="text-lg font-black text-slate-700">{prepItems.length}</span>
                    </div>
                    <div className="flex flex-col items-center px-4 py-1.5 bg-white rounded-lg shadow-sm border border-slate-200/50">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">הפשרה</span>
                        <span className="text-lg font-black text-slate-700">{defrostItems.length}</span>
                    </div>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-10 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                        <Package size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-400">אין מנות למעקב מלאי</h3>
                    <p className="text-slate-400 max-w-xs mx-auto mt-2 text-sm">
                        רק מנות שהוגדרו עם ניהול מלאי מופיעות כאן.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {/* Prep & Production Section */}
                    {prepItems.length > 0 && (
                        <div className="bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/50">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h4 className="flex items-center gap-2 font-black text-indigo-900 text-base">
                                    <ChefHat size={18} className="text-indigo-600" />
                                    הכנות וייצור
                                </h4>
                                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-sm">
                                    {prepItems.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {prepItems.map(item => (
                                    <PreparedItemCard
                                        key={item.id}
                                        item={item}
                                        onUpdateStock={onUpdateStock}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Defrost Section */}
                    {defrostItems.length > 0 && (
                        <div className="bg-blue-50/30 rounded-2xl p-4 border border-blue-100/50">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h4 className="flex items-center gap-2 font-black text-blue-900 text-base">
                                    <Snowflake size={18} className="text-blue-500" />
                                    הפשרה
                                </h4>
                                <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-sm">
                                    {defrostItems.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {defrostItems.map(item => (
                                    <PreparedItemCard
                                        key={item.id}
                                        item={item}
                                        onUpdateStock={onUpdateStock}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const PreparedItemCard: React.FC<{ item: InventoryItem, onUpdateStock: (itemId: string, newStock: number) => void }> = ({ item, onUpdateStock }) => {
    const [localStock, setLocalStock] = React.useState(item.current_stock);
    const [isDirty, setIsDirty] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [lastCountedDate, setLastCountedDate] = React.useState(item.last_counted_at);

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
        setLastCountedDate(new Date().toISOString());
        setIsSaving(false);
        setIsDirty(false);
    };

    return (
        <MotionDiv
            layout
            className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-100 group hover:shadow-md hover:border-indigo-200 transition-all"
        >
            {/* Single Line Layout - Same as Regular Inventory */}
            <div className="flex items-center gap-2">
                {/* Item Name & Unit */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-900 leading-tight truncate">{item.name}</h4>
                    <span className="inline-block text-[9px] font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-500">
                        {item.unit}
                    </span>
                </div>

                {/* Stock Controls */}
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

export default PreparedItemsView;
