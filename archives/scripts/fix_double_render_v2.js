const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// Anchor: The Strength group definition block.
const strengthBlock = `    const strength = optionGroups.find(g => {
      return checkGroup(g, ['חוזק', 'strength'], 'strength') ||
        hasValue(g, 'חזק') || hasValue(g, 'חלש');
    });`;

if (content.includes(strengthBlock)) {
    // 1. Define 'optionsGroup' right after strength
    const optionsDef = `
    const optionsGroup = optionGroups.find(g => g.name?.includes('אפשרויות') || g.name?.includes('תוספות מיוחדות'));`;

    // 2. Identify the 'others' filter block (it spans multiple lines in the file)
    const othersStart = `const others = optionGroups.filter(g =>`;
    const othersEnd = `g !== milk && g !== foam && g !== temp && g !== base && g !== strength`;

    // We replace the strength block to include the new definition
    let newContent = content.replace(strengthBlock, strengthBlock + optionsDef);

    // Now we update the condition. 
    // We'll search for the condition string and append " && g !== optionsGroup"
    if (newContent.includes(othersEnd)) {
        newContent = newContent.replace(othersEnd, othersEnd + " && g !== optionsGroup");
        fs.writeFileSync(path, newContent, 'utf8');
        console.log("Successfully patched double render issue.");
    } else {
        console.warn("Could not find exact 'others' filter condition.");
    }
} else {
    console.warn("Could not find strength block.");
}
