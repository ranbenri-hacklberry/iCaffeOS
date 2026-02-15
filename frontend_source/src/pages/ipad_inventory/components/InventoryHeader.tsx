import React from 'react';
import { ClipboardList, Truck, FileText } from 'lucide-react';
import UnifiedHeader from '@/components/UnifiedHeader';

interface InventoryHeaderProps {
    activeTab: 'counts' | 'shipping';
    setActiveTab: (tab: 'counts' | 'shipping') => void;
    onExit: () => void;
    onShowReport: () => void;
}

const InventoryHeader: React.FC<InventoryHeaderProps> = ({ activeTab, setActiveTab, onExit, onShowReport }) => {
    return (
        <UnifiedHeader
            title="ניהול מלאי"
            subtitle="ספירה וקבלת סחורה"
            onHome={onExit}
        >
            <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                    <button
                        onClick={() => setActiveTab('counts')}
                        className={`px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'counts'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-white'
                            }`}
                    >
                        <ClipboardList size={16} />
                        <span>ספירה</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('shipping')}
                        className={`px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'shipping'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-white'
                            }`}
                    >
                        <Truck size={16} />
                        <span>קבלת סחורה</span>
                    </button>
                </div>

                <div className="w-px h-8 bg-slate-200 mx-2" />

                {activeTab === 'counts' && (
                    <button
                        onClick={onShowReport}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
                    >
                        <FileText size={16} />
                        <span>דווח חוסרים</span>
                    </button>
                )}
            </div>
        </UnifiedHeader>
    );
};

export default InventoryHeader;
