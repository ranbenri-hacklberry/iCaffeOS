const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/index.jsx';

let content = fs.readFileSync(path, 'utf8');

// Add detailed logging to see what's in editData
const targetLine = `          console.log('✅ Loaded Edit Order Data Validated:', parsedData.id);`;

const withLogging = `          console.log('✅ Loaded Edit Order Data Validated:', parsedData.id);
          console.log('📦 Edit Data Items:', parsedData.items?.length || 0, parsedData.items);`;

if (content.includes(targetLine)) {
    content = content.replace(targetLine, withLogging);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Added edit data logging.");
} else {
    console.warn("Could not find target line.");
}
