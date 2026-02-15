import React from 'react';
import { motion } from 'framer-motion';
import { Truck, ChevronLeft, Calendar, Package } from 'lucide-react';
import { IncomingOrder } from '@/pages/ipad_inventory/types';

const MotionButton = motion.button as any;

interface IncomingOrdersSidebarProps {
    orders: IncomingOrder[];
    selectedOrderId: string | null;
    onSelectOrder: (orderId: string) => void;
    isLoading: boolean;
}

const IncomingOrdersSidebar: React.FC<IncomingOrdersSidebarProps> = ({
    orders,
    selectedOrderId,
    onSelectOrder,
    isLoading
}) => {
    if (isLoading) {
        return (
            <div className="w-80 h-full bg-slate-50 border-l border-slate-200 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="w-80 h-full bg-slate-50 border-l border-slate-200 overflow-y-auto no-scrollbar pb-20">
            <div className="p-6">
                <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Truck size={22} className="text-indigo-600" />
                    <span>משלוחים בדרך</span>
                </h2>

                {orders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Truck size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm">אין משלוחים פעילים</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => {
                            const isActive = selectedOrderId === order.id;
                            const orderDate = new Date(order.order_date || order.created_at);
                            const itemCount = order.items?.length || 0;

                            return (
                                <MotionButton
                                    key={order.id}
                                    onClick={() => onSelectOrder(String(order.id))}
                                    whileHover={{ x: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                                        isActive
                                            ? 'bg-white shadow-md border-indigo-100 border'
                                            : 'hover:bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`font-bold transition-colors truncate ${
                                                isActive ? 'text-indigo-600' : 'text-slate-800'
                                            }`}>
                                                {order.supplier_name || 'ספק לא ידוע'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={10} />
                                                {orderDate.toLocaleDateString('he-IL')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Package size={10} />
                                                {itemCount} פריטים
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronLeft
                                        size={18}
                                        className={`transition-all shrink-0 ${
                                            isActive
                                                ? 'text-indigo-400 translate-x-0'
                                                : 'text-slate-300 translate-x-1 opacity-0'
                                        }`}
                                    />
                                </MotionButton>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncomingOrdersSidebar;
