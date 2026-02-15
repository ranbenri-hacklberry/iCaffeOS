import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { updateOrderTimestamp } from '../../../lib/orders/orderTimeService';
import { useAuth } from '../../../context/AuthContext';

const OrderCard = ({ order, onOrderStatusUpdate, onPaymentCollected, onRefresh, onFireItems, onReadyItems }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [inventoryStatus, setInventoryStatus] = useState({});
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [isCollectingPayment, setIsCollectingPayment] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const baseThreshold = 5;
  const cashThreshold = 4;
  const items = order?.items ?? [];
  const paymentMethod = order?.paymentMethod || (order?.isPaid ? 'credit_card' : 'cash');
  const requiresCashLayout = useMemo(() => {
    return paymentMethod === 'cash' && !order?.isPaid;
  }, [paymentMethod, order?.isPaid]);

  const effectiveThreshold = requiresCashLayout ? cashThreshold : baseThreshold;
  const isWideCard = requiresCashLayout
    ? items?.length >= effectiveThreshold
    : items?.length > effectiveThreshold;
  const cardWidth = isWideCard ? 'w-[420px]' : 'w-[240px]';
  const cardMinWidth = isWideCard ? 'min-w-[420px]' : 'min-w-[240px]';

  // Helper to format mods from JSONB to short, readable labels
  const formatModsToLabels = (mods) => {
    if (!mods) return [];

    // Parse if mods is a JSON string
    let parsedMods = mods;
    if (typeof mods === 'string') {
      try {
        parsedMods = JSON.parse(mods);
      } catch (e) {
        console.error('Error parsing mods:', e);
        return [];
      }
    }

    if (!parsedMods || typeof parsedMods !== 'object') return [];

    // Handle Array format (New flat structure with markers OR old simple array)
    if (Array.isArray(parsedMods)) {
      // const isKdsOverride = parsedMods.includes('__KDS_OVERRIDE__'); // We don't want to show this anymore
      const note = parsedMods.find(m => typeof m === 'string' && m.startsWith('__NOTE__:'))?.split('__NOTE__:')[1];

      const cleanMods = parsedMods.filter(m => m !== '__KDS_OVERRIDE__' && !(typeof m === 'string' && m.startsWith('__NOTE__:')));

      const labels = [];
      // if (isKdsOverride) labels.push('⚠️ דורש הכנה'); // Hidden per user request
      if (note) labels.push(`📝 ${note}`);

      // If it's a mix of strings and numbers, just return it as is (clean)
      return [...labels, ...cleanMods];
    }

    // Handle Object format (Old structure or previous attempt)
    const labels = [];
    // if (parsedMods.kds_override) {
    //   labels.push('⚠️ דורש הכנה');
    // }
    if (parsedMods.custom_note) {
      labels.push(`📝 ${parsedMods.custom_note}`);
    }

    // If mods has an 'options' array (from our new structure), use that
    if (Array.isArray(parsedMods.options)) {
      return [...labels, ...parsedMods.options];
    }

    // If mods has a 'list' array (from my previous thought), use that
    if (Array.isArray(parsedMods.list)) {
      return [...labels, ...parsedMods.list];
    }

    // Default values that should be filtered out
    const defaultValues = ['רגיל', 'רגילה', 'רגילים', 'רגילות', 'חלב רגיל', 'חלב', 'חם', 'נורמלי', 'קפאין'];

    // Mapping for English keys to Hebrew labels
    const keyToLabelMap = {
      'milk_type': 'סוג חלב',
      'foam': 'קצף',
      'foam_level': 'רמת קצף',
      'temperature': 'טמפרטורה',
      'decaf': 'נטול קפאין',
      'size': 'גודל',
      'water_ratio': 'יחס מים',
      'deconstructed': 'מפורק',
      'extra_hot': 'רותח',
    };

    // Mapping for English values to Hebrew
    const valueToLabelMap = {
      'soy': 'סויה',
      'oat': 'שיבולת שועל',
      'almond': 'שקדים',
      'regular': 'רגיל',
      'lots_of_foam': 'הרבה קצף',
      'no_foam': 'בלי קצף',
      'extra_hot': 'רותח',
      'hot': 'חם',
      'deconstructed': 'מפורק',
      'water_base': 'בסיס מים',
      'decaf': 'נטול קפאין',
    };

    console.log('🔍 formatModsToLabels - Parsed mods:', parsedMods);

    // If mods is an array of numbers (old format), convert to object
    if (Array.isArray(parsedMods)) {
      console.log('🔍 Mods is array, converting...');
      // This shouldn't happen, but handle it just in case
      return [];
    }

    return Object.entries(parsedMods)
      .filter(([, value]) => value && value !== 0 && value !== 'regular' && value !== 'default') // Filter mods with value 0 or default
      .map(([key, value]) => {
        console.log('🔍 Processing mod:', { key, value, valueType: typeof value, isNumericKey: /^\d+$/.test(key) });

        // If key is a number (groupId from old format), try to translate based on value
        if (/^\d+$/.test(key)) {
          // Key is numeric (groupId), value should be the label
          // If value is also numeric, we can't translate it without optionGroups
          if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
            // Both key and value are numbers - can't translate without optionGroups
            console.warn('🔍 Both key and value are numeric, cannot translate:', { key, value });
            return null;
          }
          // Value is a string (should be valueName), use it directly
          if (typeof value === 'string') {
            return value;
          }
          return null;
        }

        // If value is a number (valueId from old format), try to translate based on key
        if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
          // Map common groupId patterns to Hebrew labels
          const keyToLabel = {
            'size': 'גודל',
            'milk_type': 'חלב',
            'foam': 'קצף',
            'foam_level': 'קצף',
            'temperature': 'טמפרטורה',
            'extra_hot': 'רותח',
            'decaf': 'נטול קפאין',
            'water_ratio': 'בסיס מים',
            'deconstructed': 'מפורק',
          };

          // If key matches a known pattern, return the Hebrew label
          if (keyToLabel[key]) {
            return keyToLabel[key];
          }

          // Otherwise, try to extract meaning from key name
          const keyWords = key.replace(/_/g, ' ').split(' ');
          if (keyWords.includes('milk') || keyWords.includes('חלב')) {
            // For milk types, we can't know the exact type from just the ID, so skip
            return null;
          }
          if (keyWords.includes('foam') || keyWords.includes('קצף')) {
            return 'קצף';
          }
          if (keyWords.includes('hot') || keyWords.includes('רותח')) {
            return 'רותח';
          }
          if (keyWords.includes('decaf') || keyWords.includes('קפאין')) {
            return 'נטול קפאין';
          }

          // If we can't translate, return null to filter it out
          return null;
        }

        // If value is a Hebrew string, use it directly
        if (typeof value === 'string' && /[\u0590-\u05FF]/.test(value)) {
          let readableValue = value;

          // Handle milk types: "חלב סויה" -> "סויה"
          if (readableValue.includes('חלב')) {
            const words = readableValue.split(' ');
            const milkType = words.find(w => w !== 'חלב' && w !== 'רגיל');
            if (milkType) return milkType;
          }

          // Handle foam: "הרבה קצף" -> "הרבה קצף", "בלי קצף" -> "בלי קצף"
          if (readableValue.includes('קצף')) {
            if (readableValue.includes('הרבה')) return 'הרבה קצף';
            if (readableValue.includes('בלי') || readableValue.includes('ללא')) return 'בלי קצף';
            return 'קצף';
          }

          // Handle decaf: "נטול קפאין" -> "נטול קפאין"
          if (readableValue.includes('קפאין')) {
            if (readableValue.includes('נטול') || readableValue.includes('ללא')) {
              return 'נטול קפאין';
            }
            return null; // Filter out regular "קפאין"
          }

          // Handle "בסיס מים" -> "בסיס מים"
          if (readableValue.includes('בסיס')) {
            return readableValue; // Keep "בסיס מים" as is
          }

          // Handle "בלי" or "ללא" phrases
          const words = readableValue.split(' ');
          if (words.length === 2 && (words[0] === 'בלי' || words[0] === 'ללא')) {
            return readableValue; // Keep "בלי קצף" as is
          }

          // Filter out default values
          if (defaultValues.some(defaultVal => readableValue.toLowerCase().includes(defaultVal.toLowerCase()))) {
            return null;
          }

          return readableValue;
        }

        // If value is an English key, translate it
        if (typeof value === 'string' && valueToLabelMap[value]) {
          return valueToLabelMap[value];
        }

        // If key is an English key, use the key mapping
        if (keyToLabelMap[key]) {
          // For specific keys, return the translated value
          if (key === 'milk_type' && valueToLabelMap[value]) {
            return valueToLabelMap[value];
          }
          if (key === 'foam' || key === 'foam_level') {
            if (value === 'lots_of_foam' || value === 'lots') return 'הרבה קצף';
            if (value === 'no_foam' || value === 'none') return 'בלי קצף';
            return 'קצף';
          }
          if (key === 'temperature' || key === 'extra_hot') {
            if (value === 'extra_hot' || value === true) return 'רותח';
            return null; // Filter out regular temperature
          }
          if (key === 'decaf' && (value === true || value === 'decaf')) {
            return 'נטול קפאין';
          }
          if (key === 'water_ratio' && value === 'water_base') {
            return 'בסיס מים';
          }
          if (key === 'deconstructed' && (value === true || value === 'deconstructed')) {
            return 'מפורק';
          }
        }

        // Convert key from snake_case to readable text as fallback
        let readableKey = key.replace(/_/g, ' ');
        const words = readableKey.split(' ');

        // Filter out default values
        if (defaultValues.some(defaultVal => readableKey.toLowerCase().includes(defaultVal.toLowerCase()))) {
          return null;
        }

        // Return the last word (usually the modifier) or the full key if single word
        return words.length === 1 ? words[0] : words[words.length - 1];
      })
      .filter(Boolean)
      .filter((label, index, self) => self.indexOf(label) === index); // Remove duplicates
  };

  // CRITICAL FIX: item.name already contains formatted mods as HTML from fetchOrders
  // We should NOT add mods again to avoid duplication
  const createDisplayName = (itemName) => {
    // Simply return the name as-is - it already contains the formatted mods HTML
    return itemName || 'פריט לא זמין';
  };

  // Check inventory status for all items when component mounts
  useEffect(() => {
    const checkInventoryForItems = async () => {
      if (!items || items?.length === 0) {
        setIsLoadingInventory(false);
        return;
      }

      setIsLoadingInventory(true);
      const statusMap = {};

      // Check inventory for each menu item
      for (const item of items) {
        if (item?.menuItemId) {
          try {
            // Clean item name from HTML tags for logging
            const cleanItemName = item?.baseName || item?.name?.replace(/<[^>]+>/g, '').trim() || 'Unknown';

            // Ensure menuItemId is a number
            const menuItemIdNum = typeof item.menuItemId === 'number'
              ? item.menuItemId
              : parseInt(item.menuItemId, 10);

            if (isNaN(menuItemIdNum)) {
              console.warn(`Invalid menuItemId for item ${cleanItemName}:`, item.menuItemId);
              statusMap[item?.id] = {
                isFullyAvailable: true,
                missingIngredients: [],
                menuItemName: cleanItemName
              };
              continue;
            }

            const url = `/api/inventory/check-item?menuItemId=${menuItemIdNum}`;
            const response = await fetch(url);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const text = await response.text();
              throw new Error(`Expected JSON but got: ${contentType}. Response: ${text.substring(0, 100)}`);
            }

            const data = await response.json();

            statusMap[item?.id] = {
              isFullyAvailable: data?.isFullyAvailable || false,
              missingIngredients: data?.missingIngredients || [],
              menuItemName: data?.menuItemName || cleanItemName
            };
          } catch (error) {
            // Clean item name from HTML tags for error logging
            const cleanItemName = item?.baseName || item?.name?.replace(/<[^>]+>/g, '').trim() || 'Unknown';
            console.error(`Failed to check inventory for item ${cleanItemName} (menuItemId: ${item?.menuItemId}):`, error);
            // Assume available if API fails
            statusMap[item?.id] = {
              isFullyAvailable: true,
              missingIngredients: [],
              menuItemName: cleanItemName
            };
          }
        }
      }

      setInventoryStatus(statusMap);
      setIsLoadingInventory(false);
    };

    checkInventoryForItems();
  }, [items]);

  // Get order background color based on status - CRITICAL DESIGN UPDATE
  const getOrderBackgroundColor = (orderStatus) => {
    switch (orderStatus) {
      case 'new':
        return 'bg-yellow-50'; // Very light yellow/white
      case 'in_progress':
        return 'bg-blue-50'; // Light blue/aqua
      case 'ready':
        return 'bg-green-50'; // Light green
      default:
        return 'bg-gray-50';
    }
  };

  // Get status color for status badge
  const getStatusColor = (orderStatus) => {
    switch (orderStatus) {
      case 'new':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get next action button text and color based on CRITICAL flow
  const getActionButton = (orderStatus) => {
    switch (orderStatus) {
      case 'new':
        return { text: 'התחל הכנה', color: 'bg-green-600 hover:bg-green-700', showButton: true };
      case 'in_progress':
        return { text: 'מוכן', color: 'bg-green-600 hover:bg-green-700', showButton: true };
      case 'ready':
        return { text: 'נמסר', color: 'bg-green-600 hover:bg-green-700', showButton: true };
      default:
        return { text: 'עדכן', color: 'bg-gray-600 hover:bg-gray-700', showButton: false };
    }
  };

  // Format Hebrew status text
  const getStatusText = (orderStatus) => {
    switch (orderStatus) {
      case 'new':
        return 'חדש';
      case 'in_progress':
        return 'בהכנה';
      case 'ready':
        return 'מוכן';
      default:
        return 'לא ידוע';
    }
  };

  // CRITICAL: Order card border styling based on payment status
  const getOrderCardBorder = () => {
    if (!order?.isPaid) {
      return 'border-4 border-red-500'; // Thick red/orange border for unpaid
    }
    return 'border border-green-200'; // Subtle light green border for paid
  };

  const actionButton = getActionButton(order?.orderStatus);
  const isClickable = order?.orderStatus === 'new';
  const totalAmountDisplay = Number(order?.totalAmount || 0)?.toFixed(2);

  const handleCollectPayment = async (orderId) => {
    try {
      setIsCollectingPayment(true);
      const { error } = await supabase?.from('orders')?.update({ is_paid: true })?.eq('id', orderId);
      if (error) {
        throw error;
      }
      onPaymentCollected?.(orderId);
    } catch (err) {
      console.error('Error collecting payment:', err);
    } finally {
      setIsCollectingPayment(false);
    }
  };

  const handleReadyAction = (orderId) => {
    if (order?.isPaid) {
      onOrderStatusUpdate?.(orderId, order?.orderStatus);
    } else {
      handleCollectPayment(orderId);
    }
  };

  const handleOrderClick = () => {
    if (order?.orderStatus === 'new' || order?.orderStatus === 'in_progress') {
      onOrderStatusUpdate?.(order?.id, order?.orderStatus);
    }
  };

  const handleEditOrder = () => {
    // Navigate to menu ordering interface with edit mode
    const editOrderData = {
      orderId: order?.id,
      customerName: order?.customerName,
      customerPhone: order?.customerPhone,
      items: order?.items?.map(item => ({
        ...item,
        // Convert back to the format expected by the menu interface
        selectedOptions: item?.mods || [],
        isDelayed: item?.course_stage === 2
      })),
      isPaid: order?.isPaid,
      paymentMethod: order?.paymentMethod,
      totalAmount: order?.totalAmount
    };

    // Store edit data in sessionStorage for the menu interface to pick up
    sessionStorage.setItem('editOrderData', JSON.stringify(editOrderData));
    sessionStorage.setItem('order_origin', 'kds'); // Set origin to return later
    // Navigate to menu ordering interface with edit data
    navigate(`/menu-ordering-interface?editOrderId=${order?.id}`);
  };

  const handleFire = async (e) => {
    e?.stopPropagation();
    if (order?.fired_at || isUpdating) return;
    setIsUpdating(true);
    try {
      // Use the onFireItems prop if available (New Logic)
      if (onFireItems) {
        // For KDS split cards, we need to fire specific items
        // If items have 'ids' (grouped), use them. Otherwise use 'id'.
        const flatIds = order.items.flatMap(i => i.ids || [i.id]);
        const itemsPayload = flatIds.map(id => ({ id }));
        await onFireItems(order.originalOrderId || order.id, itemsPayload);
      } else {
        // Fallback to old logic (Order level timestamp)
        const { success } = await updateOrderTimestamp(order.id, 'fired_at', currentUser);
        if (success) onRefresh?.();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReady = async (e) => {
    e?.stopPropagation();

    // Check if items have been fired (status is 'in_progress')
    const itemsFired = order?.items?.some(item =>
      item.status === 'in_progress' || item.item_fired_at
    ) || order?.fired_at;

    // Check if all items are already ready
    const allReady = order?.items?.every(item => item.status === 'ready');

    console.log('🟢 handleReady called:', {
      orderId: order?.id,
      originalOrderId: order?.originalOrderId,
      itemsFired,
      allReady,
      isUpdating
    });

    if (!itemsFired || allReady || isUpdating) {
      console.log('🟡 handleReady BLOCKED:', { itemsFired, allReady, isUpdating });
      return;
    }

    setIsUpdating(true);
    try {
      const orderId = order.originalOrderId || order.id;

      // Use onReadyItems if available (new logic with RPC)
      if (onReadyItems) {
        const flatIds = order.items.flatMap(i => i.ids || [i.id]);
        const itemsPayload = flatIds.map(id => ({ id }));
        await onReadyItems(orderId, itemsPayload);
      } else {
        // Fallback to old logic
        const { success } = await updateOrderTimestamp(orderId, 'ready_at', currentUser);
        if (success) onRefresh?.();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const itemsContainerClass = isWideCard
    ? 'py-2 grid grid-cols-2 gap-x-4 gap-y-2'
    : 'py-2 space-y-2';

  const customerNameDisplay =
    order?.customerName ||
    (order?.orderNumber ? `הזמנה #${order?.orderNumber}` : 'לקוח ללא שם');

  const renderItem = (item) => {
    const itemInventory = inventoryStatus?.[item?.id];
    // item.name already contains formatted mods HTML from fetchOrders
    const displayName = createDisplayName(item?.name);

    return (
      <div
        key={item?.id}
        className={`border rounded-md p-1 transition-colors border-gray-200 ${itemInventory && !itemInventory?.isFullyAvailable ? 'border-red-300 bg-red-50' : 'bg-white'
          }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            {/* Render item name with mods inline - Flow Layout */}
            {/* ============================================================
               ⚠️ CRITICAL: DO NOT MODIFY THIS FLEX LAYOUT! ⚠️
               Modifiers MUST wrap to next line when space runs out.
               - flex-wrap: YES - allows items to wrap
               - whitespace-nowrap: NO - removed to allow wrapping
               - overflow-x: NO - no horizontal scroll
               This has been fixed multiple times - DO NOT REVERT!
               ============================================================ */}
            <div className="flex flex-wrap items-center gap-1.5 text-sm leading-tight">
              {/* Name */}
              <span className="text-gray-900 font-semibold">
                {item?.quantity > 1 ? `${item?.quantity}x ` : ''}
                {item?.name || 'פריט לא זמין'}
              </span>

              {/* Modifiers - Inline Flow (WRAP enabled, NO horizontal scroll) */}
              {item?.modifiers?.map((mod, idx) => (
                <span
                  key={idx}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium border ${mod.color}`}
                >
                  {mod.text}
                </span>
              ))}
            </div>

            {/* Kitchen Note Display */}
            {item?.notes && (
              <div className="mt-1.5 inline-flex items-center bg-orange-50 border border-orange-200 text-orange-800 text-xs px-2 py-1 rounded-lg font-bold shadow-sm">
                <span className="ml-1">📝</span>
                <span>{item.notes}</span>
              </div>
            )}

            {itemInventory && !itemInventory?.isFullyAvailable && (
              <div className="text-xs text-red-600 mt-1">
                חסר: {itemInventory?.missingIngredients?.map(ing => ing?.name)?.join(', ')}
              </div>
            )}

            {isLoadingInventory && (
              <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mt-1"></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow ${cardWidth} ${cardMinWidth} mr-[5px] ${getOrderCardBorder()} ${getOrderBackgroundColor(order?.orderStatus)} ${isClickable ? 'cursor-pointer hover:bg-blue-100' : ''
        } ${!order?.isPaid && order?.orderStatus === 'new' ? 'opacity-60 cursor-not-allowed' : ''
        } overflow-hidden`}
      onClick={handleOrderClick}
    >
      {/* Order Header */}
      <div className="flex justify-between items-start mb-2 text-xs relative">
        <span className="font-semibold text-gray-800 text-xs">
          #{order?.orderNumber}
        </span>
        <div className="flex items-center gap-2">
          {order?.orderStatus === 'new' && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              חדש
            </span>
          )}
          {/* Edit Button */}
          <button
            onClick={(e) => {
              e?.stopPropagation();
              handleEditOrder();
            }}
            className="w-6 h-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center text-xs font-bold transition-colors shadow-sm"
            title="ערוך הזמנה"
          >
            ✏️
          </button>
        </div>
        <span className="text-gray-500" dir="ltr">
          {order?.timestamp}
        </span>
      </div>

      {order?.customerName && (
        <p className="text-base font-bold text-gray-800 mb-2">
          {order?.customerName}
        </p>
      )}

      {/* Order Items */}
      <div className={itemsContainerClass}>
        {items?.map(renderItem)}
      </div>

      {/* Action Buttons - FIX: Enforce Vertical Stacking */}
      <div className="mt-auto space-y-2 flex flex-col">
        {/* 1. Collect payment button when not ready and unpaid */}
        {order?.orderStatus !== 'ready' && !order?.isPaid && order?.orderStatus !== 'delivered' && (
          <button
            onClick={(e) => {
              e?.stopPropagation();
              handleCollectPayment(order?.id);
            }}
            className="w-full py-2 bg-yellow-500 text-white font-bold rounded-md hover:bg-yellow-600 transition duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isCollectingPayment || isUpdating}
          >
            {isUpdating || isCollectingPayment ? 'מעבד...' : `קבל ${totalAmountDisplay?.replace('.00', '')}₪`}
          </button>
        )}

        {/* Fire Button */}
        {(() => {
          // Check if items have been fired (for split cards)
          const itemsFired = order?.items?.some(item =>
            item.status === 'in_progress' || item.item_fired_at
          ) || order?.fired_at;
          const isDisabled = itemsFired || isUpdating;

          return (
            <button
              onClick={handleFire}
              disabled={isDisabled}
              className={`w-full py-2 px-3 rounded-md text-white text-xs font-medium transition-all ${isDisabled
                ? 'bg-orange-300 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
                }`}
            >
              {isUpdating ? 'שולח...' : itemsFired
                ? 'נשלח ✓'
                : 'שלח למטבח 🧑‍🍳'}
            </button>
          );
        })()}

        {/* Ready Button */}
        {(() => {
          // Check if items have been fired (for split cards)
          const itemsFired = order?.items?.some(item =>
            item.status === 'in_progress' || item.item_fired_at
          ) || order?.fired_at;
          const isDisabled = !itemsFired || !!order?.ready_at || isUpdating;

          console.log('🔵 Ready Button State:', {
            orderId: order?.id,
            itemsFired,
            ready_at: order?.ready_at,
            isDisabled,
            itemStatuses: order?.items?.map(i => i.status)
          });

          return (
            <button
              onClick={handleReady}
              disabled={isDisabled}
              className={`w-full py-2 px-3 rounded-md text-white text-xs font-medium transition-all ${isDisabled
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:scale-95'
                }`}
            >
              {isUpdating ? 'מעדכן...' : order?.ready_at ? 'מוכן! ✅' : 'סיים והכן ☕'}
            </button>
          );
        })()}
      </div>
    </div>
  );
};

export default OrderCard;