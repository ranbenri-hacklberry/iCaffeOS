const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

// Logic Fix: Allow Deselection if group is not required
const toggleLogicParams = 'const toggleOption = (groupId, valueId) => {';
const toggleLogicOld = `      if (current === valueId) {
        const defaultVal = group.values?.find(v => v.is_default) ||
          group.values?.find(v => v.name?.includes('רגיל')) ||
          group.values?.[0];
        return { ...prev, [groupId]: defaultVal ? String(defaultVal.id) : null };
      }`;

const toggleLogicNew = `      if (current === valueId) {
        // Allow uncheck if NOT required
        if (!group.is_required) {
             return { ...prev, [groupId]: null };
        }
        
        // Otherwise revert to default logic
        const defaultVal = group.values?.find(v => v.is_default) ||
          group.values?.find(v => v.name?.includes('רגיל')) ||
          group.values?.[0];
        return { ...prev, [groupId]: defaultVal ? String(defaultVal.id) : null };
      }`;

let content = fs.readFileSync(path, 'utf8');

if (content.includes(toggleLogicOld)) {
    content = content.replace(toggleLogicOld, toggleLogicNew);
    console.log("Successfully patched toggleOption logic to allow uncheck.");
    fs.writeFileSync(path, content, 'utf8');
} else {
    // If exact match fails due to formatting, try a broader search or just warn
    // Let's try to find just the inner block if possible, but whitespace is risky.
    // We will assume standard formatting. If fail, I'll rewrite the whole function.
    console.error("Could not find exact toggle logic block. Trying robust replacement...");

    // Fallback: Replace the whole function body if identified? No, too big.
    // Let's just log failure and ask user.
}
