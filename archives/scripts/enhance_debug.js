const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// Replace the existing log with a more detailed one
const oldLog = `console.log('🔍 SPECIAL OPTIONS DEBUG:', specialOptions.map(o => ({ name: o.name, id: o.id, groupId: o.groupId })));`;

const newLog = `console.log('🔍 SPECIAL OPTIONS DEBUG:');
                specialOptions.forEach((o, idx) => {
                  console.log(\`  [\${idx}] Name: "\${o.name}" | ID: \${o.id} | GroupID: \${o.groupId}\`);
                });`;

if (content.includes(oldLog)) {
    content = content.replace(oldLog, newLog);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Enhanced debug logging.");
} else {
    console.warn("Could not find existing log.");
}
