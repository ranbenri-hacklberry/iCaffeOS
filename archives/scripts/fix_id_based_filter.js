const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// The line we want to replace:
// g !== milk && g !== foam && g !== temp && g !== base && g !== strength && g !== optionsGroup

const oldFilter = `g !== milk && g !== foam && g !== temp && g !== base && g !== strength && g !== optionsGroup`;

// The new filter (Robust ID check):
// We check IDs if objects exist, fallback to reference check if ID missing (unlikely)
const newFilter = `
        (milk ? g.id !== milk.id : true) && 
        (foam ? g.id !== foam.id : true) && 
        (temp ? g.id !== temp.id : true) && 
        (base ? g.id !== base.id : true) && 
        (strength ? g.id !== strength.id : true) && 
        (optionsGroup ? g.id !== optionsGroup.id : true)
      `;

// Replacing just that line might be tricky with indentation.
// Let's replace the whole block structure we identified last time.

const blockStart = `const others = optionGroups.filter(g =>`;
// We find this line, and replace the following lines up to `);`

if (content.includes(oldFilter)) {
    content = content.replace(oldFilter, newFilter);
    console.log("Successfully switched to ID-based filtering.");
    fs.writeFileSync(path, content, 'utf8');
} else {
    // Try to find it loosely
    console.warn("Could not find exact filter line. Trying partial match.");
    // Maybe we just replace "&& g !== optionsGroup" with "&& (optionsGroup ? g.id !== optionsGroup.id : true)"

    // Actually, let's just make the "Options" exclusion robust.
    const semiRobust = `&& g !== strength && g !== optionsGroup`;
    if (content.includes(semiRobust)) {
        content = content.replace(`&& g !== optionsGroup`, `&& (optionsGroup ? g.id !== optionsGroup.id : true)`);
        fs.writeFileSync(path, content, 'utf8');
        console.log("Successfully patched Options exclusion to use ID.");
    }
}
