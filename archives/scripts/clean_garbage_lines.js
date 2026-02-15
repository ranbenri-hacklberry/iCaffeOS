const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

let content = fs.readFileSync(path, 'utf8');

// We need to match this specific garbage block.
// Start:          :</div>
// End:           )}

// Let's find the index of ":</div>" and the index of the next "<div className=\"p-3 bg-white" (the footer).

const startGarbage = content.indexOf(':</div>');
const footerSig = '<div className="p-3 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">';
const footerIdx = content.indexOf(footerSig);

if (startGarbage !== -1 && footerIdx !== -1 && startGarbage < footerIdx) {
    // Cut out everything from startGarbage up to footerIdx
    const newContent = content.substring(0, startGarbage) + content.substring(footerIdx);
    fs.writeFileSync(path, newContent, 'utf8');
    console.log("Successfully removed garbage block between lines 1171-1187.");
} else {
    // Try to match the content seen in view_file specifically if exact string match fails
    console.warn("Could not find exact garbage markers. startGarbage:", startGarbage, "footerIdx:", footerIdx);

    // Fallback: Delete range of lines? Unsafe with FS tool without reading file into lines.
    // Let's try to match a larger chunk of the garbage.
    const garbageChunk = `<div className="grid grid-cols-2 gap-1">
                 {optionGroups.map(g => (`;

    const chunkIdx = content.indexOf(garbageChunk);
    if (chunkIdx !== -1) {
        // Find the preceding :</div> mess
        const messStart = content.lastIndexOf(':</div>', chunkIdx);
        if (messStart !== -1) {
            const newContent = content.substring(0, messStart) + content.substring(footerIdx);
            fs.writeFileSync(path, newContent, 'utf8');
            console.log("Successfully removed garbage block via secondary match.");
        }
    }
}
