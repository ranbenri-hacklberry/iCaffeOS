const fs = require('fs');
const path = './frontend_source/src/pages/kds/components/OrderEditModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// Add logging to handleOpenFullEditor
const targetLine = `    const handleOpenFullEditor = () => {
        if (!orderData || !items.length) return;`;

const withLogging = `    const handleOpenFullEditor = () => {
        console.log('🚀 MODAL: handleOpenFullEditor called', { orderData, itemsCount: items.length });
        if (!orderData || !items.length) {
            console.warn('⚠️ MODAL: Blocked - missing data', { hasOrderData: !!orderData, itemsCount: items.length });
            return;
        }`;

if (content.includes(targetLine)) {
    content = content.replace(targetLine, withLogging);

    // Also log before navigate
    const navLine = `            sessionStorage.setItem('editOrderData', JSON.stringify(editData));
            navigate(\`/menu-ordering-interface?editOrderId=\${orderData.id}\`);`;

    const navWithLog = `            sessionStorage.setItem('editOrderData', JSON.stringify(editData));
            console.log('🚀 MODAL: Navigating to edit with ID:', orderData.id, 'Full data:', editData);
            navigate(\`/menu-ordering-interface?editOrderId=\${orderData.id}\`);`;

    content = content.replace(navLine, navWithLog);

    fs.writeFileSync(path, content, 'utf8');
    console.log("Added logging to OrderEditModal.");
} else {
    console.warn("Could not find target function.");
}
