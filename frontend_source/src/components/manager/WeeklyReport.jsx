import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  Calendar, 
  Printer, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Percent, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

// ── CONFIG & CONSTANTS ──
const DAYS_OF_WEEK = [
  { index: 0, label: "ראשון", key: "sun" },
  { index: 1, label: "שני", key: "mon" },
  { index: 2, label: "שלישי", key: "tue" },
  { index: 3, label: "רביעי", key: "wed" },
  { index: 4, label: "חמישי", key: "thu" },
  { index: 5, label: "שישי", key: "fri" }
];

export const WeeklyReport = ({ initialWeekOffset = -1 }) => {
  const { currentUser } = useAuth();
  
  // Date selection state
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(initialWeekOffset);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    setSelectedWeekOffset(initialWeekOffset);
  }, [initialWeekOffset]);

  const [menuItems, setMenuItems] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // SMS status
  const [smsSending, setSmsSending] = useState(false);
  const [smsStatus, setSmsStatus] = useState(null); // 'success' | 'error' | null

  // ── WEEK RANGE CALCULATOR ──
  const getWeekRange = (weeksOffset) => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sun, 1 = Mon, etc.
    
    // Find the Sunday of the target week
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - day + (weeksOffset * 7));
    sunday.setHours(0, 0, 0, 0);
    
    // Find the Friday of the target week
    const friday = new Date(sunday);
    friday.setDate(sunday.getDate() + 5);
    friday.setHours(23, 59, 59, 999);
    
    return { start: sunday, end: friday };
  };

  // Generate list of weeks for dropdown selection
  const weeksList = useMemo(() => {
    const list = [];
    for (let i = 0; i > -8; i--) {
      const { start, end } = getWeekRange(i);
      const label = i === 0 ? 'השבוע הנוכחי' : i === -1 ? 'שבוע שעבר' : `לפני ${Math.abs(i)} שבועות`;
      list.push({
        offset: i,
        start,
        end,
        label: `${label} (${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1})`
      });
    }
    return list;
  }, []);

  const activeWeek = useMemo(() => getWeekRange(selectedWeekOffset), [selectedWeekOffset]);

  // ── DATA FETCHING ──
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.business_id) return;
      setLoading(true);
      setError(null);
      setSmsStatus(null);

      try {
        // 1. Fetch all active menu items
        const { data: items, error: itemsError } = await supabase
          .from('menu_items')
          .select('id, name, price, category')
          .eq('business_id', currentUser.business_id)
          .order('name');
        
        if (itemsError) throw itemsError;
        setMenuItems(items || []);

        // 2. Fetch sales using existing RPC function
        const { data: sales, error: salesError } = await supabase.rpc('get_sales_data', {
          p_business_id: currentUser.business_id,
          p_start_date: activeWeek.start.toISOString(),
          p_end_date: activeWeek.end.toISOString()
        });

        if (salesError) throw salesError;
        setSalesData(sales || []);
      } catch (err) {
        console.error('❌ Error fetching report data:', err);
        setError('שגיאה בטעינת נתוני המכירות. ודא חיבור תקין לרשת.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedWeekOffset, currentUser?.business_id]);

  // ── DATA PROCESSING (MATRIX CALCULATION) ──
  const processedData = useMemo(() => {
    // 1. Create a map of menu_item_id -> daily quantities and total revenues
    const salesMap = {};
    let totalRevenue = 0;
    let totalOrders = salesData.length;

    salesData.forEach(order => {
      totalRevenue += Number(order.total || 0);

      (order.order_items || []).forEach(item => {
        const itemName = item.menu_items?.name || item.name;
        if (!itemName) return;

        // Find menu item by name in menuItems
        const menuItem = menuItems.find(mi => mi.name?.trim().toLowerCase() === itemName.trim().toLowerCase());
        if (!menuItem) return;

        const itemId = menuItem.id;

        if (!salesMap[itemId]) {
          salesMap[itemId] = {
            sun: { qty: 0, rev: 0 },
            mon: { qty: 0, rev: 0 },
            tue: { qty: 0, rev: 0 },
            wed: { qty: 0, rev: 0 },
            thu: { qty: 0, rev: 0 },
            fri: { qty: 0, rev: 0 },
            totalQty: 0,
            totalRev: 0
          };
        }

        const date = new Date(order.created_at);
        const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, etc.
        const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
        const dayKey = dayKeys[dayOfWeek];

        if (dayKey) {
          const qty = Number(item.quantity || 0);
          const price = Number(item.menu_items?.price || item.price || menuItem.price || 0);
          const rev = qty * price;

          salesMap[itemId][dayKey].qty += qty;
          salesMap[itemId][dayKey].rev += rev;
          salesMap[itemId].totalQty += qty;
          salesMap[itemId].totalRev += rev;
        }
      });
    });

    // 2. Group menu items by category and inject their sales data
    const categoriesMap = {};

    menuItems.forEach(item => {
      const cat = item.category || 'אחר';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          name: cat,
          items: [],
          totals: {
            sun: 0,
            mon: 0,
            tue: 0,
            wed: 0,
            thu: 0,
            fri: 0,
            totalQty: 0,
            totalRev: 0
          }
        };
      }

      const itemSales = salesMap[item.id] || {
        sun: { qty: 0, rev: 0 },
        mon: { qty: 0, rev: 0 },
        tue: { qty: 0, rev: 0 },
        wed: { qty: 0, rev: 0 },
        thu: { qty: 0, rev: 0 },
        fri: { qty: 0, rev: 0 },
        totalQty: 0,
        totalRev: 0
      };

      categoriesMap[cat].items.push({
        ...item,
        sales: itemSales
      });

      // Sum up category daily totals
      DAYS_OF_WEEK.forEach(day => {
        categoriesMap[cat].totals[day.key] += itemSales[day.key].qty;
      });
      categoriesMap[cat].totals.totalQty += itemSales.totalQty;
      categoriesMap[cat].totals.totalRev += itemSales.totalRev;
    });

    // Convert categories map to sorted array
    const categoriesList = Object.values(categoriesMap).sort((a, b) => b.totals.totalRev - a.totals.totalRev);

    return {
      categories: categoriesList,
      totalRevenue,
      totalOrders,
      aov: totalOrders > 0 ? totalRevenue / totalOrders : 0
    };
  }, [menuItems, salesData]);

  // ── SMS SHARE METHOD ──
  const sendSmsReport = async () => {
    if (!currentUser?.business_id) return;
    setSmsSending(true);
    setSmsStatus(null);

    try {
      // Find employee phone number or prompt
      const phone = currentUser?.whatsapp_phone || currentUser?.phone || '0548317887';
      const startStr = `${activeWeek.start.getDate()}/${activeWeek.start.getMonth() + 1}`;
      const endStr = `${activeWeek.end.getDate()}/${activeWeek.end.getMonth() + 1}`;
      
      const text = `📊 דוח מכירות שבועי (${startStr} - ${endStr})
סה"כ פדיון: ₪${processedData.totalRevenue.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
סה"כ הזמנות: ${processedData.totalOrders}
ממוצע להזמנה: ₪${processedData.aov.toFixed(1)}

קישור לצפייה בדוח המלא:
http://${window.location.host}/data-manager-interface?tab=reports&week=${selectedWeekOffset}`;

      console.log('Sending SMS via backend:', { to: phone, text, businessId: currentUser.business_id });

      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone,
          text,
          businessId: currentUser.business_id
        })
      });

      const result = await response.json();
      if (result.success) {
        setSmsStatus('success');
      } else {
        throw new Error(result.error || 'Server error');
      }
    } catch (err) {
      console.error('Failed to send SMS report:', err);
      setSmsStatus('error');
    } finally {
      setSmsSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <span className="text-sm font-bold text-gray-500">טוען את המכירות השבועיות ומכין את הדוח...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <AlertTriangle className="text-red-500 mb-2" size={48} />
        <h3 className="text-lg font-bold text-gray-800">תקלה בטעינת הדוח</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">{error}</p>
        <button 
          onClick={() => setSelectedWeekOffset(selectedWeekOffset)} // Trigger refetch
          className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm shadow hover:bg-blue-700 active:scale-95 transition-all"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-6 pb-24 p-4 lg:p-6 max-w-7xl mx-auto w-full" dir="rtl">
      
      {/* ── STYLE BLOCK FOR PRINT MODE ── */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 12px;
          }
          header, nav, footer, button, select, .print\\:hidden {
            display: none !important;
          }
          .print\\:full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print\\:page-break {
            page-break-before: always;
          }
          table {
            page-break-inside: avoid;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

      {/* ── HEADER & NAVIGATION (HIDDEN ON PRINT) ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-600 shrink-0" size={24} />
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">טווח דוח מכירות שבועי</span>
              <select
                value={selectedWeekOffset}
                onChange={(e) => setSelectedWeekOffset(Number(e.target.value))}
                className="bg-transparent text-sm font-black text-gray-800 focus:outline-none border-b border-gray-200 pb-1 cursor-pointer pr-6"
              >
                {weeksList.map(week => (
                  <option key={week.offset} value={week.offset}>
                    {week.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all select-none">
            <input 
              type="checkbox" 
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>הצג מנות שנמכרו בלבד</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={sendSmsReport}
            disabled={smsSending}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${
              smsStatus === 'success' 
                ? 'bg-green-50 border-green-200 text-green-600'
                : smsStatus === 'error'
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-blue-50 border-blue-100 hover:bg-blue-100 text-blue-600 active:scale-95'
            }`}
          >
            {smsSending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : smsStatus === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <MessageSquare size={16} />
            )}
            {smsSending ? 'שולח...' : smsStatus === 'success' ? 'נשלח בסמס!' : smsStatus === 'error' ? 'שגיאה בשליחה' : 'שלח דוח בסמס'}
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black shadow hover:bg-slate-700 active:scale-95 transition-all"
          >
            <Printer size={16} />
            <span>הדפס דוח / שמור PDF</span>
          </button>
        </div>
      </div>

      {/* ── PRINT-ONLY REPORT TITLE HEADER ── */}
      <div className="hidden print:block text-center space-y-1 pb-4 border-b border-gray-200">
        <h1 className="text-xl font-black text-gray-900">דוח מכירות שבועי - {currentUser?.business_name || 'עגלת הקפה'}</h1>
        <p className="text-sm font-bold text-gray-500">
          טווח תאריכים: {activeWeek.start.toLocaleDateString('he-IL')} - {activeWeek.end.toLocaleDateString('he-IL')} (ראשון - שישי)
        </p>
      </div>

      {/* ── SUMMARY KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
        {/* Card 1: Revenue */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between h-28 border border-blue-500/20">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-100">סה"כ פדיון שבועי</span>
          <span className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            ₪{processedData.totalRevenue.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-blue-200 mt-1">מכירות ימי ראשון עד שישי כולל</span>
        </div>

        {/* Card 2: Orders */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-28">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">סה"כ הזמנות</span>
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 mt-1">
            {processedData.totalOrders.toLocaleString('he-IL')}
          </span>
          <span className="text-[10px] text-gray-500 mt-1">עסקאות שבוצעו בקופות ובקיוסק</span>
        </div>

        {/* Card 3: AOV */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-28">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">ממוצע להזמנה (AOV)</span>
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 mt-1">
            ₪{processedData.aov.toLocaleString('he-IL', { maximumFractionDigits: 1 })}
          </span>
          <span className="text-[10px] text-gray-500 mt-1">סל קניות ממוצע ללקוח בשבוע זה</span>
        </div>
      </div>

      {/* ── CATEGORY TABLES CONTAINER ── */}
      <div className="space-y-6 print:full-width">
        {processedData.categories.map((category, catIdx) => {
          const activeItems = showActiveOnly 
            ? category.items.filter(item => item.sales.totalQty > 0)
            : category.items;
          
          if (activeItems.length === 0) return null;

          return (
            <div 
              key={category.name} 
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${catIdx > 0 ? 'print:page-break' : ''}`}
            >
              {/* Category Header */}
              <div className="bg-slate-50 border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                <h3 className="font-black text-gray-800 text-sm sm:text-base flex items-center gap-2">
                  <span>{category.name}</span>
                  <span className="text-xs bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                    {activeItems.length} מנות פעילות
                  </span>
                </h3>
                <span className="text-xs sm:text-sm font-black text-blue-600">
                  סה"כ: ₪{category.totals.totalRev.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Table Wrapper for Horizontal Scroll */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-5 py-3 text-right">שם המנה</th>
                      {DAYS_OF_WEEK.map(day => (
                        <th key={day.key} className="px-3 py-3 text-center w-16">{day.label}</th>
                      ))}
                      <th className="px-4 py-3 text-center w-24">סה"כ כמות</th>
                      <th className="px-5 py-3 text-left w-28">סה"כ פדיון</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeItems
                      .sort((a, b) => b.sales.totalRev - a.sales.totalRev)
                      .map(item => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-slate-50/40 text-xs text-gray-700 transition-colors">
                          {/* Item Name */}
                          <td className="px-5 py-3.5 font-bold text-slate-800">{item.name}</td>
                          
                          {/* Days Sales Quantity */}
                          {DAYS_OF_WEEK.map(day => {
                            const qty = item.sales[day.key].qty;
                            return (
                              <td 
                                key={day.key} 
                                className={`px-3 py-3.5 text-center ${qty > 0 ? 'font-black text-slate-900 bg-blue-50/10' : 'text-gray-300'}`}
                              >
                                {qty > 0 ? qty : '-'}
                              </td>
                            );
                          })}

                          {/* Total Qty */}
                          <td className="px-4 py-3.5 text-center font-black text-slate-900 bg-slate-50/30">
                            {item.sales.totalQty}
                          </td>

                          {/* Total Revenue */}
                          <td className="px-5 py-3.5 text-left font-black text-slate-900 bg-slate-50/50">
                            ₪{item.sales.totalRev.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                    ))}

                    {/* Category Totals Row */}
                    <tr className="bg-slate-50/80 font-black text-slate-900 text-xs border-t-2 border-slate-100">
                      <td className="px-5 py-4">סה"כ קטגוריה</td>
                      
                      {/* Days Total Quantities */}
                      {DAYS_OF_WEEK.map(day => (
                        <td key={day.key} className="px-3 py-4 text-center">
                          {category.totals[day.key]}
                        </td>
                      ))}

                      {/* Total Qty */}
                      <td className="px-4 py-4 text-center bg-slate-100/50">
                        {category.totals.totalQty}
                      </td>

                      {/* Total Revenue */}
                      <td className="px-5 py-4 text-left bg-slate-100/80 text-blue-600">
                        ₪{category.totals.totalRev.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default WeeklyReport;
