const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

// Fix Logic: Remove 'isCoffeeItem' restriction for Decaf visibility.
// If the modifier is assigned to the item, SHOW IT.

let content = fs.readFileSync(path, 'utf8');

const faultyLogic = `if (val.name?.includes('נטול') && isCoffeeItem) {`;
const fixedLogic = `if (val.name?.includes('נטול')) { // Removed isCoffeeItem check`;

if (content.includes(faultyLogic)) {
    content = content.replace(faultyLogic, fixedLogic);
    console.log("Successfully removed 'isCoffeeItem' restriction from Decaf.");
    fs.writeFileSync(path, content, 'utf8');
} else {
    // If exact match fails, try regex or partial
    console.warn("Could not find exact faulty logic line. Trying partial match...");
    // Fallback?
    // Let's assume the whitespace might vary.
    // Try regex: /if\s*\(\s*val\.name\?\.includes\(\s*'נטול'\s*\)\s*&&\s*isCoffeeItem\s*\)\s*\{/
}
