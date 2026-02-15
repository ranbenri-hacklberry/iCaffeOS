import React from 'react';
import { Edit2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

const MenuManagerCard = ({
    item = null,
    onClick = () => { },
    onToggleAvailability = () => { }
}) => {
    // 🛡️ בדיקת props בסיסית
    if (!item) {
        return (
            <div className="w-full h-20 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
                <span className="text-gray-400 text-sm">פריט חסר</span>
            </div>
        );
    }

    // 🛡️ בדיקת נתונים בטוחה - IMPORTANT: Keep id!
    const safeItem = {
        id: item.id, // CRITICAL: Keep the original ID for editing
        name: item.name || 'ללא שם',
        price: item.price || 0,
        category: item.category || 'ללא קטגוריה',
        image_url: item.image_url || null,
        is_in_stock: item.is_in_stock ?? true // nullish coalescing
    };

    const isAvailable = safeItem.is_in_stock !== false;
    // Pass the original item with ID to onClick for proper editing
    const handleCardClick = () => onClick?.(item); // Use original item, not safeItem
    const handleToggle = (e) => {
        e.stopPropagation();
        onToggleAvailability?.(item); // Use original item
    };

    return (
        <div
            className={`bg-white rounded-xl shadow-sm border border-gray-100 p-2 pr-2 flex items-center gap-3 relative transition-all cursor-pointer group 
                ${!isAvailable
                    ? 'opacity-60 bg-gray-50'
                    : 'hover:shadow-md hover:border-blue-200 hover:bg-blue-50/50'
                }`}
            dir="rtl"
            role="button"
            tabIndex={0}
            onClick={handleCardClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleCardClick();
                }
            }}
            aria-label={`ניהול פריט: ${safeItem.name}`}
        >
            {/* 🖼️ Image Section - עם Error Boundary */}
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                {safeItem.image_url ? (
                    <img
                        src={safeItem.image_url}
                        alt={safeItem.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center text-gray-300 transition-opacity duration-200 ${safeItem.image_url ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                    }`}>
                    <ImageIcon size={20} />
                </div>
            </div>

            {/* 📝 Content Section */}
            <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                <h3 className="font-bold text-gray-800 text-sm leading-tight truncate pr-1">
                    {safeItem.name}
                </h3>
                <span className="text-xs text-blue-600 font-bold mt-0.5">
                    ₪{Number(safeItem.price).toFixed(2)}
                </span>
                <span className="text-[10px] text-gray-400 truncate mt-0.5 pr-1">
                    {safeItem.category}
                </span>
            </div>

            {/* 🔧 Actions Section */}
            <div className="pl-1 flex-shrink-0">
                <button
                    onClick={handleToggle}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md 
                        ${isAvailable
                            ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        }`}
                    title={isAvailable ? 'הסתר פריט' : 'הצג פריט'}
                    aria-label={isAvailable ? 'הסתר פריט' : 'הצג פריט'}
                >
                    {isAvailable ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
            </div>
        </div>
    );
};

export default React.memo(MenuManagerCard);
