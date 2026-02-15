const fs = require('fs');
const path = './frontend_source/src/pages/kds/components/OrderEditModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// Wrap in try/catch
const oldNav = `            sessionStorage.setItem('editOrderData', JSON.stringify(editData));
            sessionStorage.setItem('order_origin', 'kds');
            const url = \`/menu-ordering-interface?editOrderId=\${orderData.id}\`;
            console.log('🚀 MODAL: About to navigate to:', url);
            alert('מנווט לעריכה: ' + url);
            window.location.href = url;`;

const newNav = `            try {
                sessionStorage.setItem('editOrderData', JSON.stringify(editData));
                sessionStorage.setItem('order_origin', 'kds');
                const url = \`/menu-ordering-interface?editOrderId=\${orderData.id}\`;
                console.log('🚀 MODAL: About to navigate to:', url);
                console.log('🚀 MODAL: SessionStorage set. Now calling window.location.href...');
                window.location.href = url;
                console.log('🚀 MODAL: window.location.href called successfully');
            } catch (err) {
                console.error('❌ MODAL: Navigation failed:', err);
                alert('שגיאה בניווט: ' + err.message);
            }`;

if (content.includes(oldNav)) {
    content = content.replace(oldNav, newNav);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Added try/catch to navigation.");
} else {
    console.warn("Could not find navigation block.");
}
