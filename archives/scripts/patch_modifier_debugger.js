const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

const newDebuggerCode = `          {/* 🕵️‍♂️ VISUAL DEBUGGER v2.4.0 - X-RAY MODE */}
          {isOpen && (
             <div 
              dir="ltr"
              className="mx-3 mb-2 p-3 bg-slate-900/95 text-green-400 font-mono text-[10px] rounded-xl overflow-hidden shadow-2xl border border-slate-700"
              onClick={() => console.log('Debug Clicked')}
             >
               <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
                 <span className="font-bold text-white">🚧 DEBUGGER v2.4.0 (X-RAY)</span>
                 <span className={dexieOptions && dexieOptions.length > 0 ? "text-green-400" : "text-red-400"}>
                   {dexieOptions && dexieOptions.length > 0 ? "DEXIE OK" : "DEXIE EMPTY"}
                 </span>
               </div>
               
               <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                 <div>ITEM ID: <span className="text-white">{targetItemId}</span></div>
                 <div>LOADING: <span className={isRemoteLoading ? "text-yellow-400 animate-pulse" : "text-slate-500"}>{isRemoteLoading ? "YES" : "NO"}</span></div>
                 <div>REMOTE DATA: <span className={remoteData ? "text-green-400" : "text-slate-500"}>{remoteData ? \`YES (\${remoteData.length} grps)\` : "NO"}</span></div>
                 <div>FINAL SOURCE: <span className="text-white font-bold">{dexieOptions && dexieOptions.length ? 'DEXIE' : remoteData ? 'SUPABASE' : 'NONE'}</span></div>
               </div>
               
               {/* DETAILED GROUP BREAKDOWN */}
               <div className="mt-2 pt-1 border-t border-slate-700 max-h-24 overflow-y-auto">
                  <div className="font-bold mb-1">Group Breakdown:</div>
                  {(dexieOptions || remoteData || []).map(g => (
                    <div key={g.id} className="flex justify-between text-[9px] border-b border-slate-800 pb-0.5">
                      <span className="truncate w-24">{g.name}</span>
                      <span className={g.values && g.values.length > 0 ? "text-green-400" : "text-red-500 font-bold"}>
                        {g.values?.length || 0} vals
                      </span>
                    </div>
                  ))}
               </div>

               {/* X-RAY: RAW DATA SAMPLE */}
               {remoteData && remoteData.length > 0 && (
                 <div className="mt-2 pt-1 border-t border-slate-700">
                    <div className="font-bold text-purple-400 mb-1">RAW SAMPLE (1st Group):</div>
                    <pre className="text-[8px] leading-tight text-slate-300 break-all whitespace-pre-wrap">
                      {JSON.stringify(remoteData[0], (key, value) => {
                        if (key === 'values' && Array.isArray(value) && value.length > 0) return \`[\${value.length} items]\`; 
                        if (key === 'values' && Array.isArray(value) && value.length === 0) return '[] (EMPTY)';
                        return value;
                      }, 2)}
                    </pre>
                 </div>
               )}

               {/* Error Display if exists */}
               {(dexieOptions && dexieOptions.length && dexieOptions.some(g => !g.values || g.values.length === 0)) && (
                 <div className="mt-1 text-red-500 bg-red-900/20 p-1 rounded">
                   ⚠️ DEXIE: Groups found but VALUES MISSING!
                 </div>
               )}
             </div>
          )}
`;

let content = fs.readFileSync(path, 'utf8');

// Find start of previous debugger block
const startMarker = '{/* 🕵️‍♂️ VISUAL DEBUGGER';
const endMarker = '<div className="p-3 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    const finalContent = before + newDebuggerCode + '\n ' + after; // Added newline for safety
    fs.writeFileSync(path, finalContent, 'utf8');
    console.log('Successfully patched ModifierModal with X-RAY Debugger.');
} else {
    console.error('Could not find markers for debugger replacement.');
    console.log('Start Index:', startIndex);
    console.log('End Index:', endIndex);
}
