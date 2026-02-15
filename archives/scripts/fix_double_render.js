const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// We need to modify the useMemo block where groups are categorized.
// We want to find the 'Options' group and exclude it from 'others'.

// 1. Find the categorization logic
const targetBlock = `const milk = optionGroups.find(g => g.name?.includes('חלב'));`;

// We want to add:
// const optionsGroup = optionGroups.find(g => g.name?.includes('אפשרויות') || g.name?.includes('תוספות מיוחדות'));

if (content.includes(targetBlock)) {
    // Insert the detection for optionsGroup
    let newLogic = targetBlock + `\n    const optionsGroup = optionGroups.find(g => g.name?.includes('אפשרויות') || g.name?.includes('תוספות מיוחדות'));`;

    // Now replace the filter logic for 'others'
    // Old: const others = optionGroups.filter(g => g !== milk && g !== foam && g !== temp && g !== base && g !== strength);
    // New: const others = optionGroups.filter(g => g !== milk && g !== foam && g !== temp && g !== base && g !== strength && g !== optionsGroup);

    // Let's do it via replace on the content string
    content = content.replace(targetBlock, newLogic);

    // Now the filter part. It might be split across lines.
    const filterRegex = /const others = optionGroups\.filter\(g =>\s*g !== milk && g !== foam && g !== temp && g !== base && g !== strength\s*\);/;

    if (filterRegex.test(content)) {
        content = content.replace(filterRegex, `const others = optionGroups.filter(g => g !== milk && g !== foam && g !== temp && g !== base && g !== strength && g !== optionsGroup);`);

        // Also update the return object of useMemo
        // return { milkGroup: milk, ..., otherGroups: others };
        // The return object doesn't need to change strictly, because we only use 'otherGroups' for the general list.
        // And 'optionsGroup' is used implicitly by the bottom section iterating over ALL optionGroups (which is fine, or we can use optionsGroup specifically).

        // IMPORTANT: The bottom section iterates over `[...(optionGroups || [])]`.
        // This means it scans ALL groups to find "Netul". That's fine.
        // The issue was only that `otherGroups` ALSO rendered it.

        fs.writeFileSync(path, content, 'utf8');
        console.log("Successfully patched ModifierModal to prevent double rendering of Options group.");
    } else {
        console.warn("Could not find the 'others' filter logic to patch.");
        // Try strict string matching if regex fails (formatting issues)
        const strictFilter = `const others = optionGroups.filter(g => g !== milk && g !== foam && g !== temp && g !== base && g !== strength);`;
        if (content.includes(strictFilter)) {
            content = content.replace(strictFilter, `const others = optionGroups.filter(g => g !== milk && g !== foam && g !== temp && g !== base && g !== strength && g !== optionsGroup);`);
            fs.writeFileSync(path, content, 'utf8');
            console.log("Successfully patched (strict match).");
        }
    }

} else {
    console.warn("Could not find categorization logic start.");
}
