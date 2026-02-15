const fs = require('fs');
const path = './frontend_source/src/pages/kds/index.jsx';

let content = fs.readFileSync(path, 'utf8');

// Add logging to handleEditOrder
const targetLine = `      // Navigate directly to cart
      navigate(\`/menu-ordering-interface?editOrderId=\${order.id}\`, {`;

const withLogging = `      // Navigate directly to cart
      console.log('🚀 KDS: Navigating to edit with ID:', order.id, 'URL:', \`/menu-ordering-interface?editOrderId=\${order.id}\`);
      navigate(\`/menu-ordering-interface?editOrderId=\${order.id}\`, {`;

if (content.includes(targetLine)) {
    content = content.replace(targetLine, withLogging);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Added logging to KDS handleEditOrder.");
} else {
    console.warn("Could not find navigation line.");
}
