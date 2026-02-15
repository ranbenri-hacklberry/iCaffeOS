const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

// 1. Hook Injection: Add rawDebugData state
// We find the existing state line and append the new one
const hookFind = 'const [remoteData, setRemoteData] = useState(null);';
const hookReplace = `const [remoteData, setRemoteData] = useState(null);
  const [rawDebugData, setRawDebugData] = useState(null); // 🔥 NEW: Raw Debug v2.3.7`;

// 2. Logic Injection: Update fetchRemote to set rawDebugData
const fetchRemoteLogic = `    const fetchRemote = async () => {
      const rpcId = \`rpc-\${Date.now()}\`;
      setIsRemoteLoading(true);
      setRawDebugData(null); // Reset

      try {
        console.log(\`🟠 [\${rpcId}] Calling RPC: get_item_modifiers...\`);
        
        const { data, error } = await supabase
          .rpc('get_item_modifiers', { 
            target_item_id: targetItemId 
          });

        if (error) {
          console.error(\`🟠 [\${rpcId}] RPC Error:\`, error);
          setRawDebugData({ error: error.message, details: error.details, hint: error.hint });
          return; 
        }

        // 🔥 SAVE RAW DATA IMMEDIATELY FOR DEBUGGER
        // We wrap it in an object if it's not an array, to be sure
        const safeRaw = data || [];
        setRawDebugData(safeRaw);
        console.log(\`🟠 [\${rpcId}] RAW DATA RECEIVED:\`, safeRaw.length, 'records');

        if (!data || data.length === 0) {
          console.warn(\`🟠 [\${rpcId}] Empty data returned from RPC\`);
          setRemoteData([]); 
          return;
        }

        // Robust Parsing (Handle both camelCase and snake_case)
        const groupsMap = new Map();
        
        data.forEach(row => {
            // Normalize IDs (handle potential case variants)
            const gId = row.group_id || row.groupId;
            const gName = row.group_name || row.groupName || row.name; 
            
            if (!gId) return; 

            if (!groupsMap.has(gId)) {
                groupsMap.set(gId, {
                    id: gId,
                    name: gName,
                    is_required: row.is_required ?? false,
                    is_multiple_select: row.is_multiple_select ?? false,
                    min_selection: row.min_selection ?? 0,
                    max_selection: row.max_selection ?? 1,
                    display_order: row.display_order ?? 999,
                    values: []
                });
            }

            const vId = row.value_id || row.valueId;
            if (vId) {
                const group = groupsMap.get(gId);
                // Try ALL possible name columns
                const vName = row.value_name || row.valueName || row.name || 'Unknown Value';
                
                // Avoid duplicates
                if (!group.values.some(v => v.id === vId)) {
                    group.values.push({
                        id: vId,
                        group_id: gId,
                        name: vName,
                        priceAdjustment: row.price_adjustment || row.priceAdjustment || 0,
                        display_order: row.value_display_order || row.valueDisplayOrder || 999,
                        is_default: row.is_default ?? false
                    });
                }
            }
        });

        const enhanced = Array.from(groupsMap.values())
            .map(g => ({
                ...g,
                values: g.values.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            }))
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        setRemoteData(enhanced);

      } catch (err) {
        console.error(\`🟠 [\${rpcId}] EXCEPTION:\`, err);
        setRawDebugData({ error: 'JS Exception', msg: err.message });
      } finally {
        setIsRemoteLoading(false);
      }
    };`;

const wholeEffect = `  // 2. Fallback to Supabase (Remote) - v2.3.7
  useEffect(() => {
    // Guard clauses
    if (!isOpen || !targetItemId) return;
    
    // If Dexie succeeded, stop.
    if (dexieOptions && dexieOptions.length > 0) return;

    // If already loading or done
    if (isRemoteLoading || remoteData) return;

    ${fetchRemoteLogic}

    fetchRemote();
  }, [isOpen, targetItemId, dexieOptions, remoteData, isRemoteLoading]);`;


// 3. JSX Injection: Display Raw Data (X-RAY)
const debuggerCode = `               {/* X-RAY: RAW RPC RESPONSE v2.3.7 */}
               <div className="mt-2 pt-1 border-t border-slate-700 bg-slate-800/50 p-1 rounded">
                    <div className="font-bold text-blue-400 mb-1 text-[9px]">
                        X-RAY RAW DATA ({rawDebugData ? (Array.isArray(rawDebugData) ? rawDebugData.length + ' rows' : 'OBJ') : 'WAITING...'}):
                    </div>
                    {rawDebugData && (
                        <pre className="text-[8px] leading-tight text-blue-200 break-all whitespace-pre-wrap bg-black/50 p-1 rounded max-h-32 overflow-y-auto font-mono">
                           {JSON.stringify(rawDebugData.slice ? rawDebugData.slice(0, 2) : rawDebugData, null, 2)}
                           {Array.isArray(rawDebugData) && rawDebugData.length > 2 && \`\\n... (+\${rawDebugData.length - 2} more)\`}
                        </pre>
                    )}
               </div>`;


// EXECUTE PATCH
try {
    let content = fs.readFileSync(path, 'utf8');

    // A. Inject Hook (Replace single line)
    // We check if it's already there to avoid dupes
    if (!content.includes('rawDebugData')) {
        content = content.replace(hookFind, hookReplace);
    }

    // B. Replace useEffect Block
    // We look for a unique signature of the previous effect (v2.3.2)
    const effStart = '// 2. Fallback to Supabase (Remote)';
    // End is tricky, let's look for the start of step 3
    const effEnd = '// 3. Merge and Deduplicate Final results';

    const sIdx = content.indexOf(effStart);
    const eIdx = content.indexOf(effEnd);

    if (sIdx !== -1 && eIdx !== -1) {
        const before = content.substring(0, sIdx);
        const after = content.substring(eIdx);
        content = before + wholeEffect + '\n\n  ' + after;
        console.log("Replaced useEffect logic.");
    } else {
        console.warn("Could not find useEffect block to replace. Check markers.");
        console.log('Start:', sIdx, 'End:', eIdx);
    }

    // C. Inject Debugger UI
    // We replace the previous Debugger block entirely to update the version label
    const dbgStart = '{/* 🕵️‍♂️ VISUAL DEBUGGER';
    const dbgEnd = '<div className="p-3 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">';

    const dSIdx = content.indexOf(dbgStart);
    const dEIdx = content.indexOf(dbgEnd);

    if (dSIdx !== -1 && dEIdx !== -1) {
        const pre = content.substring(0, dSIdx);
        const post = content.substring(dEIdx);

        // Construct new debugger JSX
        // Note: I'm injecting the `debuggerCode` (X-Ray) INSIDE the debugger container
        const newDebugger = `          {/* 🕵️‍♂️ VISUAL DEBUGGER v2.3.7 - X-RAY */}
          {isOpen && (
             <div 
              dir="ltr"
              className="mx-3 mb-2 p-3 bg-slate-900/95 text-green-400 font-mono text-[10px] rounded-xl overflow-hidden shadow-2xl border border-slate-700"
              onClick={() => console.log('Debug Clicked')}
             >
               <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
                 <span className="font-bold text-white">🚧 DEBUGGER v2.3.7</span>
                 <span className={dexieOptions && dexieOptions.length > 0 ? "text-green-400" : "text-red-400"}>
                   {dexieOptions && dexieOptions.length > 0 ? "DEXIE OK" : "DEXIE EMPTY"}
                 </span>
               </div>
               
               <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mb-2">
                 <div>ITEM ID: <span className="text-white">{targetItemId}</span></div>
                 <div>LOADING: <span className={isRemoteLoading ? "text-yellow-400 animate-pulse" : "text-slate-500"}>{isRemoteLoading ? "YES" : "NO"}</span></div>
                 <div>REMOTE: <span className={remoteData ? "text-green-400" : "text-slate-500"}>{remoteData ? \`YES (\${remoteData.length})\` : "NO"}</span></div>
                 <div>SOURCE: <span className="text-white font-bold">{dexieOptions && dexieOptions.length ? 'DEXIE' : remoteData ? 'SUPABASE' : 'NONE'}</span></div>
               </div>
               
               ${debuggerCode}
             </div>
          )}
`;
        content = pre + newDebugger + '\n' + post;
        console.log("Updated Visual Debugger JSX.");
    } else {
        console.warn("Could not find Debugger block to update.");
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully patched ModifierModal to v2.3.7.');

} catch (e) {
    console.error("Patch script failed:", e);
}
