const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

// 1. Hook Injection: Add valid debug steps state
const hookFind = 'const [rawDebugData, setRawDebugData] = useState(null);';
const hookReplace = `const [rawDebugData, setRawDebugData] = useState(null);
  const [debugStep, setDebugStep] = useState('IDLE'); // 🔥 NEW: Step Tracker`;

// 2. Logic Injection: MANUAL FETCH SEQUENCE
const fetchRemoteLogic = `    const fetchRemote = async () => {
      setIsRemoteLoading(true);
      setRawDebugData(null); 
      setDebugStep('INIT');

      // Helper for safely logging steps
      const updateStep = (step, data = null) => {
        console.log(\`🪜 STEP: \${step}\`);
        setDebugStep(step);
        if (data) setRawDebugData(prev => Array.isArray(prev) ? [...prev, { step, data }] : [{ step, data }]);
      };

      try {
        const tId = Number(targetItemId);

        // A. PING
        updateStep('PING_DB');
        const { count, error: pingErr } = await supabase
            .from('menu_items')
            .select('*', { count: 'exact', head: true })
            .limit(1);
        
        if (pingErr) throw new Error(\`Ping Failed: \${pingErr.message}\`);
        updateStep('PING_OK');

        // B. FETCH GROUPS (Direct)
        updateStep('FETCH_GROUPS');
        // Get Private Groups
        const { data: privGroups, error: gErr } = await supabase
            .from('optiongroups')
            .select('*')
            .eq('menu_item_id', tId);
            
        if (gErr) throw new Error(\`Groups Fetch Failed: \${gErr.message}\`);
        
        // Get Linked Groups
        const { data: links } = await supabase
            .from('menuitemoptions')
            .select('group_id')
            .eq('item_id', tId);
            
        let sharedGroups = [];
        if (links && links.length > 0) {
            const linkIds = links.map(l => l.group_id);
            const { data: sGroups } = await supabase
                .from('optiongroups')
                .select('*')
                .in('id', linkIds);
            sharedGroups = sGroups || [];
        }

        const allGroups = [...(privGroups || []), ...sharedGroups];
        updateStep(\`GOT_\${allGroups.length}_GROUPS\`, allGroups);

        if (allGroups.length === 0) {
            setRemoteData([]);
            return;
        }

        // C. FETCH VALUES (Direct)
        const groupIds = allGroups.map(g => g.id);
        updateStep('FETCH_VALUES', { groupIds }); // Log IDs being requested

        const { data: allValues, error: vErr } = await supabase
            .from('optionvalues')
            .select('*')
            .in('group_id', groupIds);

        if (vErr) throw new Error(\`Values Fetch Failed: \${vErr.message}\`);

        updateStep(\`GOT_\${allValues?.length || 0}_VALUES\`, allValues);

        // D. MERGE IN MEMORY
        const result = allGroups.map(g => ({
            ...g,
            values: (allValues || [])
                .filter(v => v.group_id === g.id)
                .sort((a,b) => (a.display_order||0) - (b.display_order||0))
        }));

        setRemoteData(result);
        updateStep('DONE');

      } catch (err) {
        console.error("Manual Fetch Error:", err);
        setRawDebugData({ error: err.message, step: 'CRASH' });
        setDebugStep('ERROR');
      } finally {
        setIsRemoteLoading(false);
      }
    };`;

const wholeEffect = `  // 2. Fallback to Supabase (MANUAL DIRECT) - v2.3.9
  useEffect(() => {
    if (!isOpen || !targetItemId) return;
    if (dexieOptions && dexieOptions.length > 0) return;
    if (isRemoteLoading || remoteData) return;

    ${fetchRemoteLogic}

    fetchRemote();
  }, [isOpen, targetItemId, dexieOptions, remoteData, isRemoteLoading]);`;


// 3. JSX Injection: Show Steps
const debuggerJSX = `          {/* 🕵️‍♂️ VISUAL DEBUGGER v2.3.9 - MANUAL MODE */}
          {isOpen && (
             <div 
              dir="ltr"
              className="mx-3 mb-2 p-3 bg-slate-900/95 text-green-400 font-mono text-[10px] rounded-xl overflow-hidden shadow-2xl border border-slate-700"
             >
               <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
                 <span className="font-bold text-white">🚧 MANUAL FETCH v2.3.9</span>
                 <button 
                    onClick={(e) => { e.stopPropagation(); setIsRemoteLoading(false); setRemoteData(null); setRawDebugData(null); setDebugStep('RESET'); }}
                    className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] hover:bg-red-500"
                 >
                   RESET
                 </button>
               </div>
               
               <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mb-2">
                 <div>ID: <span className="text-white">{targetItemId}</span></div>
                 <div>STEP: <span className="text-yellow-400 font-bold animate-pulse">{debugStep}</span></div>
                 <div>DATA: <span className={remoteData ? "text-green-400" : "text-slate-500"}>{remoteData ? \`YES (\${remoteData.length})\` : "NO"}</span></div>
               </div>
               
               {/* RAW LOGS */}
               <div className="mt-2 pt-1 border-t border-slate-700 bg-slate-800/50 p-1 rounded max-h-32 overflow-y-auto">
                    <pre className="text-[8px] leading-tight text-blue-200 break-all whitespace-pre-wrap font-mono">
                       {JSON.stringify(rawDebugData, null, 2)}
                    </pre>
               </div>
             </div>
          )}`;


// EXECUTE PATCH
try {
    let content = fs.readFileSync(path, 'utf8');

    // A. Inject Hook
    if (!content.includes('debugStep')) {
        content = content.replace(hookFind, hookReplace);
    }

    // B. Replace Logic (Effect)
    // Find v2.3.8 logic block
    const effStart = '// 2. Fallback to Supabase (Remote) - v2.3.8';
    const effEnd = 'fetchRemote();\n  }, [isOpen, targetItemId, dexieOptions, remoteData, isRemoteLoading]);';

    // We need to match precise end block from previous script
    // actually previous script added newlines.
    // Let's rely on Start Marker and the dependency array line.
    const depArrayLine = '}, [isOpen, targetItemId, dexieOptions, remoteData, isRemoteLoading]);';

    const sIdx = content.indexOf(effStart);
    const eIdx = content.indexOf(depArrayLine, sIdx);

    if (sIdx !== -1 && eIdx !== -1) {
        const before = content.substring(0, sIdx);
        const after = content.substring(eIdx + depArrayLine.length);
        content = before + wholeEffect + after;
        console.log("Replaced useEffect with Manual Logic.");
    } else {
        console.warn("Could not find v2.3.8 Effect block. Check markers.");
    }

    // C. Replace Debugger UI
    // Find previous debugger block
    const dbgStart = '{/* 🕵️‍♂️ VISUAL DEBUGGER';
    const dbgEnd = '<div className="p-3 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">';

    const dSIdx = content.indexOf(dbgStart);
    const dEIdx = content.indexOf(dbgEnd);

    if (dSIdx !== -1 && dEIdx !== -1) {
        const pre = content.substring(0, dSIdx);
        const post = content.substring(dEIdx);
        content = pre + debuggerJSX + '\n' + post;
        console.log("Updated Visual Debugger to Manual Mode.");
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully patched ModifierModal to v2.3.9.');

} catch (e) {
    console.error("Patch script failed:", e);
}
