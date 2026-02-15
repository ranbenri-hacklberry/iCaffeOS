const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// Add logging before the render of specialOptions
const targetLine = `const hasSpecialOptions = specialOptions.length > 0;`;

if (content.includes(targetLine)) {
    const withLog = `console.log('🔍 SPECIAL OPTIONS DEBUG:', specialOptions.map(o => ({ name: o.name, id: o.id, groupId: o.groupId })));\n                const hasSpecialOptions = specialOptions.length > 0;`;

    content = content.replace(targetLine, withLog);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Added debug logging for specialOptions.");
} else {
    console.warn("Could not find target line.");
}
