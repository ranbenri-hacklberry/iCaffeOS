import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import InventoryItemCard from './InventoryItemCard';
import { Search, Filter, CalendarCheck, Truck, AlertTriangle, ClipboardList, ShoppingCart, Send, Copy, Check, X, ArrowRight } from 'lucide-react';

const InventoryScreen = () => {
  const [activeTab, setActiveTab] = useState('counts'); // 'counts' | 'cart' | 'sent_orders'
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [activeSupplierId, setActiveSupplierId] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Draft Orders State: { [itemId]: { qty, item, supplierId } }
  const [draftOrders, setDraftOrders] = useState({});

  // Sent Orders State
  const [sentOrders, setSentOrders] = useState([]);

  // Review Mode State (for finishing order)
  const [reviewSupplierId, setReviewSupplierId] = useState(null);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
    // Load draft from local storage if exists
    const savedDraft = localStorage.getItem('inventory_draft_orders');
    if (savedDraft) {
      try { setDraftOrders(JSON.parse(savedDraft)); } catch (e) { }
    }
    fetchSentOrders();
  }, []);

  // Save draft on change
  useEffect(() => {
    localStorage.setItem('inventory_draft_orders', JSON.stringify(draftOrders));
  }, [draftOrders]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: suppliersData } = await supabase.from('suppliers').select('*');
      const loadedSuppliers = suppliersData || [];
      setSuppliers(loadedSuppliers);

      // Fetch items with joined supplier data
      const { data: itemsData, error } = await supabase
        .from('inventory_items')
        .select(`*, supplier:suppliers(*)`)
        .order('name')
        .range(0, 2000); // Ensure we get all items

      if (error) throw error;
      setItems(itemsData || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentOrders = async () => {
    try {
      // Fetch orders deep select
      // Note: We use simpler join or no deep join if FK issues persist.
      // Trying simpler approach first: just suppliers join, handling items manually if needed or assuming relationships exist.

      const { data, error } = await supabase
        .from('supplier_orders')
        .select(`
          *,
          supplier:suppliers (name),
          order_items:supplier_order_items (
            quantity,
            ordered_quantity_units,
            inventory_item_id
          )
        `)
        .eq('status', 'sent')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching sent orders:", error);
      } else {
        // Transform for display
        // Since we cannot join inventory_items easily due to Schema Cache issues reported,
        // we might display just ID or try to find name from 'items' state if available (it is available in component!).

        const formatted = data.map(order => ({
          id: order.id,
          created_at: order.created_at,
          supplier_name: order.supplier?.name || order.supplier_name || 'ספק כללי / ידני',
          items: order.order_items?.map(oi => {
            // Try to find item in local state (null-safe)
            const localItem = items?.find(i => i.id === oi.inventory_item_id) ?? null;
            return {
              name: localItem?.name || `פריט #${oi.inventory_item_id}`,
              qty: oi.quantity || oi.ordered_quantity_units,
              unit: localItem?.unit || 'יח׳'
            };
          }) || []
        }));
        setSentOrders(formatted);
      }
    } catch (e) {
      console.error("Fetch sent orders exception:", e);
    }
  };

  // Helper: Is Delivery Today
  const isDeliveryToday = (supplier) => {
    if (!supplier || !supplier.delivery_days) return false;
    const todayIndex = new Date().getDay();
    const days = String(supplier.delivery_days).split(',').map(d => parseInt(d.trim()));
    return days.includes(todayIndex);
  };

  // Grouping Logic for Counts View
  const groupedItems = useMemo(() => {
    const groups = {};

    // 1. Initialize groups for known suppliers in DB
    suppliers.forEach(s => {
      groups[s.id] = { supplier: s, items: [], isToday: isDeliveryToday(s) };
    });

    // 2. Initialize catch-all
    if (!groups['uncategorized']) {
      groups['uncategorized'] = { supplier: { id: 'uncategorized', name: 'כללי / ללא ספק' }, items: [], isToday: false };
    }

    items.forEach(item => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return;

      let targetGroupId = 'uncategorized';

      // Primary: Use the relational ID
      if (item.supplier_id && groups[item.supplier_id]) {
        targetGroupId = item.supplier_id;
      }
      // Fallback: Check joined object if key exists
      else if (item.supplier && typeof item.supplier === 'object' && item.supplier.id && groups[item.supplier.id]) {
        targetGroupId = item.supplier.id;
      }
      // Fallback 2: Check text string (For manual DB edits)
      else if (item.supplier && typeof item.supplier === 'string') {
        const supplierName = item.supplier.trim();
        // Try to find existing group by name
        const existingSupplier = suppliers.find(s => s.name === supplierName);
        if (existingSupplier) {
          targetGroupId = existingSupplier.id;
        } else {
          // Create virtual group for this text-only supplier if not exists
          const virtualId = `virtual-${supplierName}`;
          if (!groups[virtualId]) {
            groups[virtualId] = {
              supplier: { id: virtualId, name: supplierName, isVirtual: true },
              items: [],
              isToday: false
            };
          }
          targetGroupId = virtualId;
        }
      }

      groups[targetGroupId].items.push(item);
    });

    return Object.values(groups)
      .filter(g => g.items.length > 0)
      .sort((a, b) => {
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        return a.supplier.name.localeCompare(b.supplier.name);
      });
  }, [items, suppliers, search]);

  // Grouping Logic for Draft Cart View
  const draftGroups = useMemo(() => {
    const groups = {};
    Object.values(draftOrders).forEach(draft => {
      let sId = draft.supplierId || 'uncategorized';
      let sName = draft.supplierName || 'כללי';

      // Resolve name if we have an ID but no name saved in draft
      if (sId !== 'uncategorized' && !sName) {
        const s = suppliers.find(sup => sup.id === sId);
        if (s) sName = s.name;
      }

      if (!groups[sId]) {
        groups[sId] = {
          supplierId: sId,
          supplierName: sName,
          items: []
        };
      }
      groups[sId].items.push(draft);
    });
    return Object.values(groups);
  }, [draftOrders, suppliers]);

  // Handlers
  const handleStockChange = async (itemId, newStock) => {
    // Optimistic
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, current_stock: newStock, last_counted_at: new Date().toISOString() } : i));
    try {
      await supabase.from('inventory_items').update({
        current_stock: newStock,
        last_counted_at: new Date().toISOString()
      }).eq('id', itemId);
    } catch (e) { console.error(e); }
  };

  const handleOrderChange = (itemId, qty) => {
    setDraftOrders(prev => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[itemId];
      } else {
        const item = items.find(i => i.id === itemId);

        // Resolve supplier info for draft
        let supId = 'uncategorized';
        let supName = 'כללי / ללא ספק';

        // 1. Try relational ID first
        if (item.supplier_id) {
          supId = item.supplier_id;
          // Find name from loaded suppliers
          const s = suppliers.find(sup => sup.id === item.supplier_id);
          if (s) supName = s.name;
        }
        // 2. Try joined object
        else if (item.supplier && typeof item.supplier === 'object' && item.supplier.id) {
          supId = item.supplier.id;
          supName = item.supplier.name || 'ספק ללא שם';
        }
        // 3. Try legacy text string
        else if (item.supplier && typeof item.supplier === 'string') {
          const sName = item.supplier.trim();
          supName = sName;

          const existing = suppliers.find(s => s.name === sName);
          if (existing) {
            supId = existing.id;
          } else {
            supId = `virtual-${sName}`;
          }
        }

        next[itemId] = {
          itemId,
          qty,
          itemName: item?.name,
          unit: item?.unit,
          supplierId: supId,
          supplierName: supName
        };
      }
      return next;
    });
  };

  const startReview = (group) => {
    const supplierName = group.supplierName;
    // Generate Text
    let text = `היי ${supplierName}, הזמנה מ [שם העסק]:\n`;
    group.items.forEach(i => {
      text += `- ${i.itemName}: ${i.qty} ${i.unit || 'יח׳'}\n`;
    });
    text += `\nתודה!`;
    setGeneratedText(text);
    setReviewSupplierId(group.supplierId);
  };

  const markAsSent = async () => {
    // 1. Identify items to save
    const itemsToSave = [];

    Object.values(draftOrders).forEach(draft => {
      if (draft.supplierId === reviewSupplierId || (!draft.supplierId && reviewSupplierId === 'uncategorized')) {
        itemsToSave.push({
          itemId: draft.itemId, // Inventory Item ID
          qty: draft.qty
        });
      }
    });

    if (itemsToSave.length === 0) return;

    // 2. Insert Header (supplier_orders)
    // Note: If reviewSupplierId is 'virtual-...' or 'uncategorized', we send null for supplier_id
    const realSupplierId = (typeof reviewSupplierId === 'number') ? reviewSupplierId : null;

    try {
      // Step A: Create Order Header
      const { data: orderData, error: orderError } = await supabase
        .from('supplier_orders')
        .insert({
          supplier_id: realSupplierId,
          status: 'sent',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error("No data returned from order creation");

      const newOrderId = orderData.id;

      // Step B: Create Order Items
      const orderItemsPayload = itemsToSave.map(it => ({
        supplier_order_id: newOrderId,
        inventory_item_id: it.itemId,
        ordered_quantity_units: it.qty, // Changed from quantity to ordered_quantity_units
        quantity: it.qty // Send both just in case, but ordered_quantity_units is the strict one
      }));

      const { error: itemsError } = await supabase
        .from('supplier_order_items')
        .insert(orderItemsPayload);

      if (itemsError) throw itemsError;

      // Success Logic
      setDraftOrders(prev => {
        const next = { ...prev };
        Object.values(next).forEach(draft => {
          if (draft.supplierId === reviewSupplierId || (!draft.supplierId && reviewSupplierId === 'uncategorized')) {
            delete next[draft.itemId];
          }
        });
        return next;
      });
      fetchSentOrders();

    } catch (e) {
      console.error("Save order failed:", e);
      alert("שגיאה בשמירת ההזמנה: " + (e.message || e.details || JSON.stringify(e)));
    }

    setReviewSupplierId(null);
  };

  // Sent Orders Actions
  const markOrderReceived = async (orderId) => {
    // In future: logic to add stock back
    await supabase.from('supplier_orders').update({ status: 'received' }).eq('id', orderId);
    fetchSentOrders();
  };

  // Review Modal matches 1:1 previous logic
  if (reviewSupplierId) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2"><Send size={20} /> אישור ושליחת הזמנה</h3>
            <button onClick={() => setReviewSupplierId(null)} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">ההודעה מוכנה לשליחה. העתק אותה ושלח לספק בווטסאפ/מייל, ואז סמן כ"נשלח".</p>

            <div className="relative">
              <textarea
                value={generatedText}
                readOnly
                className="w-full h-48 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedText).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }).catch(err => console.error('Failed to copy class:', err));
                }}
                className={`absolute top-2 left-2 border shadow-sm p-2 rounded-lg transition-all ${copied ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200'}`}
                title={copied ? "הועתק!" : "העתק ללוח"}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setReviewSupplierId(null)}
                className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200"
              >
                חזור לעריכה
              </button>
              <button
                onClick={markAsSent}
                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                סמן שנשלח
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER ---
  const tabClass = (tabName) => `flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tabName ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`;

  return (
    <div className="space-y-4 pb-20 p-4 font-heebo" dir="rtl">

      {/* 1. Top Tabs Navigation (Fixed like SalesDashboard) */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex justify-center sticky top-0 z-10">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full max-w-md">
          <button onClick={() => setActiveTab('counts')} className={tabClass('counts')}>
            <ClipboardList size={16} /> ספירה
          </button>
          <button onClick={() => setActiveTab('cart')} className={tabClass('cart')}>
            <ShoppingCart size={16} />
            עגלה
            {Object.keys(draftOrders).length > 0 && <span className="mr-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{Object.keys(draftOrders).length}</span>}
          </button>
          <button onClick={() => setActiveTab('sent_orders')} className={tabClass('sent_orders')}>
            <Truck size={16} />
            נשלח
            {sentOrders.length > 0 && <span className="mr-1 bg-amber-500 text-white text-[10px] px-1.5 rounded-full">{sentOrders.length}</span>}
          </button>
        </div>
      </div>

      {/* 2. Secondary Header (Filters & Navigation) */}
      {activeTab === 'counts' && (
        // Changed bg-gray-50/95 backdrop-blur to simple bg-gray-50 for opacity fix, assuming gray-50 matches background
        // Or bg-gray-100 to standard background color if needed. Using bg-[#F9FAFB] (gray-50) solid.
        <div className="sticky top-[60px] z-20 bg-gray-50 py-3 space-y-3 transition-all duration-300 ease-in-out border-b border-gray-200/50 shadow-sm mx-[-16px] px-4">

          {/* A. Search Bar (Always Visible) */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חיפוש פריט..."
              className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-9 py-3 text-sm focus:ring-2 ring-blue-500/50 shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* B. Filter / Navigation */}
          {activeSupplierId !== 'all' ? (
            /* Selected Supplier Mode: Back Button + Title */
            <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-200">
              <button
                onClick={() => setActiveSupplierId('all')}
                className="bg-white p-2.5 rounded-xl text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
              >
                <ArrowRight size={20} />
              </button>
              <div className="bg-blue-600 text-white px-4 py-2 rounded-xl flex-1 shadow-sm flex items-center gap-2">
                <Truck size={18} className="text-blue-100" />
                <span className="font-bold text-lg truncate">
                  {suppliers.find(s => s.id === activeSupplierId)?.name || 'ספק נבחר'}
                </span>
                {/* Delivery Day Badge if applicable */}
                {isDeliveryToday(suppliers.find(s => s.id === activeSupplierId)) && (
                  <span className="bg-amber-400 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-black mr-auto">היום!</span>
                )}
              </div>
            </div>
          ) : (
            /* All Suppliers Mode: List of Pills */
            <div className="flex gap-2 flex-wrap animate-in slide-in-from-left-4 duration-200">
              <button
                onClick={() => setActiveSupplierId('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border h-min transition-all ${activeSupplierId === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                הכל
              </button>
              {suppliers.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSupplierId(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all duration-200 bg-white border-gray-200 text-gray-600 hover:bg-gray-50 ${isDeliveryToday(s) ? 'border-amber-200 bg-amber-50 text-amber-900' : ''}`}
                >
                  {isDeliveryToday(s) && <Truck size={12} className="text-amber-600" />}
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="flex-1 overflow-y-auto p-1 space-y-6">

        {/* VIEW: COUNTS */}
        {activeTab === 'counts' && (
          groupedItems.length === 0 ? (
            <div className="text-center py-10 text-gray-400">לא נמצאו פריטים</div>
          ) : (
            activeSupplierId !== 'all' ? (
              /* SINGLE SUPPLIER VIEW: Flat Grid without Card/Wrapper */
              groupedItems
                .filter(g => g.supplier.id === activeSupplierId)
                .map(group => (
                  <div key={group.supplier.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in zoom-in-95 duration-200">
                    {group.items.map(item => (
                      <InventoryItemCard
                        key={item.id}
                        item={item}
                        onStockChange={handleStockChange}
                        onOrderChange={handleOrderChange}
                        draftOrderQty={draftOrders[item.id]?.qty || 0}
                      />
                    ))}
                  </div>
                ))
            ) : (
              /* ALL SUPPLIERS VIEW: Grouped Cards */
              groupedItems.map(group => (
                <div key={group.supplier.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className={`px-4 py-3 border-b flex justify-between items-center ${group.isToday ? 'bg-amber-50/50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                      <Truck size={18} className={group.isToday ? 'text-amber-600' : 'text-gray-400'} />
                      <h3 className="font-black text-gray-800 text-base">{group.supplier.name}</h3>
                      {group.isToday && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">יום אספקה!</span>}
                    </div>
                    <span className="text-xs bg-white px-2 py-1 rounded border">{group.items.length}</span>
                  </div>
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.items.map(item => (
                      <InventoryItemCard
                        key={item.id}
                        item={item}
                        onStockChange={handleStockChange}
                        onOrderChange={handleOrderChange}
                        draftOrderQty={draftOrders[item.id]?.qty || 0}
                      />
                    ))}
                  </div>
                </div>
              ))
            )
          )
        )}

        {/* VIEW: CART */}
        {activeTab === 'cart' && (
          draftGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ShoppingCart size={48} className="mb-4 text-gray-200" />
              <h3 className="text-lg font-bold text-gray-500">העגלה ריקה</h3>
              <p className="text-sm">עבור ללשונית "ספירה" והוסף פריטים להזמנה</p>
            </div>
          ) : (
            <div className="space-y-4">
              {draftGroups.map(group => (
                <div key={group.supplierId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-black text-gray-800 flex items-center gap-2">
                      <Truck size={18} className="text-blue-500" />
                      {group.supplierName}
                    </h3>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{group.items.length} פריטים</span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3 mb-4">
                      {group.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-dashed border-gray-100 pb-2 last:border-0">
                          <span className="text-gray-800 font-medium">{item.itemName}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono bg-gray-100 px-2 rounded text-gray-600">{item.qty} {item.unit}</span>
                            {/* X to remove */}
                            <button onClick={() => handleOrderChange(item.itemId, 0)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => startReview(group)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition active:scale-[0.98]"
                    >
                      <Check size={18} />
                      סיום הזמנה ויצירת הודעה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* VIEW: SENT ORDERS */}
        {activeTab === 'sent_orders' && (
          sentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Truck size={48} className="mb-4 text-gray-200" />
              <h3 className="text-lg font-bold text-gray-500">אין הזמנות פתוחות</h3>
              <p className="text-sm">הזמנות שנשלחו לספק וטרם התקבלו יופיעו כאן</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-gray-800 text-sm">
                        {order.supplier?.name || order.supplier_name || 'ספק לא ידוע'}
                      </h3>
                      <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('he-IL')} {new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-1 rounded">נשלח • ממתין</span>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2 mb-4">
                      {Array.isArray(order.items) && order.items.map((it, idx) => (
                        <li key={idx} className="text-sm flex justify-between text-gray-700 border-b border-gray-50 pb-1 last:border-0">
                          <span>{it.name || it.itemName}</span>
                          <span className="font-mono bg-gray-100 px-1 rounded">{it.qty} {it.unit}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => markOrderReceived(order.id)}
                      className="w-full py-2 bg-white border border-green-200 text-green-700 hover:bg-green-50 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> סמן שהסחורה התקבלה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>
    </div>
  );
};

export default InventoryScreen;
