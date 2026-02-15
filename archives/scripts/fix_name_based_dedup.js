const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// Change from ID-based to NAME-based deduplication
const oldDedup = `const seenIds = new Set();
                [...(optionGroups || [])].forEach(group => {
                  group.values?.forEach(val => {
                    if (!val.id || seenIds.has(val.id)) return; // Skip duplicates
                    if (val.name?.includes('מפורק')) {
                      specialOptions.push({ ...val, groupId: group.id });
                      seenIds.add(val.id);
                    }
                    if (val.name?.includes('נטול')) {
                      specialOptions.push({ ...val, groupId: group.id });
                      seenIds.add(val.id);
                    }
                  });
                });`;

const newDedup = `const seenNames = new Set();
                [...(optionGroups || [])].forEach(group => {
                  group.values?.forEach(val => {
                    const name = val.name || '';
                    if (name.includes('מפורק') && !seenNames.has('מפורק')) {
                      specialOptions.push({ ...val, groupId: group.id });
                      seenNames.add('מפורק');
                    }
                    if (name.includes('נטול') && !seenNames.has('נטול')) {
                      specialOptions.push({ ...val, groupId: group.id });
                      seenNames.add('נטול');
                    }
                  });
                });`;

if (content.includes(oldDedup)) {
    content = content.replace(oldDedup, newDedup);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Fixed deduplication to use NAME instead of ID.");
} else {
    console.warn("Could not find exact block.");
}
