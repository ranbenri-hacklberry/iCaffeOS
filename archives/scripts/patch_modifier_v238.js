const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

// 1. Logic Injection: Fetch with Timeout
const fetchRemoteLogic = `    const fetchRemote = async () => {
      const rpcId = \`rpc-\${Date.now()}\`;
      setIsRemoteLoading(true);
      setRawDebugData(null); 

      // Timeout Promise
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RPC Timeout (5s)')), 5000)
      );

      try {
        console.log(\`🟠 [\${rpcId}] Calling RPC: get_item_modifiers...\`);
        
        // Race between RPC and Timeout
        const { data, error } = await Promise.race([
          supabase.rpc('get_item_modifiers', { target_item_id: targetItemId }),
          timeout
        ]);

        if (error) {
          console.error(\`🟠 [\${rpcId}] RPC Error:\`, error);
          setRawDebugData({ error: error.message, details: error.details });
          return; 
        }

        const safeRaw = data || [];
        setRawDebugData(safeRaw);
        console.log(\`🟠 [\${rpcId}] RAW DATA RECEIVED:\`, safeRaw.length, 'records');

        if (!data || data.length === 0) {
          console.warn(\`🟠 [\${rpcId}] Empty data returned from RPC\`);
          setRemoteData([]); 
          return;
        }

        // ... Parsing Logic (Simplified for stability) ...
        const groupsMap = new Map();
        data.forEach(row => {
            const gId = row.group_id || row.groupId;
            const gName = row.group_name || row.groupName || row.name; 
            if (!gId) return; 

            if (!groupsMap.has(gId)) {
                groupsMap.set(gId, {
                    id: gId, name: gName, is_required: row.is_required, 
                    is_multiple_select: row.is_multiple_select, values: []
                });
            }
            const vId = row.value_id || row.valueId;
            if (vId) {
                const group = groupsMap.get(gId);
                const vName = row.value_name || row.valueName || row.name || 'Unknown';
                if (!group.values.some(v => v.id === vId)) {
                    group.values.push({
                        id: vId, group_id: gId, name: vName, 
                        priceAdjustment: row.price_adjustment || 0,
                        display_order: row.value_display_order || 999
                    });
                }
            }
        });

        const enhanced = Array.from(groupsMap.values()).map(g => ({
             ...g, values: g.values.sort((a,b) => (a.display_order||0)-(b.display_order||0))
        }));

        setRemoteData(enhanced);

      } catch (err) {
        console.error(\`🟠 [\${rpcId}] EXCEPTION:\`, err);
        setRawDebugData({ error: 'TIMEOUT/EXCEPTION', msg: err.message });
      } finally {
        setIsRemoteLoading(false);
      }
    };`;

// 2. JSX Injection: Add Reset Button
const debuggerJSX = `          {/* 🕵️‍♂️ VISUAL DEBUGGER v2.3.8 - TIMEOUT EDIT */}
          {isOpen && (
             <div 
              dir="ltr"
              className="mx-3 mb-2 p-3 bg-slate-900/95 text-green-400 font-mono text-[10px] rounded-xl overflow-hidden shadow-2xl border border-slate-700"
             >
               <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
                 <span className="font-bold text-white">🚧 DEBUG v2.3.8</span>
                 <button 
                    onClick={(e) => { e.stopPropagation(); setIsRemoteLoading(false); setRemoteData(null); setRawDebugData(null); }}
                    className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] hover:bg-red-500"
                 >
                   RESET
                 </button>
               </div>
               
               <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mb-2">
                 <div>ID: <span className="text-white">{targetItemId}</span></div>
                 <div>LOAD: <span className={isRemoteLoading ? "text-yellow-400 animate-pulse" : "text-slate-500"}>{isRemoteLoading ? "YES" : "NO"}</span></div>
                 <div>DATA: <span className={remoteData ? "text-green-400" : "text-slate-500"}>{remoteData ? \`YES (\${remoteData.length})\` : "NO"}</span></div>
               </div>
               
               {/* X-RAY: RAW RPC RESPONSE v2.3.8 */}
               <div className="mt-2 pt-1 border-t border-slate-700 bg-slate-800/50 p-1 rounded">
                    <div className="font-bold text-blue-400 mb-1 text-[9px]">
                        X-RAY ({rawDebugData ? (Array.isArray(rawDebugData) ? rawDebugData.length + ' rows' : 'OBJ') : 'WAITING...'}):
                    </div>
                    {rawDebugData && (
                        <pre className="text-[8px] leading-tight text-blue-200 break-all whitespace-pre-wrap bg-black/50 p-1 rounded max-h-32 overflow-y-auto font-mono">
                           {JSON.stringify(rawDebugData.slice ? rawDebugData.slice(0, 2) : rawDebugData, null, 2)}
                           {Array.isArray(rawDebugData) && rawDebugData.length > 2 && \`\\n... (+\${rawDebugData.length - 2} more)\`}
                        </pre>
                    )}
               </div>
             </div>
          )}`;


// EXECUTE PATCH
try {
    let content = fs.readFileSync(path, 'utf8');

    // Replace fetchRemote Logic - Searching for the Timeout Edit marker or previous marker
    // We'll search for the unique "const rpcId" line
    const funcStartSignature = 'const rpcId = `rpc-${Date.now()}`;';
    const funcEndSignature = 'setIsRemoteLoading(false);';

    // We need to match the ENTIRE function block.
    // Let's replace the whole useEffect block again to be safe.
    const effStart = '// 2. Fallback to Supabase (Remote) - v2.3.7'; // From previous patch
    const effEnd = '// 3. Merge and Deduplicate Final results';

    const sIdx = content.indexOf(effStart);
    const eIdx = content.indexOf(effEnd);

    if (sIdx !== -1 && eIdx !== -1) {
        const before = content.substring(0, sIdx);
        const after = content.substring(eIdx);

        const newEffectBlock = `// 2. Fallback to Supabase (Remote) - v2.3.8
  useEffect(() => {
    if (!isOpen || !targetItemId) return;
    if (dexieOptions && dexieOptions.length > 0) return;
    if (isRemoteLoading || remoteData) return;

${fetchRemoteLogic}

    fetchRemote();
  }, [isOpen, targetItemId, dexieOptions, remoteData, isRemoteLoading]);`;

        content = before + newEffectBlock + '\n\n  ' + after;
        console.log("Replaced useEffect logic with Timeout.");
    } else {
        console.warn("Could not find v2.3.7 useEffect block. Checking for original...");
    }

    // Replace Debugger UI
    const dbgStart = '{/* 🕵️‍♂️ VISUAL DEBUGGER';
    const dbgEnd = '<div className="p-3 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">';

    const dSIdx = content.indexOf(dbgStart);
    const dEIdx = content.indexOf(dbgEnd);

    if (dSIdx !== -1 && dEIdx !== -1) {
        const pre = content.substring(0, dSIdx);
        const post = content.substring(dEIdx);
        content = pre + debuggerJSX + '\n' + post;
        console.log("Updated Visual Debugger JSX with RESET button.");
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully patched ModifierModal to v2.3.8.');

} catch (e) {
    console.error("Patch script failed:", e);
}
