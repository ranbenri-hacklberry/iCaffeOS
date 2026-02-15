const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// Markers for the Debugger block (including the one I added in v2.4.1/v2.3.9)
const startMarker = '{/* 🕵️‍♂️ VISUAL DEBUGGER';
const endMarker = '          )}';

// We need to match the whole block.
// Since we used different versions, let's search for the start, and then find the closing brace before the footer.
const footerStart = '<div className="p-3 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">';

const sIdx = content.indexOf(startMarker);
const fIdx = content.indexOf(footerStart);

if (sIdx !== -1 && fIdx !== -1) {
    // We remove everything from sIdx up to fIdx (exclusive), but keeping the whitespace clean?
    // Let's just remove the block.
    // The debugger block ends with `)}` and some newlines before the footer.

    // Safety check: is there code between them?
    const block = content.substring(sIdx, fIdx);

    // Replace with empty string (or just newline)
    const newContent = content.substring(0, sIdx) + '\n\n          ' + content.substring(fIdx);

    fs.writeFileSync(path, newContent, 'utf8');
    console.log("Successfully removed Visual Debugger from ModifierModal.");
} else {
    console.warn("Could not find Debugger block to remove.");
    console.log("Start:", sIdx, "Footer:", fIdx);
}
