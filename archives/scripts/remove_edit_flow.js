const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/index.jsx';

let content = fs.readFileSync(path, 'utf8');

// Find the massive useEffect for edit data loading and remove it
const startTag = 'useEffect(() => {\n    const urlParams = new URLSearchParams(window.location.search);';
const endTag = '}, [menuItems]); // Added menuItems dependency';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag) + endTag.length;

if (startIndex !== -1 && endIndex !== -1) {
    content = content.slice(0, startIndex) + '// Order Editing Flow Removed' + content.slice(endIndex);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Removed Order Editing Flow from MenuOrderingInterface.");
} else {
    console.warn("Could not find edit flow useEffect.");
}
