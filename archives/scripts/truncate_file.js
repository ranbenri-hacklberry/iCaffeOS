const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// We want to find the last valid closing of the return statement.
// Look for where we close the main div and the return paren.
// pattern: </div >\s*\)\s*;?

const endPattern = /<\/div >\s*\)\s*;/;
const endPattern2 = /<\/div >\s*\)/;

// Wait, the file view showed:
// 1208:         </div >
// 1209:       </div >
// 1210:     );
// 1211: 
// 1212: };

// We want to make sure nothing weird is after line 1212.
// Let's find "export default" and ensure it looks sane.

const exportIdx = content.indexOf('export default React.memo(ModifierModal);');

if (exportIdx !== -1) {
    // Check what occurs between the end of the function body and the export.
    // The function body ends with `};`

    // Let's just find the last `};` before the export.
    const beforeExport = content.substring(0, exportIdx);
    const lastBrace = beforeExport.lastIndexOf('};');

    if (lastBrace !== -1) {
        // Cut everything between lastBrace+2 and exportIdx, replace with newlines
        const cleanContent = beforeExport.substring(0, lastBrace + 2) + '\n\n' + content.substring(exportIdx);
        fs.writeFileSync(path, cleanContent, 'utf8');
        console.log("Truncated garbage between function end and export.");
    } else {
        console.warn("Could not find function closing brace.");
    }
} else {
    console.error("Could not find export statement.");
}
