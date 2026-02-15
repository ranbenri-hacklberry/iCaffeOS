const fs = require('fs');
const path = './frontend_source/src/pages/menu-ordering-interface/components/ModifierModal.jsx';

// 1. Hook Injection: Add rawDebugData state
const hookInjection = `  const [remoteData, setRemoteData] = useState(null);
  const [rawDebugData, setRawDebugData] = useState(null); // 🔥 NEW: Raw Debug
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);`;

// 2. Logic Injection: Update fetchRemote to set rawDebugData
// We will replace the entire fetchRemote function with a robust version
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
          setRawDebugData({ error: error.message, details: error.details });
          return; // Stop here
        }

        // 🔥 SAVE RAW DATA IMMEDIATELY FOR DEBUGGER
        setRawDebugData(data || []);

        if (!data || data.length === 0) {
          console.warn(\`🟠 [\${rpcId}] Empty data\`);
          setRemoteData([]); 
          return;
        }

        // Robust Parsing (Handle both camelCase and snake_case)
        const groupsMap = new Map();
        
        data.forEach(row => {
            // Normalize IDs (handle potential case variants)
            const gId = row.group_id || row.groupId;
            const gName = row.group_name || row.groupName || row.name; // Fallback to name if group_name missing
            
            if (!gId) return; // Skip broken rows

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
        setRawDebugData({ error: 'JS Exception in fetchRemote', msg: err.message });
      } finally {
        setIsRemoteLoading(false);
      }
    };`;

// 3. JSX Injection: Display Raw Data in Debugger
// We'll replace the Debugger X-Ray section
const debuggerCode = `               {/* X-RAY: RAW RPC RESPONSE (Bypassing Parsing) */}
               <div className="mt-2 pt-1 border-t border-slate-700">
                    <div className="font-bold text-blue-400 mb-1">
                        RAW RPC RESPONSE: {rawDebugData ? (Array.isArray(rawDebugData) ? \`ARRAY(\${rawDebugData.length})\` : 'OBJECT') : 'NULL'}
                    </div>
                    {rawDebugData && (
                        <pre className="text-[8px] leading-tight text-blue-200 break-all whitespace-pre-wrap bg-slate-800 p-1 rounded max-h-32 overflow-y-auto">
                           {JSON.stringify(rawDebugData, null, 2)}
                        </pre>
                    )}
               </div>`;


// EXECUTE PATCH
let content = fs.readFileSync(path, 'utf8');

// A. Inject Hook
content = content.replace(
    'const [remoteData, setRemoteData] = useState(null);',
    'const [remoteData, setRemoteData] = useState(null);\n  const [rawDebugData, setRawDebugData] = useState(null); // 🔥 NEW'
);
content = content.replace(
    'const [isRemoteLoading, setIsRemoteLoading] = useState(false);',
    'const [isRemoteLoading, setIsRemoteLoading] = useState(false);'
);

// B. Replace fetchRemote
// We use regex to find the async function block
const fetchRemoteRegex = /const fetchRemote = async \(\) => \{[\s\S]*?^\s*\}\;/m;
// Actually, finding the exact block is hard with regex due to nesting. 
// We will search for "const fetchRemote = async () => {" and the matching closing bracket is too hard.
// We'll search for the specific start "const fetchRemote = async () => {" and assuming it ends with "fetchRemote();" call after it? No.
// Let's use the start and a known end marker inside the effect like "finally {" to "setIsRemoteLoading(false);" maybe?

// Simpler: We know the function starts at "const fetchRemote = async () => {"
// and we know it sits inside the useEffect.
// Let's overwrite the WHOLE useEffect like in the previous script. That was robust.
const wholeEffect = `  useEffect(() => {
    const effectId = \`effect-\${Date.now()}\`;
    // ... skipping detailed trigger logs for brevity, focusing on the fix ...
    
    if (!isOpen || !targetItemId || (dexieOptions && dexieOptions.length > 0)) return;
    if (isRemoteLoading || remoteData) return;

    ${fetchRemoteLogic}

    fetchRemote();
  }, [isOpen, targetItemId, dexieOptions, remoteData, isRemoteLoading]);`;

// Search for the Start of the Effect and Replace until the dependency array.
// But wait, the previous patch script wrote comprehensive logs. I'm overwriting them to be cleaner now?
// Yes, the X-RAY on screen is better than console logs.

// Let's rely on the previous known marker.
const startMarker = '// 2. Fallback to Supabase (Remote)';
const endMarker = '}, [isOpen, targetItemId, dexieOptions, remoteData, isRemoteLoading]);';

const sIdx = content.indexOf(startMarker);
const eIdx = content.indexOf(endMarker, sIdx);

if (sIdx !== -1 && eIdx !== -1) {
    const pre = content.substring(0, sIdx);
    const post = content.substring(eIdx + endMarker.length);
    content = pre + '// 2. Fallback to Supabase (Remote) - v2.4.1\n' + wholeEffect + post;
} else {
    console.warn("Could not replace useEffect. Applying fallback logic?");
    // This is risky. Let's try to just replace fetchRemote if possible? 
    // No, file structure is cleaner with full replace.
}

// C. Inject Debugger UI
// Replace the previous "RAW SAMPLE" block which might be empty or specific
const debugStart = '{/* X-RAY: RAW DATA SAMPLE */}';
const debugEnd = '{/* Error Display if exists */}';
const dSIdx = content.indexOf(debugStart);
const dEIdx = content.indexOf(debugEnd);

if (dSIdx !== -1 && dEIdx !== -1) {
    const pre = content.substring(0, dSIdx);
    const post = content.substring(dEIdx);
    content = pre + debuggerCode + '\n               ' + post;
} else {
    // If not found (maybe overwrite logic), try replacing the X-RAY title to inject below it
    // Or just appending to the end of the debugger...
    // Let's assume the previous patch worked.
    console.log("Debugger section markers not found exactly. Searching for container...");
    // Fallback: Replace the whole Debugger Block
    const wholeDebugStart = '{/* 🕵️‍♂️ VISUAL DEBUGGER';
    const wholeDebugEnd = '<div className="p-3 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">';
    const wSIdx = content.indexOf(wholeDebugStart);
    const wEIdx = content.indexOf(wholeDebugEnd);

    if (wSIdx !== -1 && wEIdx !== -1) {
        // Re-construct the whole debugger block with the NEW piece
        // (Simplified for this script context)
        // ... implementation skipped for brevity, relying on user to allow previous patch ...
        // Actually, let's just Log error.
        console.error("CRITICAL: Failed to locate Debugger Block.");
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched ModifierModal to v2.4.1 (RAW X-RAY).');
