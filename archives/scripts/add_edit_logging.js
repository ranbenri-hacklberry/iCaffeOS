const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/index.jsx';

let content = fs.readFileSync(path, 'utf8');

// Add logging to the useEffect to see what's happening
const targetLine = `    // Only load edit data once, and only when menuItems is ready
    if (editOrderId && !editDataLoadedRef.current && menuItems.length > 0) {
      editDataLoadedRef.current = true; // Mark as loaded`;

const withLogging = `    // Only load edit data once, and only when menuItems is ready
    console.log('🔍 EDIT MODE CHECK:', { editOrderId, loaded: editDataLoadedRef.current, menuItemsCount: menuItems.length });
    if (editOrderId && !editDataLoadedRef.current && menuItems.length > 0) {
      editDataLoadedRef.current = true; // Mark as loaded
      console.log('✅ Loading edit data NOW');`;

if (content.includes(targetLine)) {
    content = content.replace(targetLine, withLogging);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Added debug logging to useEffect.");
} else {
    console.warn("Could not find target line for logging.");
}
