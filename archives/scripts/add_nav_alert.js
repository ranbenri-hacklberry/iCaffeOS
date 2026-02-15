const fs = require('fs');
const path = './frontend_source/src/pages/kds/components/OrderEditModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// Add alert before navigation
const oldNav = `            sessionStorage.setItem('editOrderData', JSON.stringify(editData));
            sessionStorage.setItem('order_origin', 'kds');
            console.log('🚀 MODAL: Navigating to edit with ID:', orderData.id, 'Full data:', editData);
            window.location.href = \`/menu-ordering-interface?editOrderId=\${orderData.id}\`;`;

const newNav = `            sessionStorage.setItem('editOrderData', JSON.stringify(editData));
            sessionStorage.setItem('order_origin', 'kds');
            const url = \`/menu-ordering-interface?editOrderId=\${orderData.id}\`;
            console.log('🚀 MODAL: About to navigate to:', url);
            alert('מנווט לעריכה: ' + url);
            window.location.href = url;`;

if (content.includes(oldNav)) {
    content = content.replace(oldNav, newNav);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Added alert to navigation.");
} else {
    console.warn("Could not find navigation block.");
}
