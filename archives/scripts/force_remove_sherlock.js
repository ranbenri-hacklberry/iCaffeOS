const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// The Sherlock block starts with "{/* 🕵️‍♂️ SHERLOCK" and ends before the footer.
// Let's rely on the unique title.

const regex = /\{\/\* 🕵️‍♂️ SHERLOCK DEBUGGER[\s\S]*?\}\)/;

if (regex.test(content)) {
    content = content.replace(regex, '');
    console.log("Sherlock debugger removed via Regex.");
    fs.writeFileSync(path, content, 'utf8');
} else {
    console.warn("Sherlock not found via Regex.");
}
