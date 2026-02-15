const fs = require('fs');
const path = './frontend_source/src/pages/kds/components/OrderEditModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// Replace navigate with window.location.href
const oldNav = `            sessionStorage.setItem('editOrderData', JSON.stringify(editData));
            console.log('🚀 MODAL: Navigating to edit with ID:', orderData.id, 'Full data:', editData);
            navigate(\`/menu-ordering-interface?editOrderId=\${orderData.id}\`);`;

const newNav = `            sessionStorage.setItem('editOrderData', JSON.stringify(editData));
            sessionStorage.setItem('order_origin', 'kds');
            console.log('🚀 MODAL: Navigating to edit with ID:', orderData.id, 'Full data:', editData);
            window.location.href = \`/menu-ordering-interface?editOrderId=\${orderData.id}\`;`;

if (content.includes(oldNav)) {
    content = content.replace(oldNav, newNav);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Fixed navigation to use window.location.href.");
} else {
    console.warn("Could not find navigation block.");
}
