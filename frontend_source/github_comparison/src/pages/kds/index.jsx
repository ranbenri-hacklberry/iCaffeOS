import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Package, Plus, RotateCcw,
  Clock, CreditCard, ChefHat, CheckCircle, List,
  Check, AlertTriangle, X, RefreshCw, Flame, Edit
} from 'lucide-react';
import { supabase, getSupabase } from '../../lib/supabase';
import { sendSms } from '../../services/smsService';
import CashPaymentModal from './components/CashPaymentModal';
import StaffQuickAccessModal from '../../components/StaffQuickAccessModal';
import { useAuth } from '../../context/AuthContext';

const API_URL =
  (import.meta.env.VITE_MANAGER_API_URL ||
    import.meta.env.VITE_DATA_MANAGER_API_URL ||
    'https://aimanageragentrani-625352399481.europe-west1.run.app').replace(/\/$/, '');

// --- סגנונות (CSS) ---
const kdsStyles = `
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;800;900&display=swap');

  .font - heebo { font - family: 'Heebo', sans - serif; }

  .kds - card {
  transition: transform 0.2s ease -in -out, box - shadow 0.2s ease -in -out;
}
  .kds - card:active {
  transform: scale(0.99);
}

  /* שם הפריט - קומפקטי יותר */
  .item - text {
  font - size: 1rem;
  font - weight: 700;
  color: #1f2937;
  line - height: 1.2;
}

/* אנימציית הבהוב חזקה בכתום/צהוב */
@keyframes strongOrangePulse {
  0 %, 100 % {
    box- shadow: 0 0 4px rgba(245, 158, 11, 0.6);
  border - color: #f59e0b;
  transform: scale(1);
}
50 % {
  box- shadow: 0 0 16px rgba(245, 158, 11, 0.9);
border - color: #fbbf24;
transform: scale(1.02);
    }
  }
  .animate - strong - pulse { animation: strongOrangePulse 1.2s ease -in -out infinite; }

`;

// --- רכיבים ---

const Header = ({ onRefresh, lastUpdated, viewMode, setViewMode, onOpenStaffMenu, onUndoLastAction, canUndo }) => {
  const navigate = useNavigate();

  const handleNewOrder = () => {
    sessionStorage.setItem('order_origin', 'kds');
    navigate('/customer-phone-input-screen?from=kds');
  };

  // טאבים מעודכנים
  const tabs = [
    { id: 'kds', label: 'מסך מטבח', icon: LayoutGrid },
    { id: 'orders_inventory', label: 'מלאי והזמנות', icon: Package },
    { id: 'tasks_prep', label: 'משימות והכנות', icon: List },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md h-16 flex justify-between items-center px-4 border-b border-gray-200 font-heebo shrink-0 z-20 shadow-sm">
      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-100">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={`flex items - center gap - 2 px - 5 py - 2 rounded - lg transition - all duration - 200 ${viewMode === tab.id
              ? 'bg-white text-slate-900 shadow-sm font-black ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-700 font-medium'
              } `}
          >
            <tab.icon size={18} strokeWidth={viewMode === tab.id ? 2.5 : 2} />
            <span className="text-base">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end text-gray-500 hidden md:flex cursor-pointer" onClick={onRefresh}>
          <span className="text-xl font-black leading-none tracking-tight text-slate-700">
            {lastUpdated.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block"></div>

        <div className="flex items-center gap-3">
          <button
            onClick={canUndo ? onUndoLastAction : undefined}
            disabled={!canUndo}
            className={`flex flex-col items-center justify-center w-20 h-12 rounded-xl transition border shadow-sm ${canUndo
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100 active:scale-95 cursor-pointer'
              : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-60'
              }`}
          >
            <RotateCcw size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold mt-0.5">ביטול פעולה</span>
          </button>

          <button
            onClick={onOpenStaffMenu}
            className="flex flex-col items-center justify-center w-12 h-12 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition border border-gray-200 shadow-sm"
          >
            <ChefHat size={20} strokeWidth={2.5} />
          </button>

          <button
            onClick={handleNewOrder}
            className="flex items-center gap-2 px-5 h-12 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition shadow-md active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            <span className="text-lg font-bold">הזמנה</span>
          </button>
        </div>
      </div>
    </header>
  );
};

// Helper functions for sorting and splitting items
const isDrink = (item) => {
  const cat = (item.category || '').toLowerCase();
  return cat.includes('שתיה') || cat.includes('drink') || cat.includes('coffee') || cat.includes('קפה');
};

const isHotDrink = (item) => {
  const cat = (item.category || '').toLowerCase();
  return isDrink(item) && (cat.includes('חמה') || cat.includes('hot'));
};

const sortItems = (items) => {
  return [...items].sort((a, b) => {
    const aHot = isHotDrink(a);
    const bHot = isHotDrink(b);
    const aDrink = isDrink(a);
    const bDrink = isDrink(b);

    // 1. Hot drinks first
    if (aHot && !bHot) return -1;
    if (!aHot && bHot) return 1;

    // 2. Cold drinks second (if not both hot)
    if (aDrink && !bDrink) return -1;
    if (!aDrink && bDrink) return 1;

    // 3. Food last (preserve original order for food)
    return 0;
  });
};

const OrderCard = ({ order, isReady = false, onOrderStatusUpdate, onPaymentCollected, onFireItems, onEditOrder }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getModColor = (text) => {
    if (!text) return 'mod-color-gray';
    const t = String(text).toLowerCase().trim();

    // Foam Specifics (Priority)
    if (t.includes('בלי קצף') || t.includes('ללא קצף')) return 'mod-color-foam-none';
    if (t.includes('פחות קצף') || t.includes('מעט קצף')) return 'mod-color-foam-down';
    if (t.includes('הרבה קצף') || t.includes('אקסטרה קצף')) return 'mod-color-foam-up';

    // הסרות / בלי
    if (t.includes('בלי') || t.includes('ללא') || t.includes('הורד'))
      return 'mod-color-red';

    // תוספות / אקסטרה / בצד
    if (t.includes('תוספת') || t.includes('אקסטרה') || t.includes('בצד') || t.includes('קצף'))
      return 'mod-color-lightgreen';

    // סוגי חלב
    if (t.includes('סויה') || t.includes('שיבולת שועל') || t.includes('שיבולת'))
      return 'mod-color-soy-oat';
    if (t.includes('שקדים'))
      return 'mod-color-almond';
    if (t.includes('נטול') || t.includes('דקף') || t.includes('ללא לקטוז'))
      return 'mod-color-lactose-free';

    // טמפרטורה וחוזק
    if (t.includes('רותח') || t.includes('חם מאוד'))
      return 'mod-color-extra-hot';
    if (t.includes('חזק') || t.includes('כפול'))
      return 'mod-color-strong';
    if (t.includes('חלש') || t.includes('קל'))
      return 'mod-color-light';

    return 'mod-color-gray';
  };

  /* ============================================================
     ⚠️ CRITICAL: DO NOT CHANGE THIS THRESHOLD! ⚠️
     When more than 4 items, split into 2 columns (not scroll!)
     This has been reset multiple times - DO NOT REVERT!
     ============================================================ */
  const isLargeOrder = order.items?.length > 4;
  const isDelayedCard = order.type === 'delayed';
  const isUnpaidDelivered = order.type === 'unpaid_delivered';

  // הגדרת רוחב: 280px לרגיל, 450px לגדול (לשני טורים)
  const cardWidthClass = isLargeOrder ? 'w-[450px]' : 'w-[280px]';

  const getStatusStyles = (status) => {
    if (isDelayedCard) return 'border-t-[6px] border-slate-400 shadow-inner bg-slate-200/90 opacity-95';
    if (isUnpaidDelivered) return 'border-t-[6px] border-blue-500 shadow-md animate-strong-pulse bg-blue-50/30';

    const statusLower = (status || '').toLowerCase();

    if (statusLower === 'new' || statusLower === 'pending') return 'border-t-[6px] border-green-500 shadow-md';
    // רקע לבן במקום צהוב
    if (statusLower === 'in_progress') return 'border-t-[6px] border-yellow-500 shadow-lg ring-1 ring-yellow-100';
    return 'border-gray-200 shadow-sm';
  };

  const orderStatusLower = (order.orderStatus || '').toLowerCase();
  const nextStatusLabel =
    orderStatusLower === 'new' || orderStatusLower === 'pending'
      ? 'התחל הכנה'
      : (orderStatusLower === 'in_progress'
        ? 'מוכן להגשה'
        : (isReady ? 'נמסר' : 'מוכן להגשה'));

  const actionBtnColor = isReady
    ? 'bg-slate-900 text-white hover:bg-slate-800'
    : (orderStatusLower === 'new' || orderStatusLower === 'pending'
      ? 'bg-slate-800 text-white hover:bg-slate-700'
      : 'bg-green-600 text-white hover:bg-green-700');

  // Unified sorted list for all orders
  const unifiedItems = sortItems(order.items || []);

  /* ============================================================
     ⚠️ CRITICAL: TWO COLUMN SPLIT LOGIC - DO NOT CHANGE! ⚠️
     Right column gets first 4 items, left column gets rest.
     This prevents scrolling in cards - items WRAP to 2nd column.
     ============================================================ */
  const rightColItems = isLargeOrder ? unifiedItems.slice(0, 4) : [];
  const leftColItems = isLargeOrder ? unifiedItems.slice(4) : [];

  // Helper to shorten modifier names for KDS
  const shortenKdsMod = (name) => {
    if (!name) return '';
    const s = String(name);
    if (s.includes('חצי חלב חצי מים')) return 'חצי-חצי';
    if (s.includes('נטול קפאין')) return 'נטול';
    if (s.includes('דל שומן')) return 'דל';
    if (s.includes('שיבולת שועל')) return 'שיבולת';
    if (s.includes('חלב שקדים')) return 'שקדים';
    if (s.includes('חלב סויה')) return 'סויה';
    return s;
  };

  const renderItemRow = (item, idx, isLarge) => {
    // Debug log to inspect item structure
    if (idx === 0) console.log('KDS Item Debug:', { name: item.name, mods: item.modifiers, type: typeof item.name });

    return (
      <div key={`${item.menuItemId}-${item.modsKey || ''}-${idx}`} className={`flex flex-col ${isLarge ? 'border-b border-gray-50 pb-0.5' : 'border-b border-dashed border-gray-100 pb-0.5 last:border-0'}`}>
        <div className="flex items-start gap-2">
          {/* Quantity Badge */}
          <span className={`flex items-center justify-center w-6 h-6 rounded-lg font-black text-base shadow-sm shrink-0 mt-0 ${item.quantity > 1 ? 'bg-orange-600 text-white ring-2 ring-orange-200' : (isDelayedCard ? 'bg-gray-300 text-gray-600' : 'bg-slate-900 text-white')
            }`}>
            {item.quantity}
          </span>

          {/* ============================================================
             ⚠️ CRITICAL: MODIFIERS MUST WRAP! ⚠️
             Use flex flex-wrap so mods go to next line, NOT get cut off!
             ============================================================ */}
          <div className="flex-1 pt-0 min-w-0 pr-2">
            <div className="flex flex-wrap items-center gap-1 text-right leading-snug">
              {/* Item Name */}
              <span className={`font-bold ${item.quantity > 1 ? 'text-orange-700' : 'text-gray-900'}`}>
                {item.name}
              </span>

              {/* Modifiers - Wrapping */}
              {(() => {
                if (!item.modifiers || item.modifiers.length === 0) return null;

                // 1. Sort Modifiers
                const sortedMods = [...item.modifiers].sort((a, b) => {
                  const textA = String(a.text || '').toLowerCase();
                  const textB = String(b.text || '').toLowerCase();

                  // Priority 1: Decaf (נטול)
                  const isDecafA = textA.includes('נטול');
                  const isDecafB = textB.includes('נטול');
                  if (isDecafA && !isDecafB) return -1;
                  if (!isDecafA && isDecafB) return 1;

                  // Priority 2: Milk (Soy/Oat/Almond)
                  const isMilkA = textA.includes('סויה') || textA.includes('שיבולת') || textA.includes('שקדים');
                  const isMilkB = textB.includes('סויה') || textB.includes('שיבולת') || textB.includes('שקדים');
                  if (isMilkA && !isMilkB) return -1;
                  if (!isMilkA && isMilkB) return 1;

                  return 0;
                });

                return sortedMods.map((mod, i) => {
                  const originalText = String(mod.text || '');
                  let displayText = originalText;

                  // 2. Shorten Text Logic
                  if (originalText.includes('בלי קצף') || originalText.includes('ללא קצף')) {
                    displayText = 'קצף'; // For strikethrough
                  } else if (originalText.includes('נטול קפאין')) {
                    displayText = 'נטול';
                  } else if (originalText.includes('חלב סויה')) {
                    displayText = 'סויה';
                  } else if (originalText.includes('חלב שיבולת')) {
                    displayText = 'שיבולת';
                  } else if (originalText.includes('חלב שקדים')) {
                    displayText = 'שקדים';
                  } else if (originalText.includes('פחות קצף')) {
                    displayText = 'פחות קצף';
                  }

                  return (
                    <span key={i} className={`mod-label ${getModColor(originalText)}`}>
                      {displayText}
                    </span>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`kds-card ${cardWidthClass} flex-shrink-0 rounded-2xl p-3 mx-2 flex flex-col h-full font-heebo ${isDelayedCard ? 'bg-gray-50' : 'bg-white'} ${getStatusStyles(order.orderStatus)} border-x border-b border-gray-100`}>

      <div className="flex justify-between items-start mb-2 border-b border-gray-50 pb-1.5">
        <div className="flex flex-col overflow-hidden">
          {/* שם לקוח - ענק */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 min-w-0 text-2xl font-black text-slate-900 leading-none tracking-tight truncate" title={order.customerName}>
              {order.customerName}
            </div>
            {/* Edit Button - In Header */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditOrder?.(order);
              }}
              className="p-1 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors shrink-0"
              title="ערוך הזמנה"
            >
              <Edit size={14} strokeWidth={2.5} />
            </button>
          </div>
          {/* מספר הזמנה - קטן */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-gray-400">#{order.orderNumber}</span>
            {order.isSecondCourse && (
              <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-purple-200">
                מנה שניה
              </span>
            )}
            {order.hasPendingItems && !isDelayedCard && (
              <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-200">
                <Clock size={10} />
                +המשך
              </span>
            )}
            {isDelayedCard && (
              <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-gray-300">
                בהמתנה
              </span>
            )}
          </div>
        </div>

        <div className="text-left flex flex-col items-end shrink-0 ml-2 gap-1">
          <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
            <Clock size={12} />
            <span className="text-xs font-mono font-bold">{order.timestamp}</span>
          </div>
          {!order.isPaid ? (
            <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded">לא שולם</span>
          ) : (
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">שולם</span>
          )}
        </div>
      </div>

      {/* ============================================================
         ⚠️ CRITICAL: NO HORIZONTAL SCROLL IN CARDS! ⚠️
         Items should WRAP to 2nd column or new line, NOT scroll!
         - overflow-x: hidden (NO horizontal scroll!)
         - overflow-y: auto (allow vertical scroll only if really needed)
         ============================================================ */}
      <div className={`flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar pr-1 mr-1 mb-2`}>
        {isLargeOrder ? (
          <div className="flex h-full gap-2">
            {/* עמודה ימנית (RTL) - פריטים 1-4 */}
            <div className="flex-1 flex flex-col space-y-1 border-l border-gray-100 pl-2">
              {rightColItems.length > 0 ? (
                rightColItems.map((item, idx) => renderItemRow(item, idx, true))
              ) : (
                <div className="text-gray-300 text-xs text-center mt-4 italic">ריק</div>
              )}
            </div>
            {/* עמודה שמאלית (RTL) - פריטים 5+ */}
            <div className="flex-1 flex flex-col space-y-1">
              {leftColItems.length > 0 ? (
                leftColItems.map((item, idx) => renderItemRow(item, idx, true))
              ) : (
                <div className="text-gray-300 text-xs text-center mt-4 italic"></div>
              )}
            </div>
          </div>
        ) : (
          // רגיל - רשימה אחת מאוחדת ממוינת
          <div className="flex flex-col space-y-1">
            {unifiedItems.map((item, idx) => renderItemRow(item, idx, false))}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 relative">
        {isUnpaidDelivered ? (
          // כרטיס נמסר שלא שולם - כפתור תשלום גדול בלבד
          <button
            disabled={isUpdating}
            onClick={async () => {
              if (onPaymentCollected) {
                setIsUpdating(true);
                try {
                  await onPaymentCollected(order);
                } finally {
                  setIsUpdating(false);
                }
              }
            }}
            className={`w-full py-2.5 bg-white border-2 border-amber-500 text-amber-700 rounded-xl font-black text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 animate-strong-pulse hover:bg-amber-50 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <img
              src="https://gxzsxvbercpkgxraiaex.supabase.co/storage/v1/object/public/Photos/cashregister.jpg"
              alt="קופה"
              className="w-8 h-8 object-contain drop-shadow-sm"
            />
            <span>{isUpdating ? 'מעדכן...' : `לתשלום (₪${order.totalAmount?.toFixed(0)})`}</span>
          </button>
        ) : isDelayedCard ? (
          // כרטיס מושהה - כפתור "הכן עכשיו"
          <button
            disabled={isUpdating}
            onClick={async () => {
              setIsUpdating(true);
              try {
                const flatIds = order.items.flatMap(i => i.ids || [i.id]);
                const itemsPayload = flatIds.map(id => ({ id }));
                if (onFireItems) {
                  await onFireItems(order.originalOrderId, itemsPayload);
                }
              } finally {
                setIsUpdating(false);
              }
            }}
            className={`w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-black text-lg shadow-lg shadow-orange-200 border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 hover:brightness-110 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Flame size={18} className="fill-white animate-pulse" />
            <span>{isUpdating ? 'שולח...' : 'הכן עכשיו!'}</span>
          </button>
        ) : (
          // כרטיסים פעילים (הכנה / מוכן) - שורה אחת בלבד!
          <div className="flex items-stretch gap-2 mt-auto h-14 w-full">

            {/* כפתור חזרה - רק במוכן */}
            {isReady && (
              <button
                disabled={isUpdating}
                onClick={async (e) => {
                  e.stopPropagation(); setIsUpdating(true);
                  try { await onOrderStatusUpdate(order.id, 'undo_ready'); }
                  finally { setIsUpdating(false); }
                }}
                className="w-14 h-14 bg-gray-200 border-2 border-gray-300 rounded-xl shadow-sm flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-300 shrink-0 active:scale-95 transition-all"
                title="החזר להכנה"
              >
                <RotateCcw size={24} />
              </button>
            )}

            {/* כפתור ראשי */}
            <button
              disabled={isUpdating}
              onClick={async () => {
                setIsUpdating(true);
                try { await onOrderStatusUpdate(order.id, order.orderStatus); }
                finally { setIsUpdating(false); }
              }}
              className={`flex-1 rounded-xl font-black text-xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center ${actionBtnColor} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUpdating ? 'מעדכן...' : nextStatusLabel}
            </button>

            {/* כפתור תשלום - בצד שמאל (אם לא שולם) */}
            {!order.isPaid && (
              <button
                disabled={isUpdating}
                onClick={async () => {
                  if (onPaymentCollected) {
                    setIsUpdating(true); await onPaymentCollected(order); setIsUpdating(false);
                  }
                }}
                className="w-14 h-14 bg-white border-2 border-amber-400 rounded-xl shadow-sm flex items-center justify-center hover:bg-amber-50 shrink-0 relative overflow-visible active:scale-95 transition-all"
              >
                <img
                  src="https://gxzsxvbercpkgxraiaex.supabase.co/storage/v1/object/public/Photos/cashregister.jpg"
                  alt="קופה"
                  className="w-8 h-8 object-contain"
                />
                {/* Badge בפינה ימנית עליונה - בולט החוצה */}
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-md ring-2 ring-white">
                  ₪{order.totalAmount?.toFixed(0)}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- לוגיקה ראשית ---

const KdsScreen = () => {
  const { currentUser } = useAuth();
  const [currentOrders, setCurrentOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [smsToast, setSmsToast] = useState(null); // {show: boolean, message: string }
  const [errorModal, setErrorModal] = useState(null); // {show: boolean, title: string, message: string, details: string, onRetry: function, retryLabel: string }
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [viewMode, setViewMode] = useState('kds'); // 'kds' | 'orders_inventory' | 'tasks_prep'
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  // States for tasks and inventory views
  const [tasksSubTab, setTasksSubTab] = useState('prep'); // 'opening' | 'prep' | 'closing'
  const [inventorySubTab, setInventorySubTab] = useState('counts'); // 'counts' | 'orders'
  const [openingTasks, setOpeningTasks] = useState([]);
  const [prepBatches, setPrepBatches] = useState([]);
  const [closingTasks, setClosingTasks] = useState([]);
  const [supplierOrders, setSupplierOrders] = useState([]);
  const [inventoryCounts, setInventoryCounts] = useState([]);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  const navigate = useNavigate();

  // פונקציה לאיחוד פריטים זהים
  const groupOrderItems = (items) => {
    if (!items || items.length === 0) return [];

    const grouped = [];
    const map = new Map();

    items.forEach(item => {
      // מפתח ייחודי: ID המנה + מחרוזת המודים הממוינת + סטטוס
      // משתמשים ב-modsKey במקום name כדי לאחד פריטים זהים עם אותם מודים
      const key = `${item.menuItemId}| ${item.modsKey || ''}| ${item.status} `;

      if (map.has(key)) {
        const existing = map.get(key);
        existing.quantity += item.quantity;
        existing.ids.push(item.id); // שומרים את כל ה-IDs המקוריים
        existing.totalPrice += item.price * item.quantity;
      } else {
        const newItem = {
          ...item,
          ids: [item.id], // אתחול מערך IDs
          totalPrice: item.price * item.quantity
        };
        map.set(key, newItem);
        grouped.push(newItem);
      }
    });

    return grouped;
  };

  const handleUndoLastAction = async () => {
    if (!lastAction) return;

    setIsLoading(true);
    try {
      console.log('Undoing last action:', lastAction);
      const { error } = await supabase.rpc('update_order_status', {
        p_order_id: lastAction.orderId,
        p_status: lastAction.previousStatus
      });

      if (error) throw error;

      setLastAction(null);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to undo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      // מיפוי של כל ה-optionvalues פעם אחת
      const { data: allOptionValues } = await supabase
        .from('optionvalues')
        .select('id, value_name');

      const optionMap = new Map();
      allOptionValues?.forEach(ov => {
        optionMap.set(String(ov.id), ov.value_name);
        optionMap.set(ov.id, ov.value_name); // למקרה שזה מספר
      });

      // Fetch orders from TODAY only
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const client = getSupabase(currentUser);

      const { data: ordersData, error } = await client.rpc('get_kds_orders', {
        p_date: today.toISOString()
      });

      if (error) throw error;

      const processedOrders = [];

      (ordersData || []).forEach(order => {
        // SAFETY CHECK: If order is completed AND paid, skip it immediately.
        if (order.order_status === 'completed' && order.is_paid) return;

        // Filter items logic
        const rawItems = (order.order_items || [])
          .filter(item => {
            if (item.item_status === 'cancelled' || item.item_status === 'completed' || !item.menu_items?.name) return false;

            const kdsLogic = item.menu_items.kds_routing_logic;
            const isPrepRequired = item.menu_items.is_prep_required;

            // Check mods for override tag
            let hasOverride = false;
            let mods = item.mods;

            // Handle stringified JSON if necessary
            if (typeof mods === 'string') {
              try {
                if (mods.includes('__KDS_OVERRIDE__')) {
                  hasOverride = true;
                } else {
                  const parsed = JSON.parse(mods);
                  if (Array.isArray(parsed) && parsed.includes('__KDS_OVERRIDE__')) hasOverride = true;
                }
              } catch (e) {
                // If simple string contains the tag
                if (mods.includes('__KDS_OVERRIDE__')) hasOverride = true;
              }
            } else if (Array.isArray(mods)) {
              if (mods.includes('__KDS_OVERRIDE__')) hasOverride = true;
            } else if (typeof mods === 'object' && mods?.kds_override) {
              // Fallback for object format
              hasOverride = true;
            }

            // Logic 1: Made to Order (Always show - e.g. Toast, Sandwich)
            if (kdsLogic === 'MADE_TO_ORDER') return true;

            // Logic 2: Conditional (Show only if override - e.g. Salad)
            if (kdsLogic === 'CONDITIONAL') {
              console.log('🥗 CONDITIONAL item check:', {
                name: item.menu_items?.name,
                hasOverride,
                mods: item.mods,
                modsType: typeof item.mods
              });
              return hasOverride;
            }

            // Logic 3: Default (Use is_prep_required flag)
            return isPrepRequired !== false;
          })
          .map(item => {
            let modsArray = [];
            if (item.mods) {
              try {
                const parsed = typeof item.mods === 'string' ? JSON.parse(item.mods) : item.mods;
                if (Array.isArray(parsed)) {
                  modsArray = parsed.map(m => {
                    if (typeof m === 'object' && m?.value_name) return m.value_name;
                    return optionMap.get(String(m)) || String(m);
                  }).filter(m => m && !m.toLowerCase().includes('default') && m !== 'רגיל' && !String(m).includes('KDS_OVERRIDE'));
                }
              } catch (e) { /* ignore */ }
            }

            // Add Custom Note if exists
            if (item.notes) {
              modsArray.push({ name: item.notes, is_note: true });
            }

            // בניית מערך מודים מובנה לרינדור נקי ב-React
            const structuredModifiers = modsArray.map(mod => {
              if (typeof mod === 'object' && mod.is_note) {
                return { text: mod.name, color: 'mod-color-purple', isNote: true };
              }

              const modName = typeof mod === 'string' ? mod : (mod.name || String(mod));
              let color = 'mod-color-gray';

              if (modName.includes('סויה')) color = 'mod-color-lightgreen';
              else if (modName.includes('שיבולת')) color = 'mod-color-beige';
              else if (modName.includes('שקדים')) color = 'mod-color-lightyellow';
              else if (modName.includes('נטול')) color = 'mod-color-blue';
              else if (modName.includes('רותח')) color = 'mod-color-red';
              else if (modName.includes('קצף') && !modName.includes('בלי')) color = 'mod-color-foam-up';
              else if (modName.includes('בלי קצף')) color = 'mod-color-foam-none';

              return { text: modName, color: color, isNote: false };
            });

            const itemName = item.menu_items?.name || 'פריט';
            const itemPrice = item.menu_items?.price || 0;
            const category = item.menu_items?.category || '';

            // מחרוזת מודים ממוינת לאיחוד - משמשת כמפתח ייחודי
            const modsKey = modsArray.map(m => typeof m === 'object' ? m.name : m).sort().join('|');

            return {
              id: item.id,
              menuItemId: item.menu_items?.id, // לטובת האיחוד
              name: itemName, // שם נקי בלבד!
              modifiers: structuredModifiers, // מערך מודים לרינדור
              quantity: item.quantity,
              status: item.item_status,
              price: itemPrice,
              category: category,
              modsKey: modsKey, // מפתח לאיחוד פריטים זהים
              course_stage: item.course_stage || 1,
              item_fired_at: item.item_fired_at
            };

          });

        // Calculate total order amount from ALL non-cancelled items (even if completed/hidden)
        // CRITICAL: Use i.price (includes modifier prices), NOT i.menu_items?.price (base price only)!
        const itemsForTotal = (order.order_items || []).filter(i => i.item_status !== 'cancelled');

        // DEBUG: Log item prices
        console.log('💰 KDS Price Debug for order', order.order_number, ':',
          itemsForTotal.map(i => ({
            name: i.menu_items?.name,
            itemPrice: i.price,
            menuPrice: i.menu_items?.price,
            qty: i.quantity
          }))
        );

        // Use total_amount from DB (includes modifier prices) - fallback to calculated if not available
        // Note: order_items.price is undefined, so we can't calculate with mods from items
        const calculatedTotal = itemsForTotal.reduce((sum, i) => sum + (i.price || i.menu_items?.price || 0) * (i.quantity || 1), 0);
        const totalOrderAmount = order.total_amount || calculatedTotal;

        // Calculate unpaid amount (total - what was already paid)
        const paidAmount = order.paid_amount || 0;
        const unpaidAmount = totalOrderAmount - paidAmount;

        console.log('💰 KDS Total for order', order.order_number, '- Total:', totalOrderAmount, '- Paid:', paidAmount, '- Unpaid:', unpaidAmount);

        const baseOrder = {
          id: order.id,
          orderNumber: order.order_number || `#${order.id?.slice(0, 8) || 'N/A'} `,
          customerName: order.customer_name || 'אורח',
          customerPhone: order.customer_phone,
          isPaid: order.is_paid,
          totalAmount: unpaidAmount > 0 ? unpaidAmount : totalOrderAmount, // Show unpaid amount, or full if nothing paid
          paidAmount: paidAmount,
          fullTotalAmount: totalOrderAmount,
          timestamp: new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          fired_at: order.fired_at,
          ready_at: order.ready_at,
        };

        // SPECIAL CASE: Unpaid Delivered Orders
        // If order is completed but NOT paid, show it as a special card
        if (order.order_status === 'completed' && !order.is_paid) {
          // We need to show items even if they are 'completed' status in DB
          // Re-fetch items for display without filtering 'completed' status
          const rawDisplayItems = (order.order_items || [])
            .filter(item => item.item_status !== 'cancelled' && item.menu_items?.name)
            .map(item => {
              const itemName = item.menu_items?.name || 'פריט';
              // כאן לא צריך קטגוריה או מיון מיוחד כי זה רק לתצוגה ואישור תשלום
              // ⚠️ CRITICAL: Use plain text name, NOT HTML string!
              return {
                id: item.id,
                menuItemId: item.menu_items?.id,
                name: itemName, // שם נקי בלבד!
                quantity: item.quantity,
                price: item.menu_items?.price || 0,
                modifiers: [], // No modifiers needed for payment view
                modsKey: '' // אין מודים במקרה הזה, אבל נשתמש ב-menuItemId לאיחוד
              };
            });

          // איחוד פריטים זהים גם כאן
          const displayItems = groupOrderItems(rawDisplayItems);

          if (displayItems.length > 0) {
            processedOrders.push({
              ...baseOrder,
              orderStatus: 'completed',
              items: displayItems,
              type: 'unpaid_delivered'
            });
          }
          return; // Done with this order
        }

        // Skip orders with no items after filtering (all items cancelled)
        if (!rawItems || rawItems.length === 0) {
          console.log('⏭️ Skipping order', order.order_number, '- no active items (total items:', order.order_items?.length, ')');
          return;
        }

        console.log('✅ Processing order', order.order_number, 'with', rawItems.length, 'active items');

        // DEBUG: Log course stages
        const stages = rawItems.map(i => ({ id: i.id, stage: i.course_stage, status: i.status }));
        console.log('🔍 Item Stages:', JSON.stringify(stages));

        // Group items by Course Stage
        const itemsByStage = rawItems.reduce((acc, item) => {
          const stage = item.course_stage || 1;
          if (!acc[stage]) acc[stage] = [];
          acc[stage].push(item);
          return acc;
        }, {});

        // Process each stage - ONE card per stage, NO splitting by status
        Object.entries(itemsByStage).forEach(([stageStr, stageItems]) => {
          const stage = Number(stageStr);
          const cardId = stage === 1 ? order.id : `${order.id}-stage-${stage}`;

          // Determine the card's overall status based on items
          // Priority: if ANY item is pending/held = delayed, if ANY is in_progress = active, if ALL ready = ready
          const hasHeldItems = stageItems.some(i => i.status === 'held' || i.status === 'pending');
          const hasActiveItems = stageItems.some(i => i.status === 'in_progress' || i.status === 'new');
          const allReady = stageItems.every(i => i.status === 'ready');

          let cardType, cardStatus;
          if (allReady) {
            cardType = 'ready';
            cardStatus = 'ready';
          } else if (hasHeldItems && !hasActiveItems) {
            cardType = 'delayed';
            cardStatus = 'pending';
          } else {
            cardType = 'active';
            cardStatus = 'in_progress';
          }

          const groupedItems = groupOrderItems(stageItems);

          processedOrders.push({
            ...baseOrder,
            id: allReady ? `${cardId}-ready` : cardId,
            originalOrderId: order.id,
            courseStage: stage,
            fired_at: stageItems[0]?.item_fired_at || order.created_at,
            isSecondCourse: stage === 2,
            items: groupedItems,
            type: cardType,
            orderStatus: cardStatus
          });
        });
      });

      // Separate by type for display columns
      // Active and Delayed cards go to top section
      const current = processedOrders.filter(o =>
        (o.type === 'active' || o.type === 'delayed')
      );

      // Sort current:
      current.sort((a, b) => {
        // 1. Course Stage ASC (Course 1 before Course 2)
        const stageA = a.courseStage || 1;
        const stageB = b.courseStage || 1;
        if (stageA !== stageB) return stageA - stageB;

        // 2. Created At ASC (Oldest first, which with flex-row-reverse means oldest on RIGHT)
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      // Completed/Ready Section (Bottom Row)
      // Includes ready orders and unpaid_delivered
      const completed = processedOrders.filter(o =>
        (o.type === 'ready' || o.type === 'active_ready_split' || o.type === 'unpaid_delivered')
      );

      // Sort completed: Unpaid Delivered first (Leftmost in RTL), then others
      completed.sort((a, b) => {
        if (a.type === 'unpaid_delivered' && b.type !== 'unpaid_delivered') return -1;
        if (a.type !== 'unpaid_delivered' && b.type === 'unpaid_delivered') return 1;
        return 0;
      });

      console.log('📊 KDS fetchOrders results:', {
        totalOrders: processedOrders.length,
        currentOrders: current.length,
        completedOrders: completed.length,
        orderStatuses: processedOrders.map(o => ({ id: o.id, status: o.orderStatus, itemsCount: o.items?.length }))
      });

      setCurrentOrders(current);
      setCompletedOrders(completed);
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (err) {
      console.error('שגיאה בטעינת הזמנות:', err);
      setIsLoading(false);
    }
  };

  const handleSendSms = async (orderId, customerName, phone) => {
    if (!phone) return;

    setIsSendingSms(true);
    setErrorModal(null);

    // הודעה גנרית - ניתן להתאים אישית
    const message = `היי ${customerName}, ההזמנה שלכם מוכנה! 🎉, מוזמנים לעגלה לאסוף אותה`;

    const result = await sendSms(phone, message);

    setIsSendingSms(false);

    if (result.success) {
      setSmsToast({ show: true, message: 'הודעה נשלחה בהצלחה!' });
      setTimeout(() => setSmsToast(null), 1000);
    } else {
      if (result.isBlocked) {
        // חסימה מכוונת - רק מציגים הודעה
        setSmsToast({ show: true, message: result.error, isError: true });
        setTimeout(() => setSmsToast(null), 3000);
      } else {
        // כישלון אמיתי - מאפשרים שליחה חוזרת
        setErrorModal({
          show: true,
          title: 'שגיאה בשליחת הודעה',
          message: `לא התקבל אישור שליחה עבור ${customerName} `,
          details: result.error,
          retryLabel: 'נסה שוב',
          onRetry: () => handleSendSms(orderId, customerName, phone)
        });
      }
    }
  };

  const updateOrderStatus = async (orderId, currentStatus) => {
    try {
      // Handle undo action
      if (currentStatus === 'undo_ready') {
        // Logic to revert status to in_progress
        const realOrderId = typeof orderId === 'string' && orderId.endsWith('-ready') ? orderId.replace('-ready', '') : orderId;
        const { error } = await supabase.rpc('update_order_status', {
          p_order_id: realOrderId, // Ensure UUID
          p_status: 'in_progress'
        });
        if (error) throw error;
        await fetchOrders();
        return;
      }

      const statusLower = (currentStatus || '').toLowerCase();

      // Find the order in current orders to check item statuses
      const order = currentOrders.find(o => o.id === orderId);

      // Check if this order has in_progress items (should move to ready)
      // or if it's already ready (should move to completed)
      const hasInProgressItems = order?.items?.some(item =>
        item.status === 'in_progress' || item.status === 'new' || !item.status
      );

      let nextStatus;

      // לוגיקה ברורה:
      // אם יש פריטים in_progress → משנה ל-ready (עובר לשורה תחתונה)
      // אם הסטטוס הוא ready → משנה ל-completed (נעלם)
      if (hasInProgressItems) {
        nextStatus = 'ready';

        // שליחת SMS כשההזמנה מוכנה
        if (order && order.customerPhone) {
          handleSendSms(orderId, order.customerName, order.customerPhone);
        }

      } else if (statusLower === 'ready') {
        // Extract real order ID (remove -ready suffix if present)
        const realOrderId = typeof orderId === 'string' && orderId.endsWith('-ready')
          ? orderId.replace('-ready', '')
          : orderId;

        // בדיקה אם יש חלק מושהה או פעיל להזמנה הזו
        const hasActiveOrDelayedParts = currentOrders.some(o =>
          (o.type === 'delayed' || o.type === 'active') &&
          (o.originalOrderId === realOrderId || o.id === realOrderId)
        );

        // נאסוף את ה-IDs של הפריטים הפעילים מהכרטיס שנמצא ברשימת ה-completedOrders
        const readyOrder = completedOrders.find(o => o.id === orderId);
        let itemIds = [];
        if (readyOrder && readyOrder.items) {
          // תמיכה בפריטים מאוחדים (לכל פריט יש מערך ids)
          itemIds = readyOrder.items.flatMap(i => i.ids || [i.id]);
        }

        // קריאה ל-RPC לביצוע הפעולה האטומית
        const { error } = await supabase.rpc('complete_order_part_v2', {
          p_order_id: String(realOrderId).trim(),  // Trim whitespace from UUID
          p_item_ids: itemIds,
          p_keep_order_open: hasActiveOrDelayedParts
        });

        if (error) throw error;

        setLastAction({ orderId: realOrderId, previousStatus: 'ready' });

        // רענון וסיום
        await fetchOrders();
        return;

      } else {
        console.warn('Cannot update status from:', currentStatus);
        return; // לא לעדכן אם הסטטוס לא מוכר
      }

      // עדכון הסטטוס בבסיס הנתונים
      // If moving to ready, use the RPC to update items too
      if (nextStatus === 'ready') {
        const { error } = await supabase.rpc('mark_order_ready_v2', {
          p_order_id: orderId
        });

        if (error) {
          console.error('Error updating order status:', error);
          throw error;
        }

        setLastAction({ orderId, previousStatus: 'in_progress' });
      } else {
        // Normal update for other statuses (though we mostly use RPCs now)
        const { error } = await client
          .from('orders')
          .update({ order_status: nextStatus })
          .eq('id', orderId);

        if (error) {
          console.error('Error updating order status:', error);
          throw error;
        }
      }

      // רענון רק אחרי שהעדכון הצליח
      await fetchOrders();
    } catch (err) {
      console.error('Unexpected error updating order status:', err);
      setErrorModal({
        show: true,
        title: 'שגיאת התחברות',
        message: 'אין חיבור לרשת או שגיאה בתקשורת עם השרת',
        details: err.message || 'Unknown network error',
        retryLabel: 'נסה שוב',
        onRetry: () => updateOrderStatus(orderId, currentStatus)
      });
    }
  };

  const handleFireItems = async (orderId, itemsToFire) => {
    console.log('🔥 Firing items for order:', orderId, itemsToFire);
    try {
      setIsLoading(true);
      const itemIds = itemsToFire.map(i => i.id);
      const client = getSupabase(currentUser);

      // Use RPC to update items and order status atomically
      const { error } = await client.rpc('fire_items_v2', {
        p_order_id: orderId,
        p_item_ids: itemIds
      });

      if (error) {
        console.error('❌ Error firing items:', error);
        throw error;
      }
      console.log('✅ Fire items RPC success');

      await fetchOrders();
    } catch (err) {
      console.error('Error firing items:', err);
      setErrorModal({
        show: true,
        title: 'שגיאה בהפעלת פריטים',
        message: 'לא הצלחנו לעדכן את סטטוס הפריטים',
        details: err.message,
        retryLabel: 'נסה שוב',
        onRetry: () => handleFireItems(orderId, itemsToFire)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadyItems = async (orderId, itemsToReady) => {
    console.log('✅ Marking items as ready for order:', orderId, itemsToReady);
    try {
      setIsLoading(true);
      const itemIds = itemsToReady.map(i => i.id);
      const client = getSupabase(currentUser);

      // Use RPC to update items to ready status
      const { error } = await client.rpc('mark_items_ready_v2', {
        p_order_id: orderId,
        p_item_ids: itemIds
      });

      if (error) {
        console.error('❌ Error marking items ready:', error);
        throw error;
      }
      console.log('✅ Mark ready RPC success');

      await fetchOrders();
    } catch (err) {
      console.error('Error marking items ready:', err);
      setErrorModal({
        show: true,
        title: 'שגיאה בהעברה למוכן',
        message: 'לא הצלחנו לעדכן את סטטוס הפריטים',
        details: err.message,
        retryLabel: 'נסה שוב',
        onRetry: () => handleReadyItems(orderId, itemsToReady)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentCollected = (order) => {
    setSelectedOrderForPayment(order);
  };

  const handleConfirmPayment = async (orderId) => {
    try {
      // 1. עדכון הסטטוס בשרת
      const client = getSupabase(currentUser);

      const { error } = await client
        .from('orders')
        .update({ is_paid: true })
        .eq('id', orderId);

      if (error) throw error;

      // 2. רענון הממשק
      await fetchOrders();

      // 3. סגירת המודאל
      setSelectedOrderForPayment(null);

    } catch (err) {
      console.error('Error confirming payment:', err);
      setErrorModal({
        show: true,
        title: 'שגיאה באישור תשלום',
        message: 'לא הצלחנו לעדכן את התשלום במערכת',
        details: err.message,
        retryLabel: 'נסה שוב',
        onRetry: () => handleConfirmPayment(orderId)
      });
    }
  };

  // Fetch kitchen tasks and prep batches from API
  const fetchOpeningTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const tasks = await response.json();

      // Filter opening tasks
      const openingTasks = tasks.filter(task =>
        task.status === 'Pending' &&
        (task.description?.includes('פתיחה') || task.category?.includes('opening'))
      );

      setOpeningTasks(openingTasks || []);
    } catch (err) {
      console.error('Error fetching opening tasks:', err);
      setOpeningTasks([]);
    }
  };

  const fetchPrepBatches = async () => {
    try {
      const response = await fetch(`${API_URL}/prep_tasks`);
      if (!response.ok) throw new Error('Failed to fetch prep tasks');
      const tasks = await response.json();

      // Transform tasks to prep batches format
      const prepBatches = tasks
        .filter(task => task.recipe && task.recipe.preparation_quantity > 0)
        .map(task => ({
          id: task.id,
          recipe_id: task.recipe?.id,
          quantity: task.recipe?.preparation_quantity || 1,
          status: 'pending',
          recipes: {
            name: task.description,
            instructions: task.recipe?.instructions
          }
        }));

      setPrepBatches(prepBatches || []);
    } catch (err) {
      console.error('Error fetching prep batches:', err);
      setPrepBatches([]);
    }
  };

  const fetchClosingTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const tasks = await response.json();

      // Filter closing tasks
      const closingTasks = tasks.filter(task =>
        task.status === 'Pending' &&
        (task.description?.includes('סגירה') || task.category?.includes('closing'))
      );

      setClosingTasks(closingTasks || []);
    } catch (err) {
      console.error('Error fetching closing tasks:', err);
      setClosingTasks([]);
    }
  };

  const fetchSupplierOrders = async () => {
    try {
      // Note: Backend doesn't have supplier orders endpoint yet
      // Using Supabase directly for now
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('supplier_orders')
        .select('*, suppliers(name)')
        .in('delivery_status', ['pending', 'arrived'])
        .or(`expected_delivery_date.eq.${today},expected_delivery_date.eq.${tomorrow}`)
        .order('expected_delivery_date', { ascending: true });

      if (error) throw error;
      setSupplierOrders(data || []);
    } catch (err) {
      console.error('Error fetching supplier orders:', err);
      setSupplierOrders([]);
    }
  };

  const fetchInventoryCounts = async () => {
    try {
      const response = await fetch(`${API_URL}/inventory`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventoryCounts(data || []);
    } catch (err) {
      console.error('Error fetching inventory counts:', err);
      setInventoryCounts([]);
    }
  };

  const completeKitchenTask = async (taskId) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip_ingredient_deduction: true })
      });

      if (!response.ok) throw new Error('Failed to complete task');

      // Refresh tasks
      await fetchOpeningTasks();
      await fetchClosingTasks();
    } catch (err) {
      console.error('Error completing kitchen task:', err);
      alert('שגיאה בסימון המשימה כבוצעה');
    }
  };

  const completePrepBatch = async (taskId, recipeId, quantity) => {
    try {
      // Complete the task via API (this will update inventory automatically)
      const response = await fetch(`${API_URL}/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skip_ingredient_deduction: false // Let backend handle ingredient deduction
        })
      });

      if (!response.ok) throw new Error('Failed to complete prep batch');

      // Refresh prep batches and inventory
      await fetchPrepBatches();
      await fetchInventoryCounts();
    } catch (err) {
      console.error('Error completing prep batch:', err);
      alert('שגיאה בסימון ההכנה כבוצעה');
    }
  };

  // Update current hour every minute
  useEffect(() => {
    const updateHour = () => {
      setCurrentHour(new Date().getHours());
    };
    updateHour();
    const interval = setInterval(updateHour, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Load data based on viewMode
  useEffect(() => {
    if (viewMode === 'tasks_prep') {
      if (currentHour >= 8) {
        fetchOpeningTasks();
      }
      fetchPrepBatches();
      if (currentHour >= 16) {
        fetchClosingTasks();
      }
    } else if (viewMode === 'orders_inventory') {
      if (inventorySubTab === 'counts') {
        fetchInventoryCounts();
      } else {
        fetchSupplierOrders();
      }
    }
  }, [viewMode, inventorySubTab, currentHour]);

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // חיבור ל-Realtime
  // חיבור ל-Realtime
  useEffect(() => {
    if (!currentUser) return;

    // Determine schema based on user
    const isDemoUser = currentUser?.whatsapp_phone === '0500000000' || currentUser?.whatsapp_phone === '0501111111';
    const schema = isDemoUser ? 'demo' : 'public';

    console.log(`🔌 Connecting to Realtime on schema: ${schema}`);

    const channel = supabase
      .channel('kds-changes')
      .on('postgres_changes', { event: '*', schema: schema, table: 'orders' }, () => {
        console.log('🔔 Realtime update received (orders)');
        fetchOrders();
      })
      .on('postgres_changes', { event: '*', schema: schema, table: 'order_items' }, () => {
        console.log('🔔 Realtime update received (order_items)');
        fetchOrders();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser]);

  // Render tasks/prep view
  const renderTasksPrepView = () => (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tasks Sub-tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          {currentHour >= 8 && openingTasks.length > 0 && (
            <button
              onClick={() => setTasksSubTab('opening')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tasksSubTab === 'opening' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
            >
              פתיחה
            </button>
          )}
          <button
            onClick={() => setTasksSubTab('prep')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tasksSubTab === 'prep' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
          >
            הכנות
          </button>
          {currentHour >= 16 && (
            <button
              onClick={() => closingTasks.length === 0 && setTasksSubTab('closing')}
              disabled={closingTasks.length > 0}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tasksSubTab === 'closing' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                } ${closingTasks.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              סגירה {closingTasks.length > 0 && '🔒'}
            </button>
          )}
        </div>
      </div>

      {/* Tasks Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tasksSubTab === 'opening' && (
          <div className="space-y-3">
            {openingTasks.length === 0 ? (
              <p className="text-gray-500 text-center">אין משימות פתיחה ממתינות</p>
            ) : (
              openingTasks.map(task => (
                <div key={task.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                  <span className="font-semibold">{task.description || task.name}</span>
                  <button
                    onClick={() => completeKitchenTask(task.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    בוצע
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tasksSubTab === 'prep' && (
          <div className="space-y-3">
            {prepBatches.length === 0 ? (
              <p className="text-gray-500 text-center">אין הכנות ממתינות</p>
            ) : (
              prepBatches.map(batch => (
                <div key={batch.id} className="bg-blue-50 p-4 rounded-xl">
                  <h4 className="font-bold text-lg mb-2">
                    {batch.recipes?.name || 'הכנה'} ×{batch.quantity || 1}
                  </h4>
                  {batch.recipes?.instructions && (
                    <p className="text-sm text-gray-600 mb-3">{batch.recipes.instructions}</p>
                  )}
                  <button
                    onClick={() => completePrepBatch(batch.id, batch.recipe_id, batch.quantity || 1)}
                    className="bg-green-600 text-white w-full py-2 rounded-lg hover:bg-green-700"
                  >
                    הוסף למלאי
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tasksSubTab === 'closing' && (
          <div className="space-y-3">
            {closingTasks.length === 0 ? (
              <p className="text-gray-500 text-center">אין משימות סגירה ממתינות</p>
            ) : (
              closingTasks.map(task => (
                <div key={task.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                  <span className="font-semibold">{task.description || task.name}</span>
                  <button
                    onClick={() => completeKitchenTask(task.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    בוצע
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Render inventory/orders view
  const renderInventoryOrdersView = () => (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Inventory Sub-tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInventorySubTab('counts')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${inventorySubTab === 'counts' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
          >
            ספירות מלאי
          </button>
          <button
            onClick={() => setInventorySubTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${inventorySubTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
          >
            הזמנות ממתינות
          </button>
        </div>
      </div>

      {/* Inventory Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {inventorySubTab === 'counts' && (
          <div className="space-y-3">
            {inventoryCounts.length === 0 ? (
              <p className="text-gray-500 text-center">אין פריטים במלאי</p>
            ) : (
              inventoryCounts.map(item => (
                <div key={item.id} className="bg-white border border-gray-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">פריט #{item.item_id}</h4>
                      <p className="text-sm text-gray-600">
                        מלאי נוכחי: <span className="font-semibold">{item.current_stock || 0}</span>
                      </p>
                      {item.initial_stock && (
                        <p className="text-xs text-gray-500">
                          מלאי התחלתי: {item.initial_stock}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {inventorySubTab === 'orders' && (
          <div className="space-y-3">
            {supplierOrders.length === 0 ? (
              <p className="text-gray-500 text-center">אין הזמנות ספקים ממתינות</p>
            ) : (
              supplierOrders.map(order => (
                <div key={order.id} className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="font-semibold text-lg mb-2">
                    {order.suppliers?.name || 'ספק'}
                  </div>
                  {order.expected_delivery_date && (
                    <div className="text-sm text-gray-600 mb-2">
                      צפויה: {new Date(order.expected_delivery_date).toLocaleDateString('he-IL')}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    סטטוס: {order.delivery_status === 'arrived' ? 'הגיעה' : 'ממתינה'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );

  const handleEditOrder = (order) => {
    navigate('/menu-ordering-interface', {
      state: {
        orderId: order.originalOrderId || order.id,
        isEditMode: true
      }
    });
  };

  return (
    <div className="h-screen w-screen bg-gray-900 flex items-center justify-center p-4 font-heebo overflow-hidden" dir="rtl">
      <style>{kdsStyles}</style>

      {/* מסגרת מלאה (ללא הגבלת רוחב מלאכותית כדי למלא את האייפד) */}
      <div className="bg-slate-50 w-full h-full rounded-[24px] overflow-hidden shadow-2xl flex flex-col relative ring-4 ring-gray-800">
        <Header
          onRefresh={fetchOrders}
          lastUpdated={lastUpdated}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenStaffMenu={() => setIsStaffModalOpen(true)}
          onUndoLastAction={handleUndoLastAction}
          canUndo={!!lastAction}
        />

        {viewMode === 'kds' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* חצי עליון: בטיפול (50%) */}
            <div className="flex-1 border-b-4 border-gray-200 relative bg-slate-100/50 flex flex-col min-h-0">
              <div className="absolute top-3 right-4 bg-white/90 border border-gray-200 px-3 py-1 rounded-full text-xs font-bold text-slate-600 z-10 shadow-sm">
                בטיפול ({currentOrders.length})
              </div>
              <div className="flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap p-6 pb-4 custom-scrollbar">
                <div className="flex h-full flex-row-reverse justify-end gap-4 items-stretch">
                  {currentOrders.map(order => (
                    <OrderCard
                      key={order.id} order={order}
                      onOrderStatusUpdate={updateOrderStatus}
                      onPaymentCollected={handlePaymentCollected}
                      onFireItems={handleFireItems}
                      onReadyItems={handleReadyItems}
                      onEditOrder={handleEditOrder}
                      onRefresh={fetchOrders}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* חצי תחתון: מוכן (50%) */}
            <div className="flex-1 relative bg-green-50/30 flex flex-col min-h-0">
              <div className="absolute top-3 right-4 bg-green-100 border border-green-200 px-3 py-1 rounded-full text-xs font-bold text-green-700 z-10 shadow-sm">
                מוכן למסירה ({completedOrders.length})
              </div>
              <div className="flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap p-6 pb-4 custom-scrollbar">
                <div className="flex h-full flex-row-reverse justify-end gap-4 items-stretch">
                  {completedOrders.map(order => (
                    <OrderCard
                      key={order.id} order={order} isReady={true}
                      onOrderStatusUpdate={updateOrderStatus}
                      onPaymentCollected={handlePaymentCollected}
                      onEditOrder={handleEditOrder}
                      onRefresh={fetchOrders}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'tasks_prep' ? (
          renderTasksPrepView()
        ) : (
          renderInventoryOrdersView()
        )}

        {/* SMS Toast Notification */}
        {smsToast && (
          <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${smsToast.isError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {smsToast.isError ? <AlertTriangle size={24} /> : <Check size={24} />}
            <span className="text-xl font-bold">{smsToast.message}</span>
          </div>
        )}

        {/* Error / Retry Modal (SMS or Network) */}
        {errorModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-[500px] overflow-hidden">
              <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-full text-red-600">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-red-900">{errorModal.title}</h3>
                  <p className="text-red-700 font-medium">{errorModal.message}</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 font-mono text-sm text-gray-600 dir-ltr">
                  {errorModal.details || 'Unknown Error'}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setErrorModal(null)}
                    className="flex-1 py-4 bg-gray-200 text-gray-800 rounded-xl font-bold text-xl hover:bg-gray-300 transition"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={errorModal.onRetry}
                    disabled={isSendingSms}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold text-xl hover:bg-slate-800 transition flex items-center justify-center gap-2"
                  >
                    {isSendingSms ? (
                      <RefreshCw className="animate-spin" />
                    ) : (
                      <>
                        <RefreshCw />
                        {errorModal.retryLabel}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Instruction Modal */}
        <CashPaymentModal
          isOpen={!!selectedOrderForPayment}
          onClose={() => setSelectedOrderForPayment(null)}
          orderId={selectedOrderForPayment?.id}
          orderAmount={selectedOrderForPayment?.totalAmount || 0}
          customerName={selectedOrderForPayment?.customerName}
          onConfirmCash={handleConfirmPayment}
        />

        <StaffQuickAccessModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default KdsScreen;