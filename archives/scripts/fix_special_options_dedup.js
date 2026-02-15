const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// The block to fix (around line 1078):
const buggyLoop = `[...(optionGroups || [])].forEach(group => {
                  group.values?.forEach(val => {
                    if (val.name?.includes('מפורק')) {
                      specialOptions.push({ ...val, groupId: group.id });
                    }
                    if (val.name?.includes('נטול')) { // Removed isCoffeeItem check
                      specialOptions.push({ ...val, groupId: group.id });
                    }
                  });
                });`;

// The fix: Track seen IDs to avoid duplicates
const fixedLoop = `const seenIds = new Set();
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

if (content.includes(buggyLoop)) {
    content = content.replace(buggyLoop, fixedLoop);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully fixed specialOptions deduplication.");
} else {
    console.warn("Could not find exact loop block. Trying relaxed match...");

    // Try to insert the seenIds declaration before the forEach
    if (content.includes(`[...(optionGroups || [])].forEach(group => {`)) {
        // Insert dedup logic
        content = content.replace(
            `const specialOptions = [];`,
            `const specialOptions = [];\n                const seenIds = new Set();`
        );

        // Modify the push statements to check seenIds
        content = content.replace(
            `if (val.name?.includes('מפורק')) {
                      specialOptions.push({ ...val, groupId: group.id });
                    }`,
            `if (val.name?.includes('מפורק') && !seenIds.has(val.id)) {
                      specialOptions.push({ ...val, groupId: group.id });
                      seenIds.add(val.id);
                    }`
        );

        content = content.replace(
            `if (val.name?.includes('נטול')) { // Removed isCoffeeItem check
                      specialOptions.push({ ...val, groupId: group.id });
                    }`,
            `if (val.name?.includes('נטול') && !seenIds.has(val.id)) {
                      specialOptions.push({ ...val, groupId: group.id });
                      seenIds.add(val.id);
                    }`
        );

        fs.writeFileSync(path, content, 'utf8');
        console.log("Successfully fixed (relaxed match).");
    }
}
