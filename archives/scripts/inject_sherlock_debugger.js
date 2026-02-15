const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

// SHERLOCK DEBUGGER v2.4.5
const debuggerContent = `          {/* 🕵️‍♂️ SHERLOCK DEBUGGER v2.4.5 */}
          {isOpen && (
             <div 
              dir="ltr"
              className="mx-3 mb-2 p-2 bg-black/90 text-yellow-400 font-mono text-[9px] rounded-lg border border-yellow-600"
              onClick={(e) => { e.stopPropagation(); console.log(optionGroups); }}
             >
               <div className="font-bold border-b border-yellow-700 mb-1">RECEIVED GROUPS ({optionGroups.length}):</div>
               <div className="grid grid-cols-2 gap-1">
                 {optionGroups.map(g => (
                   <div key={g.id} className="flex justify-between border-b border-slate-800">
                     <span>{g.name}</span>
                     <span className={g.values?.length ? "text-green-400" : "text-red-500"}>
                       {g.values?.length || 0} vals
                     </span>
                   </div>
                 ))}
               </div>
               {/* Show Hidden/Filtered groups if any logic excluded them */}
               <div className="mt-1 text-slate-500 italic">
                 (Check console for full object)
               </div>
             </div>
          )}`;

let content = fs.readFileSync(path, 'utf8');

// We insert this before the Footer
const footerStart = '<div className="p-3 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">';
const idx = content.indexOf(footerStart);

if (idx !== -1) {
    // Check if previous debugger exists (it was removed in v2.4.4 but maybe script failed or user reverted?)
    // If it exists, we replace it.
    // If not, we insert.

    // Simplest: Insert. If double debugger, user will see two. Better than none.
    content = content.substring(0, idx) + '\n' + debuggerContent + '\n' + content.substring(idx);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully injected Sherlock Debugger.");
} else {
    console.error("Could not find footer to inject debugger.");
}
