const fs = require('fs');
const path = './frontend_source/src/pages/kds/index.jsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Remove creditData state
content = content.replace(/\s+\/\/ Credit Modal State \(for refunds\)\s+const \[creditData, setCreditData\] = useState\(null\); \/\/ \{ orderId, orderNumber, customerName, creditAmount, cancelledItems \}/, '');

// 2. Remove Credit KDSPaymentModal instance
const creditModalBlock = `        {/* Credit/Refund Payment Modal */}
        <KDSPaymentModal
          isOpen={!!creditData}
          onClose={() => setCreditData(null)}
          order={{
            customerName: creditData?.customerName || 'לקוח',
            orderNumber: creditData?.orderNumber
          }}
          creditMode={true}
          creditAmount={creditData?.creditAmount || 0}
          onConfirmCredit={async (method, amount) => {
            console.log('💰 Credit confirmed:', { method, amount, orderId: creditData?.orderId });
            // TODO: Record credit transaction if needed
            alert(\`זיכוי של ₪\${amount} בוצע בהצלחה!\`);
            setCreditData(null);
            forceRefresh();
          }}
        />`;
content = content.replace(creditModalBlock, '');

// 3. Remove onProcessCredit from OrderEditModal
content = content.replace(/\s+onProcessCredit=\{\(data\) => \{[^}]+\}\}/, '');

// 4. Clean up handleEditOrder to only open the View Modal (no full edit navigation)
const handleEditOrderOriginal = `  const handleEditOrder = (order) => {
    // ACTIVE ORDERS: Open the quick edit modal (View/Early Delivery)
    const isActive = order.order_status !== 'completed' && order.order_status !== 'cancelled' && viewMode !== 'history';

    if (isActive) {
      console.log('🖊️ KDS: Opening Edit Modal for Active Order:', order.id);
      setEditingOrder(order);
      setIsEditModalOpen(true);
      return;
    }

    // HISTORY/COMPLETED ORDERS: For now, also just open the View Modal
    console.log('🖊️ KDS: Opening View Modal for Order:', order.id);
    setEditingOrder(order);
    setIsEditModalOpen(true);
  };`;

// Find where handleEditOrder starts and replace the whole function
const handleEditStart = content.indexOf('const handleEditOrder =');
const handleEditEnd = content.indexOf('  };', handleEditStart + 20) + 4;
content = content.slice(0, handleEditStart) + handleEditOrderOriginal + content.slice(handleEditEnd);

fs.writeFileSync(path, content, 'utf8');
console.log("Cleaned up kds/index.jsx.");
