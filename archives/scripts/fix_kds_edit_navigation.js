const fs = require('fs');
const path = './frontend_source/src/pages/kds/index.jsx';

let content = fs.readFileSync(path, 'utf8');

// Replace the entire handleEditOrder function to ALWAYS navigate (never use modal)
const oldFunction = `  const handleEditOrder = (order) => {
    // handleEditOrder ALWAYS opens the edit/view screen
    // Payment modal is opened separately via onPaymentCollected (the cash register button)

    // READY ORDERS: Open the edit modal
    const isReady = order.type === 'ready' || order.orderStatus === 'ready';
    if (isReady) {
      console.log('🖊️ KDS: Opening Edit Modal for Ready Order:', order.id);
      setEditingOrder(order);
      setIsEditModalOpen(true);
      return;
    }

    // HISTORY/COMPLETED ORDERS: Navigate to restricted edit screen
    const isRestricted = viewMode === 'history' || order.order_status === 'completed' || order.order_status === 'cancelled';
    const isFromHistory = viewMode === 'history';

    if (isRestricted) {
      console.log('🖊️ KDS: Navigating to RESTRICTED edit order (History):', order.id);
      // Save minimal data to session storage to pass context
      const editData = {
        id: order.id,
        orderNumber: order.orderNumber,
        restrictedMode: true,
        viewMode: viewMode,
        returnToActiveOnChange: isFromHistory // NEW: Flag to indicate we should switch to active tab if changes are made
      };
      sessionStorage.setItem('editOrderData', JSON.stringify(editData));
      sessionStorage.setItem('order_origin', 'kds');
      // Navigate directly to cart
      console.log('🚀 KDS: Navigating to edit with ID:', order.id, 'URL:', \`/menu-ordering-interface?editOrderId=\${order.id}\`);
      navigate(\`/menu-ordering-interface?editOrderId=\${order.id}\`, {
        state: {
          orderId: order.id,
          viewMode: viewMode,
          returnToActiveOnChange: isFromHistory // Pass in state as well
        }
      });
    } else {
      console.log('🖊️ KDS: Opening Edit Modal for Active Order:', order.id);
      setEditingOrder(order);
      setIsEditModalOpen(true);
    }
  };`;

const newFunction = `  const handleEditOrder = (order) => {
    // ALWAYS navigate to the full edit screen (no modal)
    console.log('🖊️ KDS: Navigating to edit order:', order.id);
    
    const isRestricted = viewMode === 'history' || order.order_status === 'completed' || order.order_status === 'cancelled';
    const isFromHistory = viewMode === 'history';
    
    const editData = {
      id: order.id,
      orderNumber: order.orderNumber,
      items: order.items || [],
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      restrictedMode: isRestricted,
      viewMode: viewMode,
      returnToActiveOnChange: isFromHistory,
      originalOrderStatus: order.order_status,
      originalIsPaid: order.isPaid || false,
      originalTotal: order.totalPrice || 0
    };
    
    sessionStorage.setItem('editOrderData', JSON.stringify(editData));
    sessionStorage.setItem('order_origin', 'kds');
    
    console.log('🚀 KDS: Navigating with editOrderId:', order.id);
    navigate(\`/menu-ordering-interface?editOrderId=\${order.id}\`, {
      state: {
        orderId: order.id,
        viewMode: viewMode,
        returnToActiveOnChange: isFromHistory
      }
    });
  };`;

if (content.includes(oldFunction)) {
    content = content.replace(oldFunction, newFunction);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Replaced handleEditOrder to always navigate.");
} else {
    console.warn("Could not find exact function. Trying partial match...");
}
