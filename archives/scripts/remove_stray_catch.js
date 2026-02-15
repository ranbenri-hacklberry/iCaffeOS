const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

const brokenCatch = `  } catch (error) {
    console.error("ModifierModal crashed:", error, error.message, error.stack);
    return null;
  }`;

// Note: exact spacing might vary. Let's try matching the catch block robustly.
// Or just match specifically based on the view_file output.

if (content.includes(brokenCatch)) {
    content = content.replace(brokenCatch, '');
    console.log("Successfully removed stray catch-block.");
    fs.writeFileSync(path, content, 'utf8');
} else {
    // Try relaxed whitespace matching or just the lines we saw
    const regex = /}\s*catch\s*\(error\)\s*{[\s\S]*?return\s*null;\s*}/;
    if (regex.test(content)) {
        content = content.replace(regex, '');
        console.log("Successfully removed stray catch-block via Regex.");
        fs.writeFileSync(path, content, 'utf8');
    } else {
        console.error("Could not find the catch block to remove.");
    }
}
